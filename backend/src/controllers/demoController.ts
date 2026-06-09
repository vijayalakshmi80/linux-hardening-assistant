/**
 * POST /api/demo
 * Loads sample audit data and pre-built report — no SSH or Gemini required.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { buildDemoReport } from '../demo/demoData';
import { sessionStore } from '../utils/sessionStore';
import { saveAuditHistory } from '../services/historyService';
import { saveFixScript } from '../services/fileService';
import { logger } from '../config/logger';

export async function demoController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Ensure session
    let sessionId: string = req.cookies?.sessionId ?? '';
    if (!sessionId) {
      sessionId = uuidv4();
      res.cookie('sessionId', sessionId, { httpOnly: true, sameSite: 'lax' });
    }

    const { audit, report } = buildDemoReport();

    // Save fix script to disk
    const scriptName = await saveFixScript(report.fix_script, `demo_${sessionId.substring(0, 8)}`);

    // Persist to history
    const historyId = await saveAuditHistory(audit, report);

    sessionStore.set(sessionId, {
      auditData: audit,
      report,
      fixScript: report.fix_script,
      host: audit.host,
      username: audit.username,
      isDemo: true,
    });

    logger.info(`Demo mode loaded for session ${sessionId.substring(0, 8)}`);

    res.json({
      success: true,
      demo_mode: true,
      message: 'Demo Mode: No real SSH connection is being used.',
      audit,
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
