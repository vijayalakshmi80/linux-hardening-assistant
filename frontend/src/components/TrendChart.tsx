/**
 * Security score trend chart using Chart.js.
 */

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { TrendingUp } from 'lucide-react';
import type { TrendPoint } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function scoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 75) return '#84cc16';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

interface Props {
  trend: TrendPoint[];
  isDark: boolean;
}

export const TrendChart: React.FC<Props> = ({ trend, isDark }) => {
  const labels = trend.map((t) =>
    new Date(t.date).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }),
  );

  const pointColors = trend.map((t) => scoreColor(t.score));

  const data = {
    labels,
    datasets: [
      {
        label: 'Security Score',
        data: trend.map((t) => t.score),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: isDark ? '#1e293b' : '#f1f5f9' },
        ticks: { color: isDark ? '#94a3b8' : '#6b7280' },
        title: { display: true, text: 'Score', color: isDark ? '#94a3b8' : '#6b7280' },
      },
      x: {
        grid: { color: isDark ? '#1e293b' : '#f1f5f9' },
        ticks: { color: isDark ? '#94a3b8' : '#6b7280', maxRotation: 30 },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterLabel: (ctx: { dataIndex: number }) => {
            const pt = trend[ctx.dataIndex];
            return pt ? `Host: ${pt.server_ip}` : '';
          },
        },
      },
    },
  };

  return (
    <div className="card">
      <div className="card-header">
        <TrendingUp className="h-4 w-4" /> Security Score Trend
      </div>
      <div className="p-3">
        {trend.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
            No audit history yet. Run a demo or connect to a server.
          </p>
        ) : (
          <Line data={data} options={options} height={70} />
        )}
      </div>
    </div>
  );
};
