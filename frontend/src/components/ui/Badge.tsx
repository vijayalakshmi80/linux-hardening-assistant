import React from 'react';
import type { Severity } from '../../types';

interface Props {
  severity: Severity;
  count?: number;
}

const styles: Record<Severity, string> = {
  Critical: 'bg-red-900 text-red-100',
  High:     'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200',
  Medium:   'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
  Low:      'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
};

export const SeverityBadge: React.FC<Props> = ({ severity, count }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${styles[severity]}`}>
    {severity}
    {count !== undefined && (
      <span className="ml-0.5 rounded-full bg-white/30 px-1">{count}</span>
    )}
  </span>
);
