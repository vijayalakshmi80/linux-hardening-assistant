/**
 * Global Express error handling middleware.
 * Catches all unhandled errors and returns consistent JSON responses.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { SSHConnectionError } from '../ssh/sshClient';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    res.status(400).json({
      success: false,
      error: `Validation error: ${messages}`,
      error_type: 'validation_error',
    });
    return;
  }

  // SSH errors
  if (err instanceof SSHConnectionError) {
    const statusMap: Record<string, number> = {
      auth_error: 401,
      timeout: 504,
      connection_refused: 503,
      host_unreachable: 503,
      not_connected: 400,
      command_error: 502,
      command_timeout: 504,
      ssh_error: 502,
    };
    const status = statusMap[err.errorType] ?? 503;
    res.status(status).json({
      success: false,
      error: err.message,
      error_type: err.errorType,
    });
    return;
  }

  // Generic errors
  if (err instanceof Error) {
    logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
    res.status(500).json({
      success: false,
      error: err.message,
      error_type: 'internal_error',
    });
    return;
  }

  // Unknown
  logger.error('Unknown error type:', err);
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred.',
    error_type: 'unknown_error',
  });
}
