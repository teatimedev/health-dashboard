'use client';

import { useMemo } from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  color: 'amber' | 'green' | 'lime' | 'blue' | 'white';
  delta?: {
    value: number;
    direction: 'up' | 'down';
    good: boolean;
    suffix?: string;
  };
  subtitle?: string;
  sparklineData?: number[];
  progress?: { current: number; target: number };
  delay?: number;
}

const COLOR_MAP = {
  amber: { text: 'var(--amber)', hex: '#ffb627', shadow: '0 0 12px var(--amber-dim)' },
  green: { text: 'var(--green)', hex: '#4ade80', shadow: '0 0 12px var(--green-dim)' },
  lime: { text: 'var(--lime)', hex: '#a3e635', shadow: '0 0 12px var(--lime-dim)' },
  blue: { text: 'var(--blue)', hex: '#38bdf8', shadow: '0 0 12px var(--blue-dim)' },
  white: { text: 'var(--white)', hex: '#e8eee0', shadow: 'none' },
};

function Sparkline({ data, color, hex }: { data: number[]; color: string; hex: string }) {
  const { linePath, areaPath } = useMemo(() => {
    if (data.length < 2) return { linePath: '', areaPath: '' };

    const w = 200;
    const h = 28;
    const padding = 2;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - padding - ((val - min) / range) * (h - padding * 2);
      return { x, y };
    });

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const area = `${line} L${w},${h} L0,${h} Z`;

    return { linePath: line, areaPath: area };
  }, [data]);

  if (data.length < 2) return null;

  return (
    <svg viewBox="0 0 200 28" className="w-full h-7 mt-2" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${hex.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hex} stopOpacity="0.15" />
          <stop offset="100%" stopColor={hex} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${hex.replace('#', '')})`} />
      <path d={linePath} fill="none" stroke={hex} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function MetricCard({
  label, value, unit, color, delta, subtitle, sparklineData, progress, delay = 0,
}: MetricCardProps) {
  const colors = COLOR_MAP[color];
  const progressPct = progress ? Math.min(100, (progress.current / progress.target) * 100) : 0;

  return (
    <div
      className="bracket-card bg-[var(--bg-card)] border border-[var(--border)] p-3.5 transition-all hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-bright)] animate-card-in"
      style={{ animationDelay: `${delay * 0.05}s` }}
    >
      <div className="text-[10px] uppercase tracking-[2px] text-[var(--text-dim)] mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        {label}
      </div>
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline">
          <span
            className="text-[28px] md:text-[32px] font-bold leading-none tracking-tight"
            style={{ fontFamily: "'Rajdhani', sans-serif", color: colors.text, textShadow: colors.shadow }}
          >
            {value}
          </span>
          {unit && (
            <span className="text-[11px] text-[var(--text-dim)] ml-1">{unit}</span>
          )}
        </div>
        {delta && (
          <span className={`text-[10px] font-medium ${delta.good ? 'text-[var(--green)]' : 'text-[var(--amber)]'}`}>
            {delta.direction === 'up' ? '▲' : '▼'} {delta.value}{delta.suffix || ''}
          </span>
        )}
        {subtitle && !delta && (
          <span className="text-[10px] text-[var(--text-dim)]">{subtitle}</span>
        )}
      </div>

      {sparklineData && sparklineData.length > 1 && (
        <Sparkline data={sparklineData} color={colors.text} hex={colors.hex} />
      )}

      {progress && (
        <div className="mt-2">
          <div className="h-[3px] bg-[var(--border)] relative">
            <div
              className="h-full transition-all duration-1000 ease-out"
              style={{
                width: `${progressPct}%`,
                background: colors.text,
                boxShadow: `0 0 6px ${colors.hex}40`,
              }}
            />
          </div>
          <div className="text-[9px] text-[var(--text-dim)] mt-1 text-right">
            {progress.current.toLocaleString()} / {progress.target.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
