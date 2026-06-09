/**
 * Linux Hardening Assistant — Express/TypeScript Backend
 *
 * Entry point. Sets up middleware, routes, and error handling.
 * Serves the React frontend build from /public in production.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { config } from './config/env';
import { logger } from './config/logger';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes/index';

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for localhost dev ease
    crossOriginEmbedderPolicy: false,
  }),
);

// ── CORS: localhost only ──────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      'http://localhost:3002', // Vite dev server (Linux Hardening Assistant)
      'http://localhost:3001', // Backend itself (when serving static build)
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3001',
    ],
    credentials: true,
  }),
);

// ── Parsers ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── HTTP logging ──────────────────────────────────────────────────────────────
if (config.isDev) {
  app.use(requestLogger);
}

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Serve React build in production ──────────────────────────────────────────
const publicDir = path.resolve(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({
      message: 'Linux Hardening Assistant API',
      status: 'running',
      frontend: 'Start the Vite dev server: cd frontend && npm run dev',
      docs: '/api/health',
    });
  });
}

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(config.port, '127.0.0.1', () => {
  logger.info(`╔══════════════════════════════════════════╗`);
  logger.info(`║   Linux Hardening Assistant v2.0.0       ║`);
  logger.info(`╠══════════════════════════════════════════╣`);
  logger.info(`║  API:      http://localhost:3001          ║`);
  logger.info(`║  Frontend: http://localhost:3002          ║`);
  logger.info(`║  Gemini:   ${(config.geminiApiKey ? 'Configured ✓' : 'Not configured (local mode)').padEnd(30)} ║`);
  logger.info(`╚══════════════════════════════════════════╝`);
});

export default app;
