/**
 * Input validation utilities.
 * Validates SSH connection parameters and rejects unsafe inputs.
 */

import { z } from 'zod';

/**
 * Regex for private/LAN IP ranges allowed for localhost-mode:
 *  - 10.x.x.x
 *  - 172.16-31.x.x
 *  - 192.168.x.x
 *  - localhost / 127.x.x.x
 *  - WSL default: 172.x.x.x already covered
 */
const PRIVATE_IP_REGEX =
  /^(localhost|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})$/;

// Also accept hostnames (letters, digits, hyphens, dots)
const HOSTNAME_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;

function isValidHost(val: string): boolean {
  return PRIVATE_IP_REGEX.test(val) || HOSTNAME_REGEX.test(val);
}

export const connectSchema = z.object({
  host: z
    .string()
    .min(1, 'Host is required')
    .max(253, 'Host too long')
    .trim()
    .refine(isValidHost, {
      message: 'Host must be a valid private IP (10.x.x.x, 172.16-31.x.x, 192.168.x.x) or hostname.',
    }),
  port: z
    .number()
    .int()
    .min(1, 'Port must be ≥ 1')
    .max(65535, 'Port must be ≤ 65535')
    .default(22),
  username: z
    .string()
    .min(1, 'Username is required')
    .max(64, 'Username too long')
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(256, 'Password too long'),
});

export const analyzeSchema = z.object({
  audit_data: z.record(z.unknown()).optional(),
});

export const chatSchema = z.object({
  question: z
    .string()
    .min(1, 'Question is required')
    .max(2000, 'Question too long')
    .trim(),
});

export type ConnectInput = z.infer<typeof connectSchema>;
export type AnalyzeInput = z.infer<typeof analyzeSchema>;
export type ChatInput = z.infer<typeof chatSchema>;
