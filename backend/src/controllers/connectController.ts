/**
 * POST /api/connect
 * Validates SSH credentials and establishes a connection.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { connectSchema } from '../utils/validators';
import { SSHAuditClient, SSHConnectionError } from '../ssh/sshClient';
import { sessionStore } from '../utils/sessionStore';
import { logger } from '../config/logger';
import { config } from '../config/env';

export async function connectController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = connectSchema.parse({
      ...req.body,
      port: req.body.port ? Number(req.body.port) : 22,
    });

    // Ensure session ID exists
    if (!req.cookies?.sessionId) {
      res.cookie('sessionId', uuidv4(), { httpOnly: true, sameSite: 'lax' });
    }
    const sessionId: string = req.cookies?.sessionId ?? uuidv4();

    // Disconnect existing client if any
    const existing = sessionStore.get(sessionId);
    if (existing.sshClient) {
      existing.sshClient.disconnect();
    }

    const client = new SSHAuditClient({
      host: body.host,
      port: body.port,
      username: body.username,
      password: body.password,
      timeout: config.sshTimeout,
      commandTimeout: config.sshCommandTimeout,
    });

    const result = await client.connect();

    sessionStore.set(sessionId, {
      sshClient: client,
      host: body.host,
      username: body.username,
      connectedAt: new Date().toISOString(),
      isDemo: false,
      auditData: undefined,
      report: undefined,
    });

    logger.info(`Session ${sessionId.substring(0, 8)} connected to ${body.host}`);

    res.json({
      success: true,
      connected: true,
      host: result.host,
      username: result.username,
      message: result.message,
      sessionId,
    });
  } catch (err) {
    if (err instanceof SSHConnectionError) {
      const statusMap: Record<string, number> = {
        auth_error: 401,
        timeout: 504,
        connection_refused: 503,
        host_unreachable: 503,
      };
      res.status(statusMap[err.errorType] ?? 503).json({
        success: false,
        error: err.message,
        error_type: err.errorType,
      });
      return;
    }
    next(err);
  }
}
