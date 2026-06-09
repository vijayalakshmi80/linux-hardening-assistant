/**
 * Central route registry.
 * All API routes are prefixed with /api.
 */

import { Router } from 'express';
import { connectController } from '../controllers/connectController';
import { auditController } from '../controllers/auditController';
import { analyzeController } from '../controllers/analyzeController';
import { demoController } from '../controllers/demoController';
import { disconnectController } from '../controllers/disconnectController';
import { downloadFixScript, generateFixScriptFromRequest } from '../controllers/fixScriptController';
import { chatController } from '../controllers/chatController';
import { exportPdfController } from '../controllers/pdfController';
import { listReports, getReport } from '../controllers/reportsController';
import { config } from '../config/env';

const router = Router();

// ── Health & metadata ────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'linux-hardening-assistant',
    timestamp: new Date().toISOString(),
  });
});

router.get('/version', (_req, res) => {
  res.json({
    success: true,
    version: '2.0.0',
    gemini_configured: !!config.geminiApiKey,
    node_env: config.nodeEnv,
  });
});

// ── SSH ──────────────────────────────────────────────────────────────────────
router.post('/connect', connectController);
router.post('/audit', auditController);
router.post('/disconnect', disconnectController);

// ── Analysis ─────────────────────────────────────────────────────────────────
router.post('/analyze', analyzeController);

// ── Demo ─────────────────────────────────────────────────────────────────────
router.post('/demo', demoController);

// ── Fix Script ────────────────────────────────────────────────────────────────
router.get('/fix-script/download', downloadFixScript);
router.post('/fix-script', generateFixScriptFromRequest);

// ── AI Chat ───────────────────────────────────────────────────────────────────
router.post('/chat', chatController);

// ── PDF Export ────────────────────────────────────────────────────────────────
router.get('/export-pdf', exportPdfController);

// ── Reports / History ─────────────────────────────────────────────────────────
router.get('/reports', listReports);
router.get('/reports/:id', getReport);

export default router;
