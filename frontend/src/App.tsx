/**
 * Linux Hardening Assistant — Main Application
 *
 * Orchestrates all panels, state, and API calls.
 * Supports: SSH live audit, Demo Mode, Gemini AI, Local analysis, PDF export.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';

import { ConnectionPanel } from './components/ConnectionPanel';
import { ServerInfo } from './components/ServerInfo';
import { FindingsPanel } from './components/FindingsPanel';
import { FixScript } from './components/FixScript';
import { WorkflowSteps } from './components/WorkflowSteps';
import { TrendChart } from './components/TrendChart';
import { AuditHistory } from './components/AuditHistory';
import { ChatPanel } from './components/ChatPanel';
import { ScoreRing } from './components/ui/ScoreRing';
import { LoadingOverlay } from './components/LoadingOverlay';

import { apiConnect, apiAudit, apiAnalyze, apiDemo, apiDisconnect, apiReports, apiVersion, getFixScriptUrl, getPdfUrl } from './api/endpoints';
import type { ConnectionStatus, AuditData, AnalysisReport, HistoryRecord, TrendPoint } from './types';

// ── Theme helper ──────────────────────────────────────────────────────────────

function getInitialDark(): boolean {
  const stored = localStorage.getItem('theme');
  if (stored) return stored === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// ── App ───────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  // ── UI state ────────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(getInitialDark);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Processing…');

  // ── Connection state ─────────────────────────────────────────────────────────
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('disconnected');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState(false);

  // ── Data state ───────────────────────────────────────────────────────────────
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Dark mode ────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // ── History loader ────────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await apiReports();
      setHistory(res.data.history);
      setTrend(res.data.trend);
    } catch {
      // non-critical
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ── Version check on mount — sets geminiConfigured state ───────────────────
  useEffect(() => {
    apiVersion()
      .then((res) => {
        setGeminiConfigured(res.data.gemini_configured ?? false);
      })
      .catch(() => {
        setGeminiConfigured(false);
      });
    loadHistory();
  }, [loadHistory]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const startLoading = (msg: string) => { setLoading(true); setLoadingMsg(msg); };
  const stopLoading = () => setLoading(false);

  // ── SSH Connect ───────────────────────────────────────────────────────────────
  const handleConnect = async (host: string, port: number, username: string, password: string) => {
    setConnStatus('connecting');
    startLoading(`Connecting to ${host}:${port}…`);
    try {
      const res = await apiConnect(host, port, username, password);
      setConnStatus('connected');
      setIsDemoMode(false);
      toast.success(`Connected to ${res.data.host}`);
    } catch (err: unknown) {
      setConnStatus('failed');
      const msg = (err as { message?: string })?.message ?? 'Connection failed';
      toast.error(msg);
      setTimeout(() => setConnStatus('disconnected'), 2000);
    } finally {
      stopLoading();
    }
  };

  // ── Run Audit ─────────────────────────────────────────────────────────────────
  const handleAudit = async () => {
    startLoading('Running 16 security audit checks…');
    try {
      const res = await apiAudit();
      setAuditData(res.data.audit);
      toast.success(`Audit complete — ${res.data.checks_run} checks run`);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Audit failed');
    } finally {
      stopLoading();
    }
  };

  // ── Analyze ───────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    startLoading(
      geminiConfigured
        ? 'AI agent analyzing security configuration…'
        : 'Running local rule-based analysis…',
    );
    try {
      const res = await apiAnalyze();
      const r = res.data.report;
      setReport(r);
      if (r.audit_data) setAuditData(r.audit_data);

      const modeLabel = res.data.mode === 'gemini' ? 'Gemini AI' : 'Local Analysis';
      const color = r.security_score >= 75 ? '🟢' : r.security_score >= 50 ? '🟡' : '🔴';
      toast.success(`${color} ${modeLabel} complete — Score: ${r.security_score}/100 (${r.grade})`);

      if (!res.data.gemini_available) {
        toast('Using local analysis. Set GEMINI_API_KEY in .env for AI-powered analysis.', {
          icon: 'ℹ️',
          duration: 6000,
        });
      }

      await loadHistory();
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Analysis failed');
    } finally {
      stopLoading();
    }
  };

  // ── Demo Mode ─────────────────────────────────────────────────────────────────
  const handleDemo = async () => {
    startLoading('Loading demo audit data…');
    try {
      const res = await apiDemo();
      setIsDemoMode(true);
      setConnStatus('connected');
      setAuditData(res.data.audit);
      setReport(res.data.report);
      toast.success(`Demo loaded — Score: ${res.data.report.security_score}/100 (${res.data.report.grade})`, {
        duration: 6000,
        icon: '🎮',
      });
      toast('Demo Mode: No real SSH connection. Sample Ubuntu 22.04 data.', {
        icon: 'ℹ️',
        duration: 6000,
      });
      await loadHistory();
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Demo failed');
    } finally {
      stopLoading();
    }
  };

  // ── Disconnect ────────────────────────────────────────────────────────────────
  const handleDisconnect = async () => {
    startLoading('Disconnecting…');
    try {
      await apiDisconnect();
      setConnStatus('disconnected');
      setIsDemoMode(false);
      setAuditData(null);
      setReport(null);
      toast.success(isDemoMode ? 'Demo mode cleared.' : 'Disconnected.');
    } catch {
      // Reset state regardless
      setConnStatus('disconnected');
      setIsDemoMode(false);
    } finally {
      stopLoading();
    }
  };

  // ── Downloads ─────────────────────────────────────────────────────────────────
  const handleDownloadFix = () => {
    window.location.href = getFixScriptUrl();
  };

  const handleExportPdf = () => {
    window.location.href = getPdfUrl();
  };

  // ── Render ─────────────────────────────────────────────────────────────────────

  const hasAudit = !!auditData;
  const hasReport = !!report;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* ── Loading overlay ── */}
      <LoadingOverlay visible={loading} message={loadingMsg} />

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-gray-900 dark:bg-gray-950 border-b border-gray-800 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            Linux Hardening Assistant
          </div>

          <div className="flex items-center gap-3">
            {/* Demo banner */}
            {isDemoMode && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-sky-900/60 text-sky-300 border border-sky-700">
                🎮 Demo Mode — No real SSH
              </span>
            )}

            {/* Connection status */}
            <span className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
              connStatus === 'connected' && !isDemoMode
                ? 'bg-green-900/60 text-green-300 border-green-700'
                : connStatus === 'connecting'
                ? 'bg-indigo-900/60 text-indigo-300 border-indigo-700'
                : 'bg-gray-800 text-gray-400 border-gray-700'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                connStatus === 'connected' && !isDemoMode ? 'bg-green-400 animate-pulse' :
                connStatus === 'connecting' ? 'bg-indigo-400 animate-pulse' : 'bg-gray-500'
              }`} />
              {connStatus === 'connected' && !isDemoMode
                ? `Connected: ${auditData?.host ?? ''}`
                : connStatus === 'connecting' ? 'Connecting…' : 'Disconnected'}
            </span>

            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main layout ── */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Left sidebar ── */}
          <div className="lg:col-span-1 space-y-4">
            <ConnectionPanel
              status={connStatus}
              isDemoMode={isDemoMode}
              hasAudit={hasAudit}
              hasReport={hasReport}
              isLoading={loading}
              geminiConfigured={geminiConfigured}
              onConnect={handleConnect}
              onAudit={handleAudit}
              onAnalyze={handleAnalyze}
              onDemo={handleDemo}
              onDisconnect={handleDisconnect}
              onDownloadFix={handleDownloadFix}
              onExportPdf={handleExportPdf}
            />

            {/* Workflow steps */}
            {report?.workflow_steps && report.workflow_steps.length > 0 && (
              <WorkflowSteps steps={report.workflow_steps} />
            )}
          </div>

          {/* ── Main content ── */}
          <div className="lg:col-span-3 space-y-5">
            {/* Server info + Score row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <ServerInfo auditData={auditData} />
              </div>
              <div className="md:col-span-1">
                <div className="card h-full">
                  <div className="card-header">
                    <ShieldCheck className="h-4 w-4" /> Security Score
                  </div>
                  <div className="p-4 flex flex-col items-center gap-2">
                    <ScoreRing
                      score={report?.security_score ?? null}
                      grade={report?.grade}
                    />
                    {report && (
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400 px-2">
                        {report.executive_summary?.split('.')[0] ?? report.summary?.split('.')[0]}
                      </p>
                    )}

                    {/* Score breakdown mini */}
                    {report?.score_breakdown && (
                      <div className="w-full mt-1 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {report.score_breakdown.critical_deductions > 0 && (
                          <div className="flex justify-between"><span>Critical</span><span className="text-red-600">-{report.score_breakdown.critical_deductions}</span></div>
                        )}
                        {report.score_breakdown.high_deductions > 0 && (
                          <div className="flex justify-between"><span>High</span><span className="text-red-500">-{report.score_breakdown.high_deductions}</span></div>
                        )}
                        {report.score_breakdown.medium_deductions > 0 && (
                          <div className="flex justify-between"><span>Medium</span><span className="text-amber-500">-{report.score_breakdown.medium_deductions}</span></div>
                        )}
                        {report.score_breakdown.low_deductions > 0 && (
                          <div className="flex justify-between"><span>Low</span><span className="text-blue-500">-{report.score_breakdown.low_deductions}</span></div>
                        )}
                        <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-0.5 font-semibold text-gray-700 dark:text-gray-200">
                          <span>Final Score</span><span>{report.security_score}/100</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Trend chart */}
            <TrendChart trend={trend} isDark={isDark} />

            {/* Findings */}
            <FindingsPanel findingsBySeverity={report?.findings_by_severity ?? null} />

            {/* Fix script */}
            <FixScript script={report?.fix_script ?? null} />

            {/* Priority actions */}
            {report?.priority_actions?.length ? (
              <div className="card">
                <div className="card-header">🎯 Priority Actions</div>
                <ul className="p-3 space-y-1.5">
                  {report.priority_actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="shrink-0 text-red-500 font-bold">{i + 1}.</span>
                      <span className="text-gray-700 dark:text-gray-200">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Chat */}
            <ChatPanel enabled={hasReport} geminiConfigured={geminiConfigured} />

            {/* History */}
            <AuditHistory
              records={history}
              onRefresh={loadHistory}
              isLoading={historyLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
