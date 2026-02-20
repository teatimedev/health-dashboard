'use client';

import { useEffect, useRef } from 'react';

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
  amber: { text: 'var(--amber)', shadow: '0 0 12px var(--amber-dim)' },
  green: { text: 'var(--green)', shadow: '0 0 12px var(--green-dim)' },
  lime: { text: 'var(--lime)', shadow: '0 0 12px var(--lime-dim)' },
  blue: { text: 'var(--blue)', shadow: '0 0 12px var(--blue-dim)' },
  white: { text: 'var(--white)', shadow: 'none' },
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';

    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - padding - ((val - min) / range) * (h - padding * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Fill
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = color.replace(')', ', 0.08)').replace('rgb', 'rgba');
    ctx.fill();
  }, [data, color]);

  return <canvas ref={canvasRef} className="w-full h-7 mt-2" />;
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
        <Sparkline data={sparklineData} color={colors.text} />
      )}

      {progress && (
        <div className="mt-2">
          <div className="h-[3px] bg-[var(--border)] relative">
            <div
              className="h-full transition-all duration-1000 ease-out"
              style={{
                width: `${progressPct}%`,
                background: colors.text,
                boxShadow: `0 0 6px ${colors.text}40`,
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
