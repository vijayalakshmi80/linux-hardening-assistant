/**
 * Full-screen loading overlay with status message.
 */

import React from 'react';
import { Spinner } from './ui/Spinner';

interface Props {
  visible: boolean;
  message: string;
}

export const LoadingOverlay: React.FC<Props> = ({ visible, message }) => {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl px-8 py-6 flex flex-col items-center gap-4 max-w-xs mx-4">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 text-center">{message}</p>
      </div>
    </div>
  );
};
