/**
 * Displays server metadata and collapsible audit command outputs.
 */

import React, { useState } from 'react';
import { Server, ChevronDown, ChevronRight } from 'lucide-react';
import type { AuditData } from '../types';

interface Props {
  auditData: AuditData | null;
}

export const ServerInfo: React.FC<Props> = ({ auditData }) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  if (!auditData) {
    return (
      <div className="card h-full">
        <div className="card-header"><Server className="h-4 w-4" /> Server Information</div>
        <div className="p-4 text-sm text-gray-400 dark:text-gray-500">
          Connect to a server to view information.
        </div>
      </div>
    );
  }

  const { host, username, server_info, audit_results, errors, timestamp } = auditData;

  return (
    <div className="card h-full">
      <div className="card-header">
        <Server className="h-4 w-4" /> Server Information
      </div>
      <div className="p-3 space-y-3">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Host</span>
          <span className="font-mono font-medium">{host}</span>
          <span className="text-gray-500 dark:text-gray-400">User</span>
          <span className="font-mono">{username}</span>
          <span className="text-gray-500 dark:text-gray-400">OS</span>
          <span>{server_info.os_name || 'Unknown'}</span>
          <span className="text-gray-500 dark:text-gray-400">Kernel</span>
          <span className="font-mono text-xs truncate" title={server_info.kernel}>
            {server_info.kernel?.split(' ').slice(2, 4).join(' ') || 'N/A'}
          </span>
          <span className="text-gray-500 dark:text-gray-400">Audited</span>
          <span className="text-xs">{new Date(timestamp).toLocaleString()}</span>
        </div>

        {errors.length > 0 && (
          <div className="rounded bg-red-50 dark:bg-red-900/20 px-2 py-1 text-xs text-red-700 dark:text-red-300">
            {errors.length} audit error(s) — some checks may be incomplete.
          </div>
        )}

        {/* Collapsible audit results */}
        {Object.entries(audit_results).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Audit Checks ({Object.keys(audit_results).length})
            </p>
            <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1">
              {Object.entries(audit_results).map(([key, val]) => (
                <div key={key} className="rounded border border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => toggle(key)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded"
                  >
                    <span className="font-medium truncate">{val.description}</span>
                    {expandedKeys.has(key) ? (
                      <ChevronDown className="h-3 w-3 shrink-0 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-3 w-3 shrink-0 text-gray-400" />
                    )}
                  </button>
                  {expandedKeys.has(key) && (
                    <pre className="px-2 pb-2 text-xs font-mono bg-gray-50 dark:bg-gray-900 rounded-b whitespace-pre-wrap break-all text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto">
                      {val.output}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
