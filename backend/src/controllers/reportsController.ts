/**
 * GET  /api/reports      — List all stored audit history.
 * GET  /api/reports/:id  — Get a single audit record by ID.
 */

import { Request, Response, NextFunction } from 'express';
import { getHistory, getHistoryById } from '../services/historyService';
import { logger } from '../config/logger';

export async function listReports(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const { records, trend } = await getHistory(limit);

    res.json({
      success: true,
      history: records,
      trend,
      total: records.length,
    });
  } catch (err) {
    next(err);
  }
}

export async function getReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: 'Report ID required.', error_type: 'validation_error' });
      return;
    }

    const record = await getHistoryById(id);
    if (!record) {
      res.status(404).json({ success: false, error: 'Report not found.', error_type: 'not_found' });
      return;
    }

    res.json({ success: true, record });
  } catch (err) {
    next(err);
  }
}
