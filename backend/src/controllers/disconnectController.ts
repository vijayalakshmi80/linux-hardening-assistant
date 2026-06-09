/**
 * POST /api/disconnect
 * Terminates the active SSH session and clears the session cache.
 */

import { Request, Response, NextFunction } from 'express';
import { sessionStore } from '../utils/sessionStore';
import { logger } from '../config/logger';

export function disconnectController(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const sessionId: string = req.cookies?.sessionId ?? '';

    if (sessionId) {
      const session = sessionStore.get(sessionId);
      const wasDemo = session.isDemo;
      const host = session.host;

      sessionStore.clear(sessionId);

      logger.info(
        `Session ${sessionId.substring(0, 8)} disconnected (host=${host ?? 'N/A'}, demo=${wasDemo ?? false})`,
      );

      res.json({
        success: true,
        message: wasDemo ? 'Demo mode cleared.' : `Disconnected from ${host ?? 'server'}.`,
      });
      return;
    }

    res.json({ success: true, message: 'No active session.' });
  } catch (err) {
    next(err);
  }
}
