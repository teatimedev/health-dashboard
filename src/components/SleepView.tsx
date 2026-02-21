'use client';

import { DailyMetrics, Goals, TimeRange } from '@/lib/types';
import { filterByTimeRange } from '@/lib/store';
import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell,
} from 'recharts';

interface SleepViewProps {
  data: DailyMetrics[];
  goals: Goals;
}

const TIME_RANGES: TimeRange[] = ['7D', '30D', '90D', '6M', '1Y', 'ALL'];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatMinsSm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-dim)]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      <span>{title}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

function StatBox({ label, value, unit, color = 'blue', subtitle }: { label: string; value: string; unit?: string; color?: string; subtitle?: string }) {
  const colorVar = `var(--${color})`;
  return (
    <div className="bg-[var(--bg-secondary)] border-l-2 px-3 py-2.5" style={{ borderColor: colorVar }}>
      <div className="text-[9px] text-[var(--text-dim)] uppercase tracking-wider" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{label}</div>
      <div className="text-2xl font-bold leading-tight" style={{ fontFamily: "'Rajdhani', sans-serif", color: colorVar }}>
        {value}
        {unit && <span className="text-[10px] text-[var(--text-dim)] ml-1">{unit}</span>}
      </div>
      {subtitle && <div className="text-[9px] text-[var(--text-dim)] mt-0.5">{subtitle}</div>}
    </div>
  );
}

export default function SleepView({ data, goals }: SleepViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const filtered = filterByTimeRange(data, timeRange);
  const withSleep = filtered.filter(d => d.sleepDuration != null);
  const sleepGoal = goals.dailySleep || 420; // 7 hours default

  // Stats
  const avgSleep = withSleep.length > 0
    ? Math.round(withSleep.reduce((s, d) => s + d.sleepDuration!, 0) / withSleep.length)
    : 0;
  const avgInBed = withSleep.length > 0
    ? Math.round(withSleep.reduce((s, d) => s + (d.sleepInBed || d.sleepDuration!), 0) / withSleep.length)
    : 0;
  const avgEfficiency = avgSleep && avgInBed ? Math.round((avgSleep / avgInBed) * 100) : 0;
  const bestSleep = withSleep.length > 0
    ? Math.max(...withSleep.map(d => d.sleepDuration!))
    : 0;
  const worstSleep = withSleep.length > 0
    ? Math.min(...withSleep.map(d => d.sleepDuration!))
    : 0;

  // Goal hit rate
  const goalDays = withSleep.filter(d => d.sleepDuration! >= sleepGoal).length;
  const goalPct = withSleep.length > 0 ? Math.round((goalDays / withSleep.length) * 100) : 0;

  // Average phases
  const avgDeep = withSleep.length > 0
    ? Math.round(withSleep.reduce((s, d) => s + (d.sleepDeep || 0), 0) / withSleep.length)
    : 0;
  const avgREM = withSleep.length > 0
    ? Math.round(withSleep.reduce((s, d) => s + (d.sleepREM || 0), 0) / withSleep.length)
    : 0;
  const avgLight = withSleep.length > 0
    ? Math.round(withSleep.reduce((s, d) => s + (d.sleepLight || 0), 0) / withSleep.length)
    : 0;
  const avgAwake = withSleep.length > 0
    ? Math.round(withSleep.reduce((s, d) => s + (d.sleepAwake || 0), 0) / withSleep.length)
    : 0;

  // Sleep duration chart
  const sleepChart = useMemo(() => {
    return withSleep.map(d => ({
      date: d.date,
      duration: d.sleepDuration!,
      hours: Math.round((d.sleepDuration! / 60) * 10) / 10,
      inBed: d.sleepInBed || d.sleepDuration!,
      efficiency: d.sleepInBed ? Math.round((d.sleepDuration! / d.sleepInBed) * 100) : 100,
      hit: d.sleepDuration! >= sleepGoal,
    }));
  }, [withSleep, sleepGoal]);

  // Sleep phases stacked chart
  const phasesChart = useMemo(() => {
    return withSleep.map(d => ({
      date: d.date,
      deep: Math.round((d.sleepDeep || 0) / 60 * 10) / 10,
      light: Math.round((d.sleepLight || 0) / 60 * 10) / 10,
      rem: Math.round((d.sleepREM || 0) / 60 * 10) / 10,
      awake: Math.round((d.sleepAwake || 0) / 60 * 10) / 10,
    }));
  }, [withSleep]);

  // Efficiency trend
  const efficiencyChart = useMemo(() => {
    return withSleep
      .filter(d => d.sleepInBed)
      .map(d => ({
        date: d.date,
        efficiency: Math.round((d.sleepDuration! / d.sleepInBed!) * 100),
      }));
  }, [withSleep]);

  // Day of week sleep pattern
  const dowSleep = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const buckets = days.map(() => ({ total: 0, count: 0 }));
    withSleep.forEach(d => {
      const dow = new Date(d.date).getDay();
      buckets[dow].total += d.sleepDuration!;
      buckets[dow].count++;
    });
    return days.map((day, i) => ({
      day,
      hours: buckets[i].count > 0 ? Math.round((buckets[i].total / buckets[i].count / 60) * 10) / 10 : 0,
    }));
  }, [withSleep]);

  const labelInterval = Math.max(1, Math.floor(sleepChart.length / 10));

  return (
    <main className="max-w-[1400px] mx-auto p-4">
      {/* Stats */}
      <SectionHeader title="Sleep Overview" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <StatBox label="Avg Sleep" value={formatMinsSm(avgSleep)} color="blue" subtitle={`Goal: ${formatMinsSm(sleepGoal)}`} />
        <StatBox label="Avg Efficiency" value={`${avgEfficiency}%`} color={avgEfficiency >= 85 ? 'green' : 'amber'} />
        <StatBox label="Best Night" value={formatMinsSm(bestSleep)} color="green" />
        <StatBox label="Worst Night" value={formatMinsSm(worstSleep)} color="red" />
        <StatBox label="Goal Hit Rate" value={`${goalPct}%`} color={goalPct >= 70 ? 'green' : 'amber'} subtitle={`${goalDays}/${withSleep.length} nights`} />
        <StatBox label="Avg In Bed" value={formatMinsSm(avgInBed)} color="white" />
      </div>

      {/* Time range */}
      <div className="flex justify-end mb-4">
        <div className="flex gap-1">
          {TIME_RANGES.map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider transition-all ${
                timeRange === r
                  ? 'bg-[var(--blue)] text-[var(--bg-primary)] border-[var(--blue)]'
                  : 'bg-transparent text-[var(--text-dim)] border-[var(--border)] hover:border-[var(--text-dim)]'
              } border`}
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Sleep Duration Chart */}
      <SectionHeader title="Nightly Sleep Duration" />
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 mb-4 relative">
        <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t border-l border-[var(--blue)] opacity-30" />
        <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b border-r border-[var(--blue)] opacity-30" />
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sleepChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
              <XAxis dataKey="date" tickFormatter={formatDate} interval={labelInterval} tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} tickFormatter={v => `${(v / 60).toFixed(0)}h`} />
              <Tooltip
                contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                labelFormatter={(l: unknown) => formatDate(String(l))}
                formatter={(v: unknown, name: unknown) => {
                  if (name === 'duration') return [formatMins(Number(v)), 'Sleep'] as [string, string];
                  if (name === 'inBed') return [formatMins(Number(v)), 'In Bed'] as [string, string];
                  return [String(v), String(name)] as [string, string];
                }}
              />
              <ReferenceLine y={sleepGoal} stroke="#ffb627" strokeDasharray="4 4" label={{ value: `Goal: ${formatMinsSm(sleepGoal)}`, position: 'insideTopRight', fontSize: 9, fill: '#ffb627' }} />
              <Bar dataKey="duration" radius={[2, 2, 0, 0]}>
                {sleepChart.map((entry, i) => (
                  <Cell key={i} fill={entry.hit ? '#38bdf8' : '#38bdf850'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Sleep Phases Stacked */}
        <div>
          <SectionHeader title="Sleep Phases" />
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={phasesChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
                  <XAxis dataKey="date" tickFormatter={formatDate} interval={Math.max(1, Math.floor(phasesChart.length / 6))} tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} tickFormatter={v => `${v}h`} />
                  <Tooltip
                    contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                    labelFormatter={(l: unknown) => formatDate(String(l))}
                    formatter={(v: unknown, name: unknown) => [`${Number(v).toFixed(1)}h`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
                  />
                  <Bar dataKey="deep" stackId="sleep" fill="#1e40af" name="deep" />
                  <Bar dataKey="light" stackId="sleep" fill="#38bdf8" name="light" />
                  <Bar dataKey="rem" stackId="sleep" fill="#a3e635" name="rem" />
                  <Bar dataKey="awake" stackId="sleep" fill="#ef444480" name="awake" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-2 text-[9px] text-[var(--text-dim)]">
              <span><span style={{ color: '#1e40af' }}>■</span> Deep: {formatMins(avgDeep)} avg</span>
              <span><span style={{ color: '#38bdf8' }}>■</span> Light: {formatMins(avgLight)} avg</span>
              <span><span style={{ color: '#a3e635' }}>■</span> REM: {formatMins(avgREM)} avg</span>
              <span><span style={{ color: '#ef4444' }}>■</span> Awake: {formatMins(avgAwake)} avg</span>
            </div>
          </div>
        </div>

        {/* Sleep Efficiency */}
        <div>
          <SectionHeader title="Sleep Efficiency" />
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={efficiencyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
                  <XAxis dataKey="date" tickFormatter={formatDate} interval={Math.max(1, Math.floor(efficiencyChart.length / 6))} tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                    labelFormatter={(l: unknown) => formatDate(String(l))}
                    formatter={(v: unknown) => [`${v}%`, 'Efficiency']}
                  />
                  <ReferenceLine y={85} stroke="#4ade8040" strokeDasharray="4 4" label={{ value: 'Good ≥85%', fontSize: 9, fill: '#4ade8040', position: 'insideTopRight' }} />
                  <Line type="monotone" dataKey="efficiency" stroke="#4ade80" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Day of Week Sleep Pattern */}
      <SectionHeader title="Sleep by Day of Week" />
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 mb-4">
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dowSleep}>
              <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
              <YAxis domain={[0, 'dataMax + 1']} tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} tickFormatter={v => `${v}h`} />
              <Tooltip
                contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                formatter={(v: unknown) => [`${v}h`, 'Avg Sleep']}
              />
              <ReferenceLine y={sleepGoal / 60} stroke="#ffb627" strokeDasharray="4 4" />
              <Bar dataKey="hours" fill="#38bdf8" radius={[2, 2, 0, 0]}>
                {dowSleep.map((entry, i) => (
                  <Cell key={i} fill={entry.hours >= sleepGoal / 60 ? '#38bdf8' : '#38bdf850'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-[10px] text-[var(--text-dim)] mt-2 text-center">Average sleep by day of week • dashed line = {formatMinsSm(sleepGoal)} goal</div>
      </div>
    </main>
  );
}
