/**
 * POST /api/audit
 * Runs all 16 read-only security audit checks on the connected SSH host.
 */

import { Request, Response, NextFunction } from 'express';
import { sessionStore } from '../utils/sessionStore';
import { SSHConnectionError } from '../ssh/sshClient';
import { logger } from '../config/logger';

export async function auditController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sessionId: string = req.cookies?.sessionId ?? '';

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'No active session. Connect to a server first.',
        error_type: 'not_connected',
      });
      return;
    }

    const session = sessionStore.get(sessionId);

    if (!session.sshClient || !session.sshClient.isConnected()) {
      res.status(400).json({
        success: false,
        error: 'Not connected to any server. Use /api/connect first.',
        error_type: 'not_connected',
      });
      return;
    }

    logger.info(`Running audit on ${session.host} for session ${sessionId.substring(0, 8)}`);

    const auditData = await session.sshClient.runAudit();

    sessionStore.set(sessionId, { auditData });

    logger.info(
      `Audit complete for ${session.host}: ${Object.keys(auditData.audit_results).length} checks, ` +
      `${auditData.errors.length} error(s).`,
    );

    res.json({
      success: true,
      audit: auditData,
      checks_run: Object.keys(auditData.audit_results).length,
      errors: auditData.errors.length,
    });
  } catch (err) {
    if (err instanceof SSHConnectionError) {
      res.status(502).json({
        success: false,
        error: err.message,
        error_type: err.errorType,
      });
      return;
    }
    next(err);
  }
}
