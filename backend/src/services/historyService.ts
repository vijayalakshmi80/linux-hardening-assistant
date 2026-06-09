/**
 * Audit history persistence service using a simple JSON file store.
 *
 * Stores all audit records locally in backend/data/history.json.
 * No external database required — works fully offline.
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { AuditData, AnalysisReport, HistoryRecord } from '../utils/types';
import { logger } from '../config/logger';

const DATA_DIR = path.resolve(__dirname, '../../../data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readHistory(): HistoryRecord[] {
  ensureDataDir();
  if (!fs.existsSync(HISTORY_FILE)) return [];
  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
    return JSON.parse(raw) as HistoryRecord[];
  } catch {
    logger.warn('Could not parse history file — starting fresh.');
    return [];
  }
}

function writeHistory(records: HistoryRecord[]): void {
  ensureDataDir();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(records, null, 2), 'utf8');
}

export async function saveAuditHistory(
  audit: AuditData,
  report: AnalysisReport,
): Promise<string> {
  const records = readHistory();

  const record: HistoryRecord = {
    id: uuidv4(),
    date: new Date().toISOString(),
    server_ip: audit.host,
    username: audit.username,
    security_score: report.security_score,
    grade: report.grade,
    findings_count: {
      critical: report.findings_by_severity.Critical?.length ?? 0,
      high:     report.findings_by_severity.High?.length ?? 0,
      medium:   report.findings_by_severity.Medium?.length ?? 0,
      low:      report.findings_by_severity.Low?.length ?? 0,
      total:    report.findings.length,
    },
    report_summary: report.executive_summary || report.summary,
    server_info: audit.server_info,
  };

  records.unshift(record); // newest first

  // Keep at most 200 records
  const trimmed = records.slice(0, 200);
  writeHistory(trimmed);

  return record.id;
}

export async function getHistory(
  limit = 50,
): Promise<{ records: HistoryRecord[]; trend: { date: string; score: number; server_ip: string }[] }> {
  const records = readHistory().slice(0, limit);
  const trend = [...records]
    .reverse() // oldest first for chart
    .map((r) => ({ date: r.date, score: r.security_score, server_ip: r.server_ip }));

  return { records, trend };
}

export async function getHistoryById(id: string): Promise<HistoryRecord | null> {
  const records = readHistory();
  return records.find((r) => r.id === id) ?? null;
}
