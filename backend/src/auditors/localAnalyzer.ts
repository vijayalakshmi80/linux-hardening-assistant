/**
 * Local rule-based security analyzer.
 *
 * Used when GEMINI_API_KEY is not configured.
 * Runs deterministic checks on audit output and generates findings,
 * a score, a fix script, and recommendations.
 *
 * No AI calls. No network required.
 */

import type { AuditData, AuditFinding, AnalysisReport } from '../utils/types';
import { calculateScore, classifyFindings } from './scoreEngine';
import { generateFixScript } from './fixScriptGenerator';

// ── Rule definitions ──────────────────────────────────────────────────────────

interface Rule {
  key: string;
  check: (output: string) => boolean;
  finding: Omit<AuditFinding, 'weight'> & { weight: number };
}

const RULES: Rule[] = [
  // ── SSH: root login ──────────────────────────────────────────────────────
  {
    key: 'ssh_root_login',
    check: (out) => /PermitRootLogin\s+yes/i.test(out),
    finding: {
      issue_name: 'Root SSH Login Enabled',
      severity: 'High',
      explanation:
        'PermitRootLogin is set to "yes". Direct root access over SSH dramatically increases the blast radius of credential compromise and automated brute-force attacks.',
      fix_command:
        "sudo sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config && sudo systemctl restart ssh",
      recommendation:
        'Disable root SSH login. Use a regular user account and escalate with sudo when needed.',
      weight: 15,
    },
  },

  // ── SSH: password auth ───────────────────────────────────────────────────
  {
    key: 'ssh_password_auth',
    check: (out) => /PasswordAuthentication\s+yes/i.test(out),
    finding: {
      issue_name: 'SSH Password Authentication Enabled',
      severity: 'High',
      explanation:
        'Password authentication is enabled on SSH. This exposes the service to brute-force and credential-stuffing attacks.',
      fix_command:
        "sudo sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config && sudo systemctl restart ssh",
      recommendation:
        'Switch to SSH key-based authentication. Disable password auth after confirming key access works.',
      weight: 15,
    },
  },

  // ── Firewall: UFW disabled ───────────────────────────────────────────────
  {
    key: 'ufw_status',
    check: (out) =>
      out.includes('Status: inactive') ||
      out.includes('UFW_NOT_INSTALLED') ||
      out.trim() === '',
    finding: {
      issue_name: 'Host Firewall (UFW) Disabled',
      severity: 'Medium',
      explanation:
        'UFW is not active. All listening services are network-exposed without host-level packet filtering.',
      fix_command:
        'sudo ufw default deny incoming && sudo ufw default allow outgoing && sudo ufw allow 22/tcp && sudo ufw --force enable',
      recommendation:
        'Enable UFW with a default-deny inbound policy. Explicitly allow only required ports.',
      weight: 10,
    },
  },

  // ── Fail2Ban not running ─────────────────────────────────────────────────
  {
    key: 'fail2ban_status',
    check: (out) => out !== 'active' && !out.includes('active'),
    finding: {
      issue_name: 'Fail2Ban Not Running',
      severity: 'Medium',
      explanation:
        'Fail2Ban is not active. Without it, brute-force attempts against SSH and other services are not automatically blocked.',
      fix_command:
        'sudo apt-get install -y fail2ban && sudo systemctl enable fail2ban && sudo systemctl start fail2ban',
      recommendation:
        'Install and enable Fail2Ban with SSH jail rules to automatically ban repeated authentication failures.',
      weight: 8,
    },
  },

  // ── Auditd not running ───────────────────────────────────────────────────
  {
    key: 'auditd_status',
    check: (out) => out !== 'active' && !out.includes('active'),
    finding: {
      issue_name: 'Auditd Logging Not Running',
      severity: 'Low',
      explanation:
        'The Linux audit daemon (auditd) is not active. Privileged actions, file accesses, and authentication events will not be logged for forensic review.',
      fix_command:
        'sudo apt-get install -y auditd && sudo systemctl enable auditd && sudo systemctl start auditd',
      recommendation:
        'Enable auditd and configure audit rules for critical files (/etc/passwd, /etc/sudoers) and privileged command execution.',
      weight: 5,
    },
  },

  // ── Dangerous open ports (MySQL / Redis / Postgres / Mongo on 0.0.0.0) ──
  {
    key: 'open_ports',
    check: (out) =>
      /0\.0\.0\.0:(3306|5432|6379|27017|6380)\s/.test(out),
    finding: {
      issue_name: 'Database / Cache Exposed on All Interfaces',
      severity: 'Critical',
      explanation:
        'A database or caching service (MySQL/PostgreSQL/Redis/MongoDB) is listening on 0.0.0.0. If the firewall is disabled, this service is reachable from any host on the network.',
      fix_command:
        "# Bind MySQL/Postgres to localhost in their config files, then:\nsudo systemctl restart mysql 2>/dev/null; sudo systemctl restart postgresql 2>/dev/null; sudo systemctl restart redis 2>/dev/null",
      recommendation:
        'Bind database and cache services to 127.0.0.1. Use a firewall rule to allow only trusted IPs if remote access is required.',
      weight: 20,
    },
  },

  // ── World-writable files ─────────────────────────────────────────────────
  {
    key: 'world_writable_files',
    check: (out) => out !== 'NONE' && out.trim() !== '' && !out.startsWith('ERROR'),
    finding: {
      issue_name: 'World-Writable Files in Sensitive Directories',
      severity: 'Medium',
      explanation:
        'One or more files in /etc, /usr/bin, or /usr/sbin are world-writable. Any local user could modify these files, potentially leading to privilege escalation.',
      fix_command:
        "find /etc /usr/bin /usr/sbin -maxdepth 2 -perm -o+w -not -type l -exec chmod o-w {} \\;",
      recommendation:
        'Remove world-write permissions from sensitive directories. Run periodic permission audits.',
      weight: 10,
    },
  },

  // ── Password policy ──────────────────────────────────────────────────────
  {
    key: 'password_policy',
    check: (out) =>
      out.includes('NOT_FOUND') ||
      (() => {
        const maxMatch = out.match(/PASS_MAX_DAYS\s+(\d+)/);
        if (maxMatch) {
          const days = parseInt(maxMatch[1], 10);
          return days > 90 || days === 0 || days === 99999;
        }
        return true;
      })(),
    finding: {
      issue_name: 'Weak Password Aging Policy',
      severity: 'Low',
      explanation:
        'Password aging policy is not configured or maximum password age exceeds 90 days, increasing the exposure window for compromised credentials.',
      fix_command:
        "sudo sed -i 's/^PASS_MAX_DAYS.*/PASS_MAX_DAYS   90/' /etc/login.defs && sudo sed -i 's/^PASS_MIN_DAYS.*/PASS_MIN_DAYS   1/' /etc/login.defs",
      recommendation:
        'Set PASS_MAX_DAYS to 90 and PASS_MIN_DAYS to 1 in /etc/login.defs. Consider using PAM for password complexity enforcement.',
      weight: 3,
    },
  },

  // ── Pending updates ──────────────────────────────────────────────────────
  {
    key: 'pending_updates',
    check: (out) => {
      const n = parseInt(out.trim(), 10);
      return !isNaN(n) && n > 1; // apt list --upgradable includes header line
    },
    finding: {
      issue_name: 'Pending System Updates',
      severity: 'Medium',
      explanation:
        'Security patches and system updates are available but not applied. Unpatched systems are vulnerable to known CVEs.',
      fix_command: 'sudo apt-get update && sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y',
      recommendation:
        'Apply pending updates promptly. Enable unattended-upgrades for automatic security patch installation.',
      weight: 7,
    },
  },

  // ── File permissions on critical files ──────────────────────────────────
  {
    key: 'file_permissions',
    check: (out) => {
      // shadow should be 640 or 000, passwd should be 644
      if (out.includes('STAT_FAILED')) return false;
      const lines = out.split('\n');
      for (const line of lines) {
        if (line.includes('/etc/shadow')) {
          const perm = line.split(' ')[0];
          if (perm && parseInt(perm, 8) > parseInt('640', 8)) return true;
        }
      }
      return false;
    },
    finding: {
      issue_name: 'Insecure /etc/shadow Permissions',
      severity: 'High',
      explanation:
        '/etc/shadow has overly permissive file permissions. This file contains hashed passwords and should only be readable by root.',
      fix_command: 'sudo chmod 640 /etc/shadow && sudo chown root:shadow /etc/shadow',
      recommendation:
        'Set /etc/shadow to 640 (root:shadow). Verify /etc/passwd is 644 and /etc/sudoers is 440.',
      weight: 12,
    },
  },
];

// ── Analyzer ──────────────────────────────────────────────────────────────────

export function runLocalAnalysis(auditData: AuditData): AnalysisReport {
  const results = auditData.audit_results;
  const findings: AuditFinding[] = [];

  for (const rule of RULES) {
    const auditResult = results[rule.key];
    if (!auditResult) continue;
    const output = auditResult.output ?? '';
    if (rule.check(output)) {
      findings.push(rule.finding);
    }
  }

  const scoreBreakdown = calculateScore(findings);
  const findingsBySeverity = classifyFindings(findings);
  const fixScript = generateFixScript(findings);

  const highCount = findingsBySeverity.High.length + findingsBySeverity.Critical.length;
  const medCount  = findingsBySeverity.Medium.length;

  const summary = findings.length === 0
    ? 'No significant security issues detected. The server appears well-hardened based on the available checks.'
    : `Detected ${findings.length} security issue(s): ${highCount} high/critical, ${medCount} medium. Immediate remediation is recommended for high-severity findings.`;

  const execSummary = `Local rule-based analysis of ${auditData.host} yielded a security score of ${scoreBreakdown.final}/100 (${scoreBreakdown.grade}). `
    + (findings.length > 0
      ? `${findings.length} issue(s) were identified. Review the findings and apply the generated fix script.`
      : 'The server passed all automated checks.');

  const priorityActions = findings
    .filter((f) => f.severity === 'Critical' || f.severity === 'High')
    .slice(0, 5)
    .map((f) => f.issue_name);

  const workflowSteps: import('../utils/types').WorkflowStep[] = [
    {
      step: 'collect_data',
      status: 'success',
      message: `Audit data collected from ${auditData.host}.`,
      data: { checks: Object.keys(results).length },
      timestamp: new Date().toISOString(),
    },
    {
      step: 'local_analysis',
      status: 'success',
      message: 'Gemini API key not configured. Using local rule-based analysis.',
      data: { findings: findings.length },
      timestamp: new Date().toISOString(),
    },
    {
      step: 'score_calculation',
      status: 'success',
      message: `Security score: ${scoreBreakdown.final}/100 (${scoreBreakdown.grade}).`,
      data: {
        base: scoreBreakdown.base,
        critical_deductions: scoreBreakdown.critical_deductions,
        high_deductions: scoreBreakdown.high_deductions,
        medium_deductions: scoreBreakdown.medium_deductions,
        low_deductions: scoreBreakdown.low_deductions,
        final: scoreBreakdown.final,
        grade: scoreBreakdown.grade,
      },
      timestamp: new Date().toISOString(),
    },
    {
      step: 'fix_script',
      status: 'success',
      message: `Generated fix script with ${findings.length} remediation command(s).`,
      data: { lines: fixScript.split('\n').length },
      timestamp: new Date().toISOString(),
    },
  ];

  return {
    success: true,
    mode: 'local',
    security_score: scoreBreakdown.final,
    score_breakdown: scoreBreakdown,
    grade: scoreBreakdown.grade,
    summary,
    executive_summary: execSummary,
    findings,
    findings_by_severity: findingsBySeverity,
    fix_script: fixScript,
    priority_actions: priorityActions,
    compliance_notes:
      'Results are based on local rule-based checks. For a comprehensive analysis, configure a Gemini API key.',
    verification_notes: 'Local analysis mode — Gemini API not available.',
    workflow_steps: workflowSteps,
    audit_data: auditData,
    timestamp: new Date().toISOString(),
  };
}
