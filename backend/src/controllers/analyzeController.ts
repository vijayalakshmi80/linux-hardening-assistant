/**
 * POST /api/analyze
 * Runs full AI (Gemini) or local analysis on collected audit data.
 * Falls back gracefully if Gemini is not configured.
 */

import { Request, Response, NextFunction } from 'express';
import { sessionStore } from '../utils/sessionStore';
import { analyzeAuditData } from '../ai/geminiService';
import { generateFixScript } from '../auditors/fixScriptGenerator';
import { saveAuditHistory } from '../services/historyService';
import { saveFixScript } from '../services/fileService';
import { logger } from '../config/logger';
import { config } from '../config/env';

export async function analyzeController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sessionId: string = req.cookies?.sessionId ?? '';

    const session = sessionStore.get(sessionId);

    // Accept audit_data from request body or session cache
    const auditData = (req.body?.audit_data) ?? session.auditData;

    if (!auditData) {
      res.status(400).json({
        success: false,
        error: 'No audit data available. Run /api/audit first.',
        error_type: 'missing_audit_data',
      });
      return;
    }

    const usingGemini = !!config.geminiApiKey;
    logger.info(
      `Analyzing ${auditData.host} — mode: ${usingGemini ? 'gemini' : 'local'}`,
    );

    const report = await analyzeAuditData(auditData);

    // Save fix script to disk
    const scriptName = await saveFixScript(
      report.fix_script,
      sessionId.substring(0, 8),
    );

    // Persist to history database
    const historyId = await saveAuditHistory(auditData, report);

    sessionStore.set(sessionId, {
      report,
      fixScript: report.fix_script,
    });

    logger.info(
      `Analysis complete for ${auditData.host}: score=${report.security_score}, ` +
      `findings=${report.findings.length}, historyId=${historyId}`,
    );

    res.json({
      success: true,
      mode: report.mode,
      gemini_available: usingGemini,
      report: {
        ...report,
        fix_script_filename: scriptName,
        history_id: historyId,
      },
    });
  } catch (err) {
    next(err);
  }
}
