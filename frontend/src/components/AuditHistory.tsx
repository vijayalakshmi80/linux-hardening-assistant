/**
 * Audit history table showing past scans.
 */

import React from 'react';
import { History, RefreshCw } from 'lucide-react';
import type { HistoryRecord } from '../types';

interface Props {
  records: HistoryRecord[];
  onRefresh: () => void;
  isLoading?: boolean;
}

function scoreStyle(score: number): string {
  if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  if (score >= 75) return 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300';
  if (score >= 60) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
  if (score >= 40) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
  return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
}

export const AuditHistory: React.FC<Props> = ({ records, onRefresh, isLoading }) => (
  <div className="card">
    <div className="card-header justify-between">
      <span className="flex items-center gap-1.5">
        <History className="h-4 w-4" /> Audit History
      </span>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-40"
        aria-label="Refresh history"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </button>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            {['Date', 'Server', 'Score', 'Grade', 'C', 'H', 'M', 'L'].map((h) => (
              <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {records.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-3 py-4 text-center text-gray-400 dark:text-gray-500">
                No audit history yet.
              </td>
            </tr>
          ) : (
            records.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-3 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">
                  {new Date(r.date).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td className="px-3 py-2 font-mono text-gray-700 dark:text-gray-200">{r.server_ip}</td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded font-bold ${scoreStyle(r.security_score)}`}>
                    {r.security_score}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{r.grade}</td>
                <td className="px-3 py-2">
                  <span className="px-1 rounded bg-red-900/80 text-red-100 font-bold">
                    {r.findings_count.critical}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="px-1 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-bold">
                    {r.findings_count.high}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="px-1 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold">
                    {r.findings_count.medium}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="px-1 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                    {r.findings_count.low}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
