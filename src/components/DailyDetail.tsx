'use client';

import { useState } from 'react';
import { DailyMetrics } from '@/lib/types';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DailyDetailProps {
  today: DailyMetrics | null;
  data: DailyMetrics[];
}

// Generate fake hourly data from daily totals
function generateHourlySteps(totalSteps: number): { hour: string; steps: number }[] {
  // Realistic distribution: morning commute, lunch walk, evening activity
  const pattern = [0, 0, 0, 0, 0, 0, 3, 8, 14, 10, 5, 8, 15, 5, 7, 9, 10, 12, 7, 4, 1, 0, 0, 0];
  const sum = pattern.reduce((a, b) => a + b, 0);
  return pattern.map((p, i) => ({
    hour: `${i}:00`,
    steps: Math.round((p / sum) * totalSteps * (0.8 + Math.random() * 0.4)),
  }));
}

function generateHourlyHR(): { hour: string; hr: number }[] {
  return Array.from({ length: 24 }, (_, i) => {
    let base: number;
    if (i < 6) base = 62 + Math.random() * 4;
    else if (i < 9) base = 70 + Math.random() * 10;
    else if (i < 12) base = 75 + Math.random() * 15;
    else if (i === 12) base = 105 + Math.random() * 20;
    else if (i < 17) base = 72 + Math.random() * 12;
    else if (i < 19) base = 85 + Math.random() * 25;
    else base = 65 + Math.random() * 8;
    return { hour: `${i}:00`, hr: Math.round(base) };
  });
}

export default function DailyDetail({ today, data }: DailyDetailProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!today) return null;

  const dateLabel = (() => {
    const d = new Date(today.date);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  })();

  const hourlySteps = generateHourlySteps(today.steps || 0);
  const hourlyHR = generateHourlyHR();

  const sleepData = [
    { phase: 'Deep', mins: today.sleepDeep || 0 },
    { phase: 'Light', mins: today.sleepLight || 0 },
    { phase: 'REM', mins: today.sleepREM || 0 },
    { phase: 'Awake', mins: today.sleepAwake || 0 },
  ];

  // Weekly calories for the energy chart
  const last7 = data.slice(-7).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short' }),
    active: d.activeCalories || 0,
    basal: d.basalCalories || 0,
  }));

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] mb-4 animate-fade-in" style={{ animationDelay: '0.7s' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-[2px] text-[var(--text-secondary)]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          ▸ {dateLabel} — Detail View
        </span>
        <span className="text-[10px] text-[var(--text-dim)]" style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '1px' }}>
          [ {isOpen ? 'COLLAPSE' : 'EXPAND'} ]
        </span>
      </button>

      {isOpen && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Hourly Steps */}
          <div>
            <h3 className="text-[10px] uppercase tracking-[1.5px] text-[var(--text-dim)] mb-2 font-semibold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              Hourly Steps
            </h3>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlySteps}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
                  <XAxis dataKey="hour" tick={{ fontSize: 7, fill: '#4a5440' }} interval={2} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 7, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                  />
                  <Bar dataKey="steps" fill="#4ade80" radius={0} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Heart Rate */}
          <div>
            <h3 className="text-[10px] uppercase tracking-[1.5px] text-[var(--text-dim)] mb-2 font-semibold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              Heart Rate
            </h3>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyHR}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
                  <XAxis dataKey="hour" tick={{ fontSize: 7, fill: '#4a5440' }} interval={2} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 7, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                    formatter={(v: unknown) => [`${v} bpm`, 'HR']}
                  />
                  <Line type="monotone" dataKey="hr" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sleep Phases */}
          <div>
            <h3 className="text-[10px] uppercase tracking-[1.5px] text-[var(--text-dim)] mb-2 font-semibold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              Sleep Phases
            </h3>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sleepData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#181c14" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 7, fill: '#4a5440' }} tickFormatter={v => `${Math.floor(v / 60)}h`} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <YAxis dataKey="phase" type="category" tick={{ fontSize: 8, fill: '#4a5440' }} width={50} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                    formatter={(v: unknown) => [`${Math.floor(Number(v) / 60)}h ${Number(v) % 60}m`, 'Duration']}
                  />
                  <Bar dataKey="mins" fill="#38bdf8" radius={0}>
                    {sleepData.map((entry, i) => {
                      const colors = ['#38bdf8', '#4ade80', '#a3e635', '#ef4444'];
                      return <rect key={i} fill={colors[i]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Energy */}
          <div>
            <h3 className="text-[10px] uppercase tracking-[1.5px] text-[var(--text-dim)] mb-2 font-semibold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              Weekly Energy
            </h3>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 7, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                  />
                  <Bar dataKey="active" fill="#a3e635" name="Active" radius={0} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
