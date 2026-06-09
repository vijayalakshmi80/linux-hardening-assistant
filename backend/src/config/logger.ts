/**
 * Winston logger configuration.
 * Logs are written to console (and optionally files) based on NODE_ENV.
 */

import winston from 'winston';
import { config } from './env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}] ${stack ?? message}`;
});

export const logger = winston.createLogger({
  level: config.isDev ? 'debug' : 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    config.isDev ? colorize() : winston.format.uncolorize(),
    logFormat,
  ),
  transports: [new winston.transports.Console()],
});
