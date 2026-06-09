/**
 * SSH Connection form and action buttons (left sidebar).
 */

import React, { useState } from 'react';
import {
  Terminal, Play, Search, Bot, Download, FileText,
  XCircle, Wifi, WifiOff, Loader2, ShieldCheck,
} from 'lucide-react';
import type { ConnectionStatus } from '../types';

interface Props {
  status: ConnectionStatus;
  isDemoMode: boolean;
  hasAudit: boolean;
  hasReport: boolean;
  isLoading: boolean;
  geminiConfigured: boolean;
  onConnect: (host: string, port: number, username: string, password: string) => void;
  onAudit: () => void;
  onAnalyze: () => void;
  onDemo: () => void;
  onDisconnect: () => void;
  onDownloadFix: () => void;
  onExportPdf: () => void;
}

export const ConnectionPanel: React.FC<Props> = ({
  status, isDemoMode, hasAudit, hasReport, isLoading, geminiConfigured,
  onConnect, onAudit, onAnalyze, onDemo, onDisconnect, onDownloadFix, onExportPdf,
}) => {
  const [host, setHost] = useState('192.168.1.100');
  const [port, setPort] = useState(22);
  const [username, setUsername] = useState('ubuntu');
  const [password, setPassword] = useState('');

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    onConnect(host, port, username, password);
  };

  const statusDot = (
    <span className="flex items-center gap-1.5 text-xs font-medium">
      {status === 'connected' && !isDemoMode ? (
        <>
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-600 dark:text-green-400">Connected</span>
        </>
      ) : status === 'connecting' ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
          <span className="text-indigo-500">Connecting…</span>
        </>
      ) : isDemoMode ? (
        <>
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          <span className="text-sky-500 dark:text-sky-400">Demo Mode</span>
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-gray-400" />
          <span className="text-gray-400">Disconnected</span>
        </>
      )}
    </span>
  );

  return (
    <aside className="flex flex-col gap-4">
      {/* ── Status badge ── */}
      <div className="flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <ShieldCheck className="h-4 w-4 text-indigo-500" />
          Hardening Assistant
        </span>
        {statusDot}
      </div>

      {/* ── SSH Connection ── */}
      <div className="card">
        <div className="card-header">
          <Terminal className="h-4 w-4" /> SSH Connection
        </div>
        <form onSubmit={handleSubmit} className="p-3 flex flex-col gap-3">
          <div>
            <label className="form-label">Host / IP Address</label>
            <input
              className="form-input"
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="192.168.1.100"
              required
              disabled={isConnected || isConnecting || isDemoMode}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ubuntu"
                required
                disabled={isConnected || isConnecting || isDemoMode}
              />
            </div>
            <div className="w-16">
              <label className="form-label">Port</label>
              <input
                className="form-input"
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                min={1}
                max={65535}
                disabled={isConnected || isConnecting || isDemoMode}
              />
            </div>
          </div>
          <div>
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isConnected || isConnecting || isDemoMode}
            />
          </div>

          {!isConnected && !isDemoMode ? (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isConnecting || isLoading}
            >
              {isConnecting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</>
              ) : (
                <><Wifi className="h-4 w-4" /> Connect</>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onDisconnect}
              className="btn btn-danger"
              disabled={isLoading}
            >
              <WifiOff className="h-4 w-4" />
              {isDemoMode ? 'Exit Demo' : 'Disconnect'}
            </button>
          )}
        </form>
      </div>

      {/* ── Actions ── */}
      <div className="card">
        <div className="card-header">
          <Play className="h-4 w-4" /> Actions
        </div>
        <div className="p-3 flex flex-col gap-2">
          {/* Demo mode */}
          <button
            onClick={onDemo}
            className="btn bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            disabled={isLoading}
          >
            <Play className="h-4 w-4" /> Demo Mode
          </button>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Run Audit */}
          <button
            onClick={onAudit}
            className="btn btn-outline-info"
            disabled={!isConnected || isDemoMode || isLoading}
            title={!isConnected ? 'Connect to a server first' : undefined}
          >
            <Search className="h-4 w-4" /> Run Audit
          </button>

          {/* AI Analyze */}
          <button
            onClick={onAnalyze}
            className="btn btn-outline-warning"
            disabled={!hasAudit || isLoading}
            title={!hasAudit ? 'Run an audit first' : undefined}
          >
            <Bot className="h-4 w-4" />
            {geminiConfigured ? 'AI Analyze' : 'Analyze (Local)'}
          </button>

          {/* Download fix.sh */}
          <button
            onClick={onDownloadFix}
            className="btn btn-outline-success"
            disabled={!hasReport || isLoading}
          >
            <Download className="h-4 w-4" /> Download fix.sh
          </button>

          {/* Export PDF */}
          <button
            onClick={onExportPdf}
            className="btn btn-outline-danger"
            disabled={!hasReport || isLoading}
          >
            <FileText className="h-4 w-4" /> Export PDF
          </button>

          {/* Disconnect */}
          {(isConnected || isDemoMode) && (
            <>
              <hr className="border-gray-200 dark:border-gray-700" />
              <button
                onClick={onDisconnect}
                className="btn btn-outline-gray"
                disabled={isLoading}
              >
                <XCircle className="h-4 w-4" />
                {isDemoMode ? 'Clear Demo' : 'Disconnect'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Gemini status */}
      {!geminiConfigured && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          <strong>Local Mode:</strong> Gemini API key not configured. Using rule-based analysis.
          Set <code className="font-mono">GEMINI_API_KEY</code> in <code className="font-mono">.env</code> for AI analysis.
        </div>
      )}
    </aside>
  );
};
