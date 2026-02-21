'use client';

import { DailyMetrics, Goals, TimeRange } from '@/lib/types';
import { filterByTimeRange, getStreak, getComparisonDelta } from '@/lib/store';
import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell,
} from 'recharts';

interface ActivityViewProps {
  data: DailyMetrics[];
  goals: Goals;
}

const TIME_RANGES: TimeRange[] = ['7D', '30D', '90D', '6M', '1Y', 'ALL'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-dim)]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      <span>{title}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

function StatBox({ label, value, unit, color = 'green', subtitle }: { label: string; value: string; unit?: string; color?: string; subtitle?: string }) {
  const colorVar = `var(--${color})`;
  return (
    <div className="bg-[var(--bg-secondary)] border-l-2 px-3 py-2.5" style={{ borderColor: colorVar }}>
      <div className="text-[9px] text-[var(--text-dim)] uppercase tracking-wider" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{label}</div>
      <div className="text-2xl font-bold leading-tight" style={{ fontFamily: "'Rajdhani', sans-serif", color: colorVar }}>
        {value}
        {unit && <span className="text-[10px] text-[var(--text-dim)] ml-1">{unit}</span>}
      </div>
      {subtitle && <div className="text-[9px] text-[var(--text-dim)]">{subtitle}</div>}
    </div>
  );
}

export default function ActivityView({ data, goals }: ActivityViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const filtered = filterByTimeRange(data, timeRange);
  const stepGoal = goals.dailySteps || 10000;
  const calGoal = goals.dailyCalories || 500;

  // Averages
  const avgSteps = filtered.length > 0
    ? Math.round(filtered.reduce((s, d) => s + (d.steps || 0), 0) / filtered.length)
    : 0;
  const avgCals = filtered.length > 0
    ? Math.round(filtered.reduce((s, d) => s + (d.activeCalories || 0), 0) / filtered.length)
    : 0;
  const avgDist = filtered.length > 0
    ? Math.round((filtered.reduce((s, d) => s + (d.distance || 0), 0) / filtered.length) * 10) / 10
    : 0;
  const totalDist = Math.round(filtered.reduce((s, d) => s + (d.distance || 0), 0) * 10) / 10;
  const totalFlights = filtered.reduce((s, d) => s + (d.flightsClimbed || 0), 0);
  const stepStreak = getStreak(data, 'steps', stepGoal);
  const stepsDelta = getComparisonDelta(data, 'steps');
  const calsDelta = getComparisonDelta(data, 'activeCalories');

  // Days that hit step goal
  const goalDays = filtered.filter(d => (d.steps || 0) >= stepGoal).length;
  const goalPct = filtered.length > 0 ? Math.round((goalDays / filtered.length) * 100) : 0;

  // Daily steps chart data
  const stepsChart = useMemo(() => {
    return filtered.map(d => ({
      date: d.date,
      steps: d.steps || 0,
      goal: stepGoal,
      hit: (d.steps || 0) >= stepGoal,
    }));
  }, [filtered, stepGoal]);

  // Calories chart
  const calsChart = useMemo(() => {
    return filtered.map(d => ({
      date: d.date,
      active: d.activeCalories || 0,
      basal: d.basalCalories || 0,
      total: (d.activeCalories || 0) + (d.basalCalories || 0),
    }));
  }, [filtered]);

  // Distance trend
  const distChart = useMemo(() => {
    return filtered.map(d => ({
      date: d.date,
      distance: d.distance || 0,
      flights: d.flightsClimbed || 0,
    }));
  }, [filtered]);

  // Day of week analysis
  const dowAnalysis = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const buckets = days.map(() => ({ steps: 0, cals: 0, count: 0 }));
    filtered.forEach(d => {
      const dow = new Date(d.date).getDay();
      buckets[dow].steps += d.steps || 0;
      buckets[dow].cals += d.activeCalories || 0;
      buckets[dow].count++;
    });
    return days.map((day, i) => ({
      day,
      steps: buckets[i].count > 0 ? Math.round(buckets[i].steps / buckets[i].count) : 0,
      cals: buckets[i].count > 0 ? Math.round(buckets[i].cals / buckets[i].count) : 0,
    }));
  }, [filtered]);

  const labelInterval = Math.max(1, Math.floor(stepsChart.length / 10));

  return (
    <main className="max-w-[1400px] mx-auto p-4">
      {/* Stats Overview */}
      <SectionHeader title="Activity Overview" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <StatBox label="Avg Steps" value={avgSteps.toLocaleString()} color="green" subtitle={stepsDelta ? `${stepsDelta.percentage > 0 ? '▲' : '▼'} ${Math.abs(stepsDelta.percentage)}% vs prev` : undefined} />
        <StatBox label="Avg Calories" value={avgCals.toLocaleString()} unit="kcal" color="lime" subtitle={calsDelta ? `${calsDelta.percentage > 0 ? '▲' : '▼'} ${Math.abs(calsDelta.percentage)}% vs prev` : undefined} />
        <StatBox label="Avg Distance" value={avgDist.toString()} unit="km" color="blue" />
        <StatBox label="Total Distance" value={totalDist.toString()} unit="km" color="amber" />
        <StatBox label="Goal Hit Rate" value={`${goalPct}%`} color={goalPct >= 70 ? 'green' : 'amber'} subtitle={`${goalDays}/${filtered.length} days`} />
        <StatBox label="Step Streak" value={stepStreak.toString()} unit="days" color={stepStreak >= 7 ? 'green' : 'white'} subtitle={`${stepGoal.toLocaleString()}+ steps`} />
      </div>

      {/* Time range selector */}
      <div className="flex justify-end mb-4">
        <div className="flex gap-1">
          {TIME_RANGES.map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider transition-all ${
                timeRange === r
                  ? 'bg-[var(--green)] text-[var(--bg-primary)] border-[var(--green)]'
                  : 'bg-transparent text-[var(--text-dim)] border-[var(--border)] hover:border-[var(--text-dim)]'
              } border`}
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Steps Chart */}
      <SectionHeader title="Daily Steps" />
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 mb-4 relative">
        <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t border-l border-[var(--green)] opacity-30" />
        <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b border-r border-[var(--green)] opacity-30" />
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stepsChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
              <XAxis dataKey="date" tickFormatter={formatDate} interval={labelInterval} tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
              <Tooltip
                contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                labelFormatter={(l: unknown) => formatDate(String(l))}
                formatter={(v: unknown, name: unknown) => [Number(v).toLocaleString(), name === 'steps' ? 'Steps' : 'Goal']}
              />
              <ReferenceLine y={stepGoal} stroke="#ffb627" strokeDasharray="4 4" label={{ value: `Goal: ${stepGoal.toLocaleString()}`, position: 'insideTopRight', fontSize: 9, fill: '#ffb627' }} />
              <Bar dataKey="steps" radius={[1, 1, 0, 0]}>
                {stepsChart.map((entry, i) => (
                  <Cell key={i} fill={entry.hit ? '#4ade80' : '#4ade8050'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Active Calories */}
        <div>
          <SectionHeader title="Active Calories" />
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={calsChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
                  <XAxis dataKey="date" tickFormatter={formatDate} interval={Math.max(1, Math.floor(calsChart.length / 6))} tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                    labelFormatter={(l: unknown) => formatDate(String(l))}
                    formatter={(v: unknown, name: unknown) => [`${Number(v).toLocaleString()} kcal`, name === 'active' ? 'Active' : 'Basal']}
                  />
                  <ReferenceLine y={calGoal} stroke="#ffb627" strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="active" stroke="#a3e635" fill="#a3e63520" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Distance & Flights */}
        <div>
          <SectionHeader title="Distance & Flights" />
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={distChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
                  <XAxis dataKey="date" tickFormatter={formatDate} interval={Math.max(1, Math.floor(distChart.length / 6))} tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <YAxis yAxisId="dist" tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} tickFormatter={v => `${v}km`} />
                  <YAxis yAxisId="flights" orientation="right" tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                    labelFormatter={(l: unknown) => formatDate(String(l))}
                  />
                  <Line yAxisId="dist" type="monotone" dataKey="distance" stroke="#38bdf8" strokeWidth={2} dot={false} name="Distance (km)" />
                  <Line yAxisId="flights" type="monotone" dataKey="flights" stroke="#ffb627" strokeWidth={1.5} dot={false} name="Flights" opacity={0.6} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-2 text-[10px] text-[var(--text-dim)]">
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-[var(--blue)]" />Distance</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-[var(--amber)]" />Flights</div>
              <div className="ml-auto">Total flights: <span className="text-[var(--amber)] font-semibold">{totalFlights}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Day of Week Analysis */}
      <SectionHeader title="Day of Week Pattern" />
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 mb-4">
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dowAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
              <Tooltip
                contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                formatter={(v: unknown, name: unknown) => [Number(v).toLocaleString(), name === 'steps' ? 'Avg Steps' : 'Avg Calories']}
              />
              <ReferenceLine y={stepGoal} stroke="#ffb627" strokeDasharray="4 4" />
              <Bar dataKey="steps" fill="#4ade80" name="steps" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-[10px] text-[var(--text-dim)] mt-2 text-center">Average steps by day of week • dashed line = {stepGoal.toLocaleString()} step goal</div>
      </div>
    </main>
  );
}
