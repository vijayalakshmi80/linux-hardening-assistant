export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'failed';

export interface AuditFinding {
  issue_name: string;
  severity: Severity;
  explanation: string;
  fix_command: string;
  recommendation: string;
  weight: number;
}

export interface ServerInfo {
  os_name: string;
  os_version: string;
  kernel: string;
}

export interface AuditResult {
  description: string;
  command: string;
  output: string;
  exit_code: string;
}

export interface AuditData {
  host: string;
  username: string;
  server_info: ServerInfo;
  audit_results: Record<string, AuditResult>;
  errors: string[];
  timestamp: string;
}

export interface ScoreBreakdown {
  base: number;
  critical_deductions: number;
  high_deductions: number;
  medium_deductions: number;
  low_deductions: number;
  final: number;
  grade: 'Excellent' | 'Good' | 'Moderate' | 'Poor' | 'Critical';
}

export interface FindingsBySeverity {
  Critical: AuditFinding[];
  High: AuditFinding[];
  Medium: AuditFinding[];
  Low: AuditFinding[];
}

export interface WorkflowStep {
  step: string;
  status: 'success' | 'failed' | 'partial' | 'skipped';
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface AnalysisReport {
  success: boolean;
  mode: 'gemini' | 'local';
  security_score: number;
  score_breakdown: ScoreBreakdown;
  grade: string;
  summary: string;
  executive_summary: string;
  findings: AuditFinding[];
  findings_by_severity: FindingsBySeverity;
  fix_script: string;
  priority_actions: string[];
  compliance_notes: string;
  verification_notes: string;
  workflow_steps: WorkflowStep[];
  audit_data: AuditData;
  timestamp: string;
  fix_script_filename?: string;
  history_id?: string;
}

export interface HistoryRecord {
  id: string;
  date: string;
  server_ip: string;
  username: string;
  security_score: number;
  grade: string;
  findings_count: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  report_summary: string;
  server_info: ServerInfo;
}

export interface TrendPoint {
  date: string;
  score: number;
  server_ip: string;
}

// API response shapes
export interface ConnectResponse {
  success: boolean;
  connected: boolean;
  host: string;
  username: string;
  message: string;
  sessionId: string;
}

export interface AuditResponse {
  success: boolean;
  audit: AuditData;
  checks_run: number;
  errors: number;
}

export interface AnalyzeResponse {
  success: boolean;
  mode: 'gemini' | 'local';
  gemini_available: boolean;
  report: AnalysisReport;
}

export interface DemoResponse {
  success: boolean;
  demo_mode: boolean;
  message: string;
  audit: AuditData;
  report: AnalysisReport;
}

export interface HistoryResponse {
  success: boolean;
  history: HistoryRecord[];
  trend: TrendPoint[];
  total: number;
}
