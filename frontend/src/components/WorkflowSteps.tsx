/**
 * Agent workflow steps visualization.
 */

import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Minus, Workflow } from 'lucide-react';
import type { WorkflowStep } from '../types';

interface Props {
  steps: WorkflowStep[];
}

const icons = {
  success: <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />,
  failed:  <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />,
  partial: <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />,
  skipped: <Minus className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />,
};

export const WorkflowSteps: React.FC<Props> = ({ steps }) => {
  if (!steps.length) return null;

  return (
    <div className="card">
      <div className="card-header">
        <Workflow className="h-4 w-4" /> Agent Workflow
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2 px-3 py-2">
            {icons[step.status]}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 capitalize">
                {step.step.replace(/_/g, ' ')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{step.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
