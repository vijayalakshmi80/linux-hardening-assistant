/**
 * Displays the generated fix script with syntax highlighting.
 */

import React, { useState } from 'react';
import { Wrench, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  script: string | null;
}

export const FixScript: React.FC<Props> = ({ script }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!script) return;
    await navigator.clipboard.writeText(script);
    setCopied(true);
    toast.success('Fix script copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card">
      <div className="card-header justify-between">
        <span className="flex items-center gap-1.5">
          <Wrench className="h-4 w-4" /> Remediation Fix Script
        </span>
        {script && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      <div className="p-0">
        <pre className="fix-code max-h-72 overflow-y-auto bg-gray-950 dark:bg-gray-950 text-green-300 p-4 rounded-b-lg text-xs leading-relaxed">
          {script ?? '# Run an analysis to generate the fix script'}
        </pre>
      </div>
    </div>
  );
};
