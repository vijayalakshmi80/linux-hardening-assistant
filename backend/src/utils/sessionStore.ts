/**
 * In-memory session store for SSH clients and analysis cache.
 *
 * Since this app is localhost-only, a simple Map is sufficient.
 * Sessions are keyed by a UUID stored in a browser cookie.
 */

import type { SSHAuditClient } from '../ssh/sshClient';
import type { AuditData, AnalysisReport } from './types';

export interface SessionData {
  sshClient?: SSHAuditClient;
  auditData?: AuditData;
  report?: AnalysisReport;
  fixScript?: string;
  isDemo?: boolean;
  host?: string;
  username?: string;
  connectedAt?: string;
}

class SessionStore {
  private store = new Map<string, SessionData>();

  get(id: string): SessionData {
    if (!this.store.has(id)) this.store.set(id, {});
    return this.store.get(id)!;
  }

  set(id: string, data: Partial<SessionData>): void {
    const existing = this.get(id);
    this.store.set(id, { ...existing, ...data });
  }

  clear(id: string): void {
    const session = this.store.get(id);
    if (session?.sshClient) {
      try { session.sshClient.disconnect(); } catch { /* ignore */ }
    }
    this.store.delete(id);
  }

  has(id: string): boolean {
    return this.store.has(id);
  }
}

export const sessionStore = new SessionStore();
