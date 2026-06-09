/**
 * GET /api/export-pdf
 * Generates and streams a PDF report for the current session.
 */

import { Request, Response, NextFunction } from 'express';
import PDFDocument from 'pdfkit';
import { sessionStore } from '../utils/sessionStore';
import type { AuditFinding, AnalysisReport } from '../utils/types';
import { logger } from '../config/logger';

// ── Color helpers ─────────────────────────────────────────────────────────────

function severityColor(severity: string): string {
  switch (severity) {
    case 'Critical': return '#7b2d2d';
    case 'High':     return '#c0392b';
    case 'Medium':   return '#e67e22';
    case 'Low':      return '#2980b9';
    default:         return '#555555';
  }
}

function scoreColor(score: number): string {
  if (score >= 90) return '#27ae60';
  if (score >= 75) return '#2ecc71';
  if (score >= 60) return '#f39c12';
  if (score >= 40) return '#e67e22';
  return '#c0392b';
}

// ── PDF builder ───────────────────────────────────────────────────────────────

export function exportPdfController(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const sessionId: string = req.cookies?.sessionId ?? '';
    const session = sessionStore.get(sessionId);
    const report: AnalysisReport | undefined = session.report;

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'No report available. Run analysis first.',
        error_type: 'no_report',
      });
      return;
    }

    const host = session.host ?? report.audit_data?.host ?? 'unknown';
    const filename = `security_report_${host.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;

    logger.info(`Generating PDF for session ${sessionId.substring(0, 8)}, host=${host}`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    const PAGE_WIDTH = doc.page.width - 100;

    // ── Cover / Header ─────────────────────────────────────────────────────
    doc
      .rect(0, 0, doc.page.width, 80)
      .fill('#1e293b')
      .fillColor('#f8fafc')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('Linux Security Audit Report', 50, 28, { width: PAGE_WIDTH });

    doc
      .fontSize(10)
      .fillColor('#94a3b8')
      .text(
        `Generated: ${new Date().toLocaleString()} | Mode: ${report.mode === 'gemini' ? 'AI (Gemini)' : 'Local Analysis'}`,
        50, 56, { width: PAGE_WIDTH },
      );

    doc.moveDown(2);

    // ── Summary row ────────────────────────────────────────────────────────
    const scoreNum = report.security_score;
    doc
      .fillColor(scoreColor(scoreNum))
      .fontSize(36)
      .font('Helvetica-Bold')
      .text(`${scoreNum}`, 50, 100, { width: 80, align: 'center' });

    doc
      .fillColor('#1e293b')
      .fontSize(12)
      .font('Helvetica')
      .text('/100', 50, 140, { width: 80, align: 'center' });

    doc
      .fillColor('#334155')
      .fontSize(10)
      .text(`Grade: ${report.grade}`, 50, 156, { width: 80, align: 'center' });

    doc
      .fontSize(11)
      .fillColor('#1e293b')
      .font('Helvetica')
      .text(`Host: ${host}`, 160, 100)
      .text(`Username: ${session.username ?? report.audit_data?.username ?? 'N/A'}`, 160, 116)
      .text(
        `OS: ${report.audit_data?.server_info?.os_name ?? 'Unknown'}`,
        160, 132,
      )
      .text(
        `Kernel: ${(report.audit_data?.server_info?.kernel ?? 'N/A').substring(0, 70)}`,
        160, 148,
      );

    doc.moveDown(3);

    // ── Executive Summary ──────────────────────────────────────────────────
    doc
      .rect(50, doc.y, PAGE_WIDTH, 16)
      .fill('#f1f5f9')
      .fillColor('#1e293b')
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('Executive Summary', 58, doc.y - 13);

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#334155')
      .text(report.executive_summary || report.summary || 'No summary available.', 50, doc.y, {
        width: PAGE_WIDTH,
        align: 'justify',
      });

    doc.moveDown(1.5);

    // ── Priority Actions ───────────────────────────────────────────────────
    if (report.priority_actions?.length) {
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text('Priority Actions');
      doc.moveDown(0.3);
      for (const action of report.priority_actions) {
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#334155')
          .text(`• ${action}`, 60, doc.y, { width: PAGE_WIDTH - 20 });
      }
      doc.moveDown(1.5);
    }

    // ── Findings by severity ───────────────────────────────────────────────
    for (const severity of ['Critical', 'High', 'Medium', 'Low'] as const) {
      const sFindings: AuditFinding[] = report.findings_by_severity?.[severity] ?? [];
      if (!sFindings.length) continue;

      doc.addPage();

      doc
        .rect(50, 50, PAGE_WIDTH, 20)
        .fill(severityColor(severity))
        .fillColor('#ffffff')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(`${severity} Risk Findings (${sFindings.length})`, 58, 55);

      doc.moveDown(2);

      for (const finding of sFindings) {
        if (doc.y > doc.page.height - 120) doc.addPage();

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor(severityColor(severity))
          .text(`▸ ${finding.issue_name}`);

        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#475569')
          .text(finding.explanation, { width: PAGE_WIDTH });

        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#1e293b')
          .text('Fix Command:', { continued: true })
          .font('Courier')
          .fillColor('#0f172a')
          .text(` ${finding.fix_command}`, { width: PAGE_WIDTH - 10 });

        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#64748b')
          .text(`Recommendation: ${finding.recommendation}`, { width: PAGE_WIDTH });

        doc.moveDown(0.8);
        doc.moveTo(50, doc.y).lineTo(50 + PAGE_WIDTH, doc.y).strokeColor('#e2e8f0').stroke();
        doc.moveDown(0.6);
      }
    }

    // ── Fix Script excerpt ─────────────────────────────────────────────────
    if (report.fix_script) {
      doc.addPage();

      doc
        .rect(50, 50, PAGE_WIDTH, 20)
        .fill('#1e293b')
        .fillColor('#f8fafc')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('Remediation Fix Script (excerpt)', 58, 55);

      doc.moveDown(2);

      const scriptLines = report.fix_script.split('\n').slice(0, 60);
      doc
        .fontSize(7.5)
        .font('Courier')
        .fillColor('#1e293b')
        .text(scriptLines.join('\n'), 50, doc.y, {
          width: PAGE_WIDTH,
          lineGap: 1,
        });

      if (report.fix_script.split('\n').length > 60) {
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#94a3b8')
          .text('... (download full fix.sh for complete script)', 50);
      }
    }

    // ── Compliance Notes ───────────────────────────────────────────────────
    doc.addPage();
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('Compliance & Hardening Notes');
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#334155')
      .text(report.compliance_notes || 'Review all findings and apply the generated fix script.');

    doc.end();
  } catch (err) {
    next(err);
  }
}
