/**
 * POST /api/fix-script — Generate and download a fix script.
 * GET  /api/fix-script/download — Download the latest cached fix script.
 */

import { Request, Response, NextFunction } from 'express';
import { sessionStore } from '../utils/sessionStore';
import { generateFixScript } from '../auditors/fixScriptGenerator';
import { logger } from '../config/logger';

export function downloadFixScript(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const sessionId: string = req.cookies?.sessionId ?? '';
    const session = sessionStore.get(sessionId);

    const fixScript = session.fixScript ?? session.report?.fix_script;

    if (!fixScript) {
      res.status(404).json({
        success: false,
        error: 'No fix script available. Run /api/analyze first.',
        error_type: 'no_fix_script',
      });
      return;
    }

    logger.info(`Serving fix script download for session ${sessionId.substring(0, 8)}`);

    res.setHeader('Content-Type', 'application/x-sh');
    res.setHeader('Content-Disposition', 'attachment; filename="fix.sh"');
    res.send(fixScript);
  } catch (err) {
    next(err);
  }
}

export function generateFixScriptFromRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const { findings } = req.body;

    if (!Array.isArray(findings) || findings.length === 0) {
      res.status(400).json({
        success: false,
        error: 'findings array is required.',
        error_type: 'validation_error',
      });
      return;
    }

    const script = generateFixScript(findings);

    res.json({ success: true, fix_script: script });
  } catch (err) {
    next(err);
  }
}
