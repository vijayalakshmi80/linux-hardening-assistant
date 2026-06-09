import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

export const Spinner: React.FC<Props> = ({ size = 'md', label }) => (
  <div className="flex flex-col items-center gap-3">
    <div
      className={`animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600 ${sizes[size]}`}
      role="status"
      aria-label={label ?? 'Loading'}
    />
    {label && <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>}
  </div>
);
