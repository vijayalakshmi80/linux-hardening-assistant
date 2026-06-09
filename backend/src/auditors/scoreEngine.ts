/**
 * Security score engine.
 *
 * Scoring rules (per spec):
 *   Critical: -20
 *   High:     -10
 *   Medium:   -5
 *   Low:      -2
 *
 * Grade thresholds:
 *   Excellent: 90–100
 *   Good:      75–89
 *   Moderate:  60–74
 *   Poor:      40–59
 *   Critical:  0–39
 */

import type { AuditFinding, ScoreBreakdown, FindingsBySeverity, Severity } from '../utils/types';

const DEDUCTIONS: Record<Severity, number> = {
  Critical: 20,
  High: 10,
  Medium: 5,
  Low: 2,
};

export function calculateScore(findings: AuditFinding[]): ScoreBreakdown {
  let criticalDed = 0;
  let highDed = 0;
  let mediumDed = 0;
  let lowDed = 0;

  for (const f of findings) {
    const ded = DEDUCTIONS[f.severity] ?? 0;
    switch (f.severity) {
      case 'Critical': criticalDed += ded; break;
      case 'High':     highDed     += ded; break;
      case 'Medium':   mediumDed   += ded; break;
      case 'Low':      lowDed      += ded; break;
    }
  }

  const totalDed = criticalDed + highDed + mediumDed + lowDed;
  const final = Math.max(0, Math.min(100, 100 - totalDed));

  return {
    base: 100,
    critical_deductions: criticalDed,
    high_deductions: highDed,
    medium_deductions: mediumDed,
    low_deductions: lowDed,
    final,
    grade: getGrade(final),
  };
}

export function getGrade(score: number): ScoreBreakdown['grade'] {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Poor';
  return 'Critical';
}

export function classifyFindings(findings: AuditFinding[]): FindingsBySeverity {
  const result: FindingsBySeverity = { Critical: [], High: [], Medium: [], Low: [] };
  for (const f of findings) {
    if (f.severity in result) {
      result[f.severity].push(f);
    }
  }
  return result;
}
