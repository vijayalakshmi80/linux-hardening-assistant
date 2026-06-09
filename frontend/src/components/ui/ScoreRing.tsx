/**
 * Animated circular score ring component.
 * Displays the security score 0–100 with color-coded gradient.
 */

import React from 'react';

interface Props {
  score: number | null;
  grade?: string;
  size?: number;
}

function scoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 75) return '#84cc16';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export const ScoreRing: React.FC<Props> = ({ score, grade, size = 140 }) => {
  const displayScore = score ?? 0;
  const color = scoreColor(displayScore);
  const deg = (displayScore / 100) * 360;
  const inner = Math.round(size * 0.75);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative flex items-center justify-center rounded-full transition-all duration-700"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${color} ${deg}deg, #e2e8f0 ${deg}deg)`,
        }}
      >
        {/* Dark mode track */}
        <div
          className="dark:block hidden absolute rounded-full"
          style={{
            width: size,
            height: size,
            background: `conic-gradient(${color} ${deg}deg, #334155 ${deg}deg)`,
          }}
        />

        {/* Inner circle */}
        <div
          className="absolute flex flex-col items-center justify-center rounded-full bg-white dark:bg-gray-900 z-10"
          style={{ width: inner, height: inner }}
        >
          <span
            className="text-4xl font-bold leading-none transition-colors duration-700"
            style={{ color }}
          >
            {score !== null ? displayScore : '--'}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">/100</span>
        </div>
      </div>
      {grade && (
        <span
          className="text-sm font-semibold px-3 py-0.5 rounded-full text-white transition-colors duration-700"
          style={{ backgroundColor: color }}
        >
          {grade}
        </span>
      )}
    </div>
  );
};
