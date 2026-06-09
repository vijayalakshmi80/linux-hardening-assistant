/**
 * Environment configuration with validation.
 * All settings are loaded from .env and validated at startup.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (one level up from backend/)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function required(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.warn(`[config] WARNING: ${key} is not set. Some features may be unavailable.`);
    return '';
  }
  return val;
}

function optional(key: string, defaultVal: string): string {
  return process.env[key] ?? defaultVal;
}

function optionalInt(key: string, defaultVal: number): number {
  const raw = process.env[key];
  if (!raw) return defaultVal;
  const n = parseInt(raw, 10);
  return isNaN(n) ? defaultVal : n;
}

export const config = {
  port: optionalInt('PORT', 5000),
  nodeEnv: optional('NODE_ENV', 'development'),
  isDev: optional('NODE_ENV', 'development') === 'development',

  // AI
  geminiApiKey: optional('GEMINI_API_KEY', ''),

  // SSH
  sshTimeout: optionalInt('SSH_TIMEOUT', 30000),   // ms
  sshCommandTimeout: optionalInt('SSH_COMMAND_TIMEOUT', 30000), // ms

  // Security
  jwtSecret: optional('JWT_SECRET', 'local-dev-secret-change-me'),

  // Storage
  reportStorage: optional('REPORT_STORAGE', path.resolve(__dirname, '../../../reports')),

  // Session secret
  sessionSecret: optional('SESSION_SECRET', 'local-session-secret'),
} as const;

export type Config = typeof config;
