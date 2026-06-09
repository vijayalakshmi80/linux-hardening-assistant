/**
 * Typed API endpoint wrappers.
 */

import api from './client';
import type {
  ConnectResponse,
  AuditResponse,
  AnalyzeResponse,
  DemoResponse,
  HistoryResponse,
} from '../types';

export const apiConnect = (host: string, port: number, username: string, password: string) =>
  api.post<ConnectResponse>('/connect', { host, port, username, password });

export const apiAudit = () =>
  api.post<AuditResponse>('/audit');

export const apiAnalyze = () =>
  api.post<AnalyzeResponse>('/analyze');

export const apiDemo = () =>
  api.post<DemoResponse>('/demo');

export const apiDisconnect = () =>
  api.post<{ success: boolean; message: string }>('/disconnect');

export const apiChat = (question: string) =>
  api.post<{ success: boolean; answer: string }>('/chat', { question });

export const apiReports = (limit = 50) =>
  api.get<HistoryResponse>(`/reports?limit=${limit}`);

export const apiVersion = () =>
  api.get<{ success: boolean; version: string; gemini_configured: boolean }>('/version');

export const getFixScriptUrl = () => '/api/fix-script/download';
export const getPdfUrl = () => '/api/export-pdf';
