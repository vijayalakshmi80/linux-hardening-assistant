/**
 * POST /api/chat
 * Chat with audit results using Gemini AI.
 * Returns a helpful error if Gemini is not configured.
 */

import { Request, Response, NextFunction } from 'express';
import { sessionStore } from '../utils/sessionStore';
import { GeminiAnalysisService } from '../ai/geminiService';
import { chatSchema } from '../utils/validators';
import { config } from '../config/env';
import { logger } from '../config/logger';

export async function chatController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = chatSchema.parse(req.body);

    if (!config.geminiApiKey) {
      res.status(503).json({
        success: false,
        error: 'Chat requires a Gemini API key. Set GEMINI_API_KEY in your .env file.',
        error_type: 'gemini_not_configured',
      });
      return;
    }

    const sessionId: string = req.cookies?.sessionId ?? '';
    const session = sessionStore.get(sessionId);

    if (!session.auditData || !session.report) {
      res.status(400).json({
        success: false,
        error: 'No audit report available. Connect, audit, and analyze first.',
        error_type: 'no_context',
      });
      return;
    }

    const service = new GeminiAnalysisService();
    const answer = await service.chat(body.question, session.auditData, session.report);

    // Check if the answer contains error indicators (defensive check)
    if (answer.includes('[GoogleGenerativeAI Error]') || 
        (answer.includes('429') && answer.includes('Too Many Requests')) ||
        answer.includes('quota exceeded')) {
      logger.warn('Gemini returned error content in response');
      res.status(429).json({
        success: false,
        error: '⚠️ Gemini API quota exceeded. Your free tier limit has been reached. Please try again later or upgrade your Gemini API plan.',
        error_type: 'quota_exceeded',
      });
      return;
    }

    logger.info(`Chat answered for session ${sessionId.substring(0, 8)}`);

    res.json({ success: true, answer });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    // Handle quota exceeded errors with a user-friendly message
    if (errorMessage.includes('quota exceeded') || errorMessage.includes('429')) {
      logger.warn('Chat failed due to Gemini quota limit');
      res.status(429).json({
        success: false,
        error: '⚠️ Gemini API quota exceeded. Your free tier limit has been reached. Please try again later or upgrade your Gemini API plan.',
        error_type: 'quota_exceeded',
      });
      return;
    }
    
    // Handle other Gemini errors
    if (errorMessage.includes('Gemini') || errorMessage.includes('generative')) {
      logger.error('Chat Gemini error:', err);
      res.status(503).json({
        success: false,
        error: 'Chat service temporarily unavailable. The AI service encountered an error. Please try again in a moment.',
        error_type: 'gemini_error',
      });
      return;
    }
    
    next(err);
  }
}
