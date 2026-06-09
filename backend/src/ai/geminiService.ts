/**
 * Google Gemini AI integration for security analysis.
 *
 * Mode A: Full Gemini AI analysis (when GEMINI_API_KEY is set)
 * Mode B: Falls back to local analysis gracefully when key is absent.
 *
 * Implements retry logic (up to 3 attempts with exponential back-off).
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { logger } from '../config/logger';
import { config } from '../config/env';
import type { AuditData, AuditFinding, AnalysisReport } from '../utils/types';
import { runLocalAnalysis } from '../auditors/localAnalyzer';
import { calculateScore, classifyFindings } from '../auditors/scoreEngine';
import { generateFixScript } from '../auditors/fixScriptGenerator';

// ── Prompt templates ──────────────────────────────────────────────────────────

const ANALYSIS_PROMPT = (auditJson: string) => `
You are an expert Linux Security Auditor.
Analyze the following Linux security audit data and identify ALL security vulnerabilities and misconfigurations.

AUDIT DATA:
${auditJson}

Respond ONLY with a valid JSON object — no markdown, no extra text.
Use this exact schema:
{
  "security_score": <integer 0-100, 100=fully secure, 0=critically insecure>,
  "summary": "<2-3 sentence overall assessment>",
  "findings": [
    {
      "issue_name": "<concise title>",
      "severity": "Critical" | "High" | "Medium" | "Low",
      "explanation": "<why this is a security risk>",
      "fix_command": "<exact bash command to remediate>",
      "recommendation": "<security best practice>",
      "weight": <integer deduction applied to score>
    }
  ]
}

Severity rules:
- Critical: immediate exploitation risk (exposed database, RCE vector)
- High: significantly increases attack surface (root SSH, password auth enabled)
- Medium: indirect or conditional risk (firewall disabled, no fail2ban)
- Low: hardening opportunity (audit logging, password policy)

Include a finding for EVERY misconfiguration found. fix_command must be a single valid bash line.
`.trim();

const VERIFICATION_PROMPT = (auditJson: string, analysisJson: string) => `
You are a Linux Security Auditor performing a second-pass verification.

Review the initial analysis and the raw audit data.
- Remove any false positives
- Correct any wrong fix commands
- Adjust the security score if the initial assessment was too strict or too lenient
- Add any missed findings

ORIGINAL AUDIT DATA:
${auditJson}

INITIAL ANALYSIS:
${analysisJson}

Respond ONLY with valid JSON — no markdown, no extra text.
Same schema as before, plus:
{
  "security_score": <integer>,
  "summary": "<verified summary>",
  "verification_notes": "<what was corrected or confirmed>",
  "findings": [ ... same schema ... ]
}
`.trim();

const FINAL_REPORT_PROMPT = (verifiedJson: string) => `
You are a Linux Security Auditor writing an executive summary.

Based on the verified analysis below, produce a concise final report for a system administrator.

VERIFIED ANALYSIS:
${verifiedJson}

Respond ONLY with valid JSON:
{
  "executive_summary": "<2-3 sentences for management>",
  "priority_actions": ["<action 1>", "<action 2>", "<action 3>"],
  "compliance_notes": "<CIS/NIST hardening notes>"
}
`.trim();

const CHAT_PROMPT = (auditJson: string, reportJson: string, question: string) => `
You are a Linux Security Assistant helping a system administrator understand their audit results.

AUDIT DATA:
${auditJson}

SECURITY REPORT:
${reportJson}

QUESTION: ${question}

Provide a clear, actionable response. If a command is needed, provide the exact bash command.
Keep the response concise but complete.
`.trim();

// ── Helper: JSON extraction ───────────────────────────────────────────────────

function extractJson(text: string): unknown {
  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const cleaned = fenceMatch ? fenceMatch[1].trim() : text.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract the first JSON object
    const braceMatch = cleaned.match(/\{[\s\S]*\}/);
    if (braceMatch) return JSON.parse(braceMatch[0]);
    throw new Error('No valid JSON found in response');
  }
}

function normalizeSeverity(raw: string): AuditFinding['severity'] {
  const s = String(raw).trim();
  if (['Critical', 'High', 'Medium', 'Low'].includes(s)) return s as AuditFinding['severity'];
  const up = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  if (['Critical', 'High', 'Medium', 'Low'].includes(up)) return up as AuditFinding['severity'];
  return 'Low';
}

// ── GeminiAnalysisService ─────────────────────────────────────────────────────

export class GeminiAnalysisService {
  private model: GenerativeModel;
  private readonly maxRetries = 3;

  constructor() {
    if (!config.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
    });
  }

  /**
   * Call Gemini with automatic retry on transient failures.
   */
  private async callWithRetry(prompt: string, attempt = 1): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      if (!text?.trim()) throw new Error('Gemini returned empty response');
      return text.trim();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // Detect quota exceeded (429) errors - don't retry these
      if (errorMessage.includes('429') || errorMessage.includes('quota exceeded') || errorMessage.includes('Too Many Requests')) {
        logger.warn('Gemini quota exceeded, will use local analysis fallback');
        throw new Error('Gemini API quota exceeded. Using local analysis mode instead. Your free tier limit has been reached. Local analysis provides rule-based recommendations without AI.');
      }
      
      // Retry on other transient errors
      if (attempt < this.maxRetries) {
        const delayMs = 1000 * attempt;
        logger.warn(`Gemini attempt ${attempt} failed, retrying in ${delayMs}ms: ${err}`);
        await new Promise((r) => setTimeout(r, delayMs));
        return this.callWithRetry(prompt, attempt + 1);
      }
      throw err;
    }
  }

  private normalizeFindings(raw: unknown[]): AuditFinding[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => ({
        issue_name: String(item['issue_name'] ?? 'Unknown Issue'),
        severity: normalizeSeverity(String(item['severity'] ?? 'Low')),
        explanation: String(item['explanation'] ?? ''),
        fix_command: String(item['fix_command'] ?? ''),
        recommendation: String(item['recommendation'] ?? ''),
        weight: typeof item['weight'] === 'number' ? item['weight'] : 5,
      }));
  }

  // ── 5-step workflow ─────────────────────────────────────────────────────────

  async analyze(auditData: AuditData): Promise<AnalysisReport> {
    const workflowSteps: AnalysisReport['workflow_steps'] = [];
    const ts = () => new Date().toISOString();

    // Step 1: Record data collection
    workflowSteps.push({
      step: 'collect_data',
      status: 'success',
      message: `Audit data collected from ${auditData.host} — ${Object.keys(auditData.audit_results).length} checks.`,
      data: { host: auditData.host, checks: Object.keys(auditData.audit_results).length },
      timestamp: ts(),
    });

    // Step 2: AI Analysis
    let rawAnalysis: Record<string, unknown>;
    try {
      const auditJson = JSON.stringify(auditData, null, 2);
      const raw = await this.callWithRetry(ANALYSIS_PROMPT(auditJson));
      rawAnalysis = extractJson(raw) as Record<string, unknown>;

      workflowSteps.push({
        step: 'analyze',
        status: 'success',
        message: `Gemini identified ${(rawAnalysis['findings'] as unknown[])?.length ?? 0} finding(s).`,
        data: { score: rawAnalysis['security_score'] },
        timestamp: ts(),
      });
    } catch (err) {
      logger.error(`Gemini analysis failed: ${err}`);
      workflowSteps.push({
        step: 'analyze',
        status: 'failed',
        message: `Gemini analysis failed: ${err}. Falling back to local analysis.`,
        data: {},
        timestamp: ts(),
      });
      // Graceful fallback
      const local = runLocalAnalysis(auditData);
      local.workflow_steps = [...workflowSteps, ...local.workflow_steps];
      return local;
    }

    const findings = this.normalizeFindings(rawAnalysis['findings'] as unknown[] ?? []);

    // Step 3: Generate fixes
    const fixScript = generateFixScript(findings);
    workflowSteps.push({
      step: 'generate_fixes',
      status: 'success',
      message: `Generated fix script for ${findings.length} finding(s).`,
      data: { findings: findings.length },
      timestamp: ts(),
    });

    // Step 4: Verify recommendations
    let verifiedFindings = findings;
    let verificationNotes = '';
    let verifiedScore = typeof rawAnalysis['security_score'] === 'number' ? rawAnalysis['security_score'] : 50;

    try {
      const verifyRaw = await this.callWithRetry(
        VERIFICATION_PROMPT(JSON.stringify(auditData, null, 2), JSON.stringify(rawAnalysis, null, 2)),
      );
      const verified = extractJson(verifyRaw) as Record<string, unknown>;
      verifiedFindings = this.normalizeFindings(verified['findings'] as unknown[] ?? []);
      verificationNotes = String(verified['verification_notes'] ?? '');
      if (typeof verified['security_score'] === 'number') {
        verifiedScore = verified['security_score'];
      }

      workflowSteps.push({
        step: 'verify_recommendations',
        status: 'success',
        message: 'Verified and refined recommendations.',
        data: { verification_notes: verificationNotes },
        timestamp: ts(),
      });
    } catch (err) {
      logger.warn(`Gemini verification failed (using initial analysis): ${err}`);
      workflowSteps.push({
        step: 'verify_recommendations',
        status: 'partial',
        message: `Verification skipped due to API error. Using initial findings.`,
        data: {},
        timestamp: ts(),
      });
    }

    // Step 5: Final report
    let executiveSummary = String(rawAnalysis['summary'] ?? '');
    let priorityActions: string[] = [];
    let complianceNotes = 'Review all findings and apply the recommended fixes.';

    try {
      const finalRaw = await this.callWithRetry(
        FINAL_REPORT_PROMPT(JSON.stringify({ security_score: verifiedScore, findings: verifiedFindings, summary: rawAnalysis['summary'] }, null, 2)),
      );
      const finalData = extractJson(finalRaw) as Record<string, unknown>;
      executiveSummary = String(finalData['executive_summary'] ?? executiveSummary);
      priorityActions = Array.isArray(finalData['priority_actions'])
        ? (finalData['priority_actions'] as unknown[]).map(String)
        : verifiedFindings.filter((f) => f.severity === 'Critical' || f.severity === 'High').slice(0, 5).map((f) => f.issue_name);
      complianceNotes = String(finalData['compliance_notes'] ?? complianceNotes);

      workflowSteps.push({
        step: 'produce_final_report',
        status: 'success',
        message: 'Executive report generated.',
        data: {},
        timestamp: ts(),
      });
    } catch (err) {
      logger.warn(`Final report generation failed: ${err}`);
      priorityActions = verifiedFindings
        .filter((f) => f.severity === 'Critical' || f.severity === 'High')
        .slice(0, 5)
        .map((f) => f.issue_name);

      workflowSteps.push({
        step: 'produce_final_report',
        status: 'partial',
        message: 'Using fallback executive summary.',
        data: {},
        timestamp: ts(),
      });
    }

    // Recompute score using our deterministic engine for consistency
    const scoreBreakdown = calculateScore(verifiedFindings);
    const finalScore = Math.round((verifiedScore + scoreBreakdown.final) / 2);
    const findingsBySeverity = classifyFindings(verifiedFindings);
    const verifiedFixScript = generateFixScript(verifiedFindings);

    return {
      success: true,
      mode: 'gemini',
      security_score: Math.max(0, Math.min(100, finalScore)),
      score_breakdown: { ...scoreBreakdown, final: Math.max(0, Math.min(100, finalScore)) },
      grade: scoreBreakdown.grade,
      summary: String(rawAnalysis['summary'] ?? ''),
      executive_summary: executiveSummary,
      findings: verifiedFindings,
      findings_by_severity: findingsBySeverity,
      fix_script: verifiedFixScript || fixScript,
      priority_actions: priorityActions,
      compliance_notes: complianceNotes,
      verification_notes: verificationNotes,
      workflow_steps: workflowSteps,
      audit_data: auditData,
      timestamp: new Date().toISOString(),
    };
  }

  async chat(question: string, auditData: AuditData, report: AnalysisReport): Promise<string> {
    const prompt = CHAT_PROMPT(
      JSON.stringify(auditData, null, 2),
      JSON.stringify({ security_score: report.security_score, findings: report.findings, summary: report.summary }, null, 2),
      question,
    );
    return this.callWithRetry(prompt);
  }
}

// ── Factory: choose Gemini or local ──────────────────────────────────────────

export async function analyzeAuditData(auditData: AuditData): Promise<AnalysisReport> {
  if (!config.geminiApiKey) {
    logger.info('GEMINI_API_KEY not configured — using local rule-based analysis.');
    return runLocalAnalysis(auditData);
  }

  try {
    const service = new GeminiAnalysisService();
    return await service.analyze(auditData);
  } catch (err) {
    logger.warn(`Gemini service failed, falling back to local analysis: ${err}`);
    return runLocalAnalysis(auditData);
  }
}
