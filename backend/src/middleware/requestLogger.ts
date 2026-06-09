/**
 * HTTP request logging middleware using morgan + winston.
 */

import morgan from 'morgan';
import { logger } from '../config/logger';

// Pipe morgan output into winston
const stream = {
  write: (message: string) => logger.http(message.trim()),
};

export const requestLogger = morgan('combined', { stream });
