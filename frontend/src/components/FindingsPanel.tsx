/**
 * Tabbed findings panel — Critical / High / Medium / Low.
 */

import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, Zap } from 'lucide-react';
import type { AuditFinding, FindingsBySeverity, Severity } from '../types';
import { SeverityBadge } from './ui/Badge';

interface Props {
  findingsBySeverity: FindingsBySeverity | null;
}

const TABS: { severity: Severity; icon: React.ReactNode; colorClass: string }[] = [
  { severity: 'Critical', icon: <Zap className="h-4 w-4" />, colorClass: 'text-red-900 dark:text-red-400' },
  { severity: 'High',     icon: <AlertTriangle className="h-4 w-4" />, colorClass: 'text-red-600 dark:text-red-400' },
  { severity: 'Medium',   icon: <AlertCircle className="h-4 w-4" />, colorClass: 'text-amber-600 dark:text-amber-400' },
  { severity: 'Low',      icon: <Info className="h-4 w-4" />, colorClass: 'text-blue-600 dark:text-blue-400' },
];

const FindingCard: React.FC<{ finding: AuditFinding }> = ({ finding }) => {
  const [expanded, setExpanded] = useState(false);
  const borderMap: Record<Severity, string> = {
    Critical: 'finding-critical',
    High:     'finding-high',
    Medium:   'finding-medium',
    Low:      'finding-low',
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-3 ${borderMap[finding.severity]} shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {finding.issue_name}
        </h4>
        <SeverityBadge severity={finding.severity} />
      </div>

      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
        {finding.explanation}
      </p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        {expanded ? '▲ Hide details' : '▼ Show fix & recommendation'}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Fix Command</p>
            <pre className="mt-0.5 rounded bg-gray-100 dark:bg-gray-900 px-2 py-1.5 text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all">
              {finding.fix_command}
            </pre>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Recommendation</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{finding.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const FindingsPanel: React.FC<Props> = ({ findingsBySeverity }) => {
  const [activeTab, setActiveTab] = useState<Severity>('Critical');

  const counts: Record<Severity, number> = {
    Critical: findingsBySeverity?.Critical?.length ?? 0,
    High:     findingsBySeverity?.High?.length ?? 0,
    Medium:   findingsBySeverity?.Medium?.length ?? 0,
    Low:      findingsBySeverity?.Low?.length ?? 0,
  };

  // Auto-select first tab with findings
  React.useEffect(() => {
    if (!findingsBySeverity) return;
    for (const { severity } of TABS) {
      if ((findingsBySeverity[severity]?.length ?? 0) > 0) {
        setActiveTab(severity);
        break;
      }
    }
  }, [findingsBySeverity]);

  return (
    <div className="card">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {TABS.map(({ severity, icon, colorClass }) => (
          <button
            key={severity}
            onClick={() => setActiveTab(severity)}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap
              transition-colors duration-150
              ${activeTab === severity
                ? `${colorClass} border-current`
                : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300'}
            `}
          >
            {icon}
            {severity} Risk
            {counts[severity] > 0 && (
              <span className={`
                ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold
                ${activeTab === severity ? 'bg-current/10' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}
              `}>
                {counts[severity]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
        {!findingsBySeverity ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
            Run an analysis to see security findings.
          </p>
        ) : (findingsBySeverity[activeTab]?.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
            ✓ No {activeTab.toLowerCase()} risk findings.
          </p>
        ) : (
          findingsBySeverity[activeTab].map((f, i) => (
            <FindingCard key={`${f.issue_name}-${i}`} finding={f} />
          ))
        )}
      </div>
    </div>
  );
};
