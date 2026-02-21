'use client';

import { DailyMetrics, Goals, TimeRange, WeightTrend } from '@/lib/types';
import { getWeightTrend, getWeightRate, getProjectedGoalDate, filterByTimeRange } from '@/lib/store';
import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell,
} from 'recharts';

interface WeightViewProps {
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

function StatBox({ label, value, unit, color = 'amber', small = false }: { label: string; value: string; unit?: string; color?: string; small?: boolean }) {
  const colorVar = `var(--${color})`;
  return (
    <div className="bg-[var(--bg-secondary)] border-l-2 px-3 py-2.5" style={{ borderColor: colorVar }}>
      <div className="text-[9px] text-[var(--text-dim)] uppercase tracking-wider" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{label}</div>
      <div className={`${small ? 'text-lg' : 'text-2xl'} font-bold leading-tight`} style={{ fontFamily: "'Rajdhani', sans-serif", color: colorVar }}>
        {value}
        {unit && <span className="text-[10px] text-[var(--text-dim)] ml-1">{unit}</span>}
      </div>
    </div>
  );
}

export default function WeightView({ data, goals }: WeightViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('90D');
  const filteredData = filterByTimeRange(data, timeRange);
  const allTrend = getWeightTrend(data);
  const trend = getWeightTrend(filteredData);
  const rate = getWeightRate(allTrend);
  const goalWeight = goals.targetWeight || 85;
  const goalDate = getProjectedGoalDate(allTrend, goalWeight);

  const current = allTrend.length > 0 ? allTrend[allTrend.length - 1] : null;
  const starting = allTrend.length > 0 ? allTrend[0] : null;
  const totalLost = starting && current ? Math.round((starting.weight - current.weight) * 10) / 10 : 0;
  const toGoal = current ? Math.round((current.movingAvg7d - goalWeight) * 10) / 10 : 0;

  // Weekly averages
  const weeklyAvg = useMemo(() => {
    const weeks: { week: string; avg: number; min: number; max: number }[] = [];
    const withWeight = filteredData.filter(d => d.weight != null);
    for (let i = 0; i < withWeight.length; i += 7) {
      const chunk = withWeight.slice(i, i + 7).filter(d => d.weight);
      if (chunk.length === 0) continue;
      const weights = chunk.map(d => d.weight!);
      const weekStart = new Date(chunk[0].date);
      weeks.push({
        week: weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        avg: Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10,
        min: Math.round(Math.min(...weights) * 10) / 10,
        max: Math.round(Math.max(...weights) * 10) / 10,
      });
    }
    return weeks;
  }, [filteredData]);

  // Daily weight change
  const dailyChanges = useMemo(() => {
    const changes: { date: string; change: number }[] = [];
    const withWeight = filteredData.filter(d => d.weight != null);
    for (let i = 1; i < withWeight.length; i++) {
      changes.push({
        date: formatDate(withWeight[i].date),
        change: Math.round((withWeight[i].weight! - withWeight[i - 1].weight!) * 10) / 10,
      });
    }
    return changes;
  }, [filteredData]);

  // Body fat trend
  const bodyFatTrend = useMemo(() => {
    return filteredData
      .filter(d => d.bodyFat != null)
      .map(d => ({ date: d.date, bodyFat: d.bodyFat! }));
  }, [filteredData]);

  // BMI calculation (assuming height ~180cm for demo)
  const bmi = current ? Math.round((current.weight / (1.8 * 1.8)) * 10) / 10 : null;
  const bmiCategory = bmi ? (bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy' : bmi < 30 ? 'Overweight' : 'Obese') : '—';

  const weights = trend.map(t => t.weight);
  const yMin = Math.floor(Math.min(...weights, goalWeight) - 2);
  const yMax = Math.ceil(Math.max(...weights) + 1);
  const labelInterval = Math.max(1, Math.floor(trend.length / 10));

  return (
    <main className="max-w-[1400px] mx-auto p-4">
      {/* Stats Row */}
      <SectionHeader title="Weight Overview" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <StatBox label="Current" value={current?.movingAvg7d.toFixed(1) || '—'} unit="kg" color="amber" />
        <StatBox label="Starting" value={starting?.weight.toFixed(1) || '—'} unit="kg" color="white" />
        <StatBox label="Total Lost" value={totalLost > 0 ? `-${totalLost}` : `+${Math.abs(totalLost)}`} unit="kg" color={totalLost > 0 ? 'green' : 'red'} />
        <StatBox label="Rate" value={`${rate > 0 ? '+' : ''}${rate}`} unit="kg/wk" color={rate < 0 ? 'green' : 'amber'} />
        <StatBox label="To Goal" value={toGoal > 0 ? toGoal.toFixed(1) : '0'} unit="kg" color="blue" />
        <StatBox label="BMI" value={bmi?.toString() || '—'} unit={bmiCategory} color={bmi && bmi < 25 ? 'green' : 'amber'} />
      </div>

      {/* Main Weight Chart */}
      <SectionHeader title="Weight Trajectory" />
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 mb-4 relative">
        <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t border-l border-[var(--amber)] opacity-30" />
        <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b border-r border-[var(--amber)] opacity-30" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex gap-4 text-[10px]">
            {goalDate && (
              <div>
                <span className="text-[var(--text-dim)]">ETA {goalWeight}kg: </span>
                <span className="text-[var(--green)] font-semibold">{goalDate}</span>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {TIME_RANGES.map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider transition-all ${
                  timeRange === r
                    ? 'bg-[var(--amber)] text-[var(--bg-primary)] border-[var(--amber)]'
                    : 'bg-transparent text-[var(--text-dim)] border-[var(--border)] hover:border-[var(--text-dim)]'
                } border`}
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
              <XAxis dataKey="date" tickFormatter={formatDate} interval={labelInterval} tick={{ fontSize: 9, fill: '#4a5440', fontFamily: "'Source Code Pro'" }} axisLine={{ stroke: '#181c14' }} tickLine={{ stroke: '#181c14' }} />
              <YAxis domain={[yMin, yMax]} tickFormatter={v => `${v}kg`} tick={{ fontSize: 9, fill: '#4a5440', fontFamily: "'Source Code Pro'" }} axisLine={{ stroke: '#181c14' }} tickLine={{ stroke: '#181c14' }} width={45} />
              <Tooltip
                contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontFamily: "'Source Code Pro'", fontSize: 11 }}
                labelFormatter={(l: unknown) => formatDate(String(l))}
                formatter={(v: unknown, name: unknown) => [`${Number(v).toFixed(1)} kg`, name === 'weight' ? 'Daily' : name === 'movingAvg7d' ? '7d Avg' : '30d Avg']}
              />
              <ReferenceLine y={goalWeight} stroke="#4a5440" strokeDasharray="6 4" label={{ value: `Goal: ${goalWeight}kg`, position: 'right', fontSize: 9, fill: '#4a5440' }} />
              <Line type="monotone" dataKey="weight" stroke="#ffb627" strokeWidth={1} dot={false} opacity={0.5} />
              <Line type="monotone" dataKey="movingAvg7d" stroke="#4ade80" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="movingAvg30d" stroke="#38bdf8" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex gap-5 mt-3 text-[10px] text-[var(--text-dim)]">
          <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-[var(--amber)] opacity-50" />Daily</div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-[var(--green)]" />7d Avg</div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-[var(--blue)]" style={{ borderTop: '1px dashed var(--blue)' }} />30d Avg</div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-[var(--text-dim)]" style={{ borderTop: '1px dashed var(--text-dim)' }} />Goal</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Daily Weight Change */}
        <div>
          <SectionHeader title="Daily Change" />
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChanges.slice(-30)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
                  <XAxis dataKey="date" tick={{ fontSize: 7, fill: '#4a5440' }} interval={4} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} tickFormatter={v => `${v > 0 ? '+' : ''}${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                    formatter={(v: unknown) => [`${Number(v) > 0 ? '+' : ''}${Number(v).toFixed(1)} kg`, 'Change']}
                  />
                  <ReferenceLine y={0} stroke="#2a3020" />
                  <Bar dataKey="change" radius={0}>
                    {dailyChanges.slice(-30).map((entry, i) => (
                      <Cell key={i} fill={entry.change <= 0 ? '#4ade80' : '#ef4444'} opacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Weekly Averages */}
        <div>
          <SectionHeader title="Weekly Averages" />
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyAvg}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
                  <XAxis dataKey="week" tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} tickFormatter={v => `${v}kg`} />
                  <Tooltip
                    contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                    formatter={(v: unknown, name: unknown) => [`${Number(v).toFixed(1)} kg`, name === 'avg' ? 'Average' : name === 'min' ? 'Min' : 'Max']}
                  />
                  <Bar dataKey="avg" fill="#ffb627" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Body Fat Trend */}
      {bodyFatTrend.length > 0 && (
        <>
          <SectionHeader title="Body Composition" />
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 mb-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bodyFatTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
                  <XAxis dataKey="date" tickFormatter={formatDate} interval={Math.max(1, Math.floor(bodyFatTrend.length / 8))} tick={{ fontSize: 9, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fontSize: 9, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                    labelFormatter={(l: unknown) => formatDate(String(l))}
                    formatter={(v: unknown) => [`${Number(v).toFixed(1)}%`, 'Body Fat']}
                  />
                  <Area type="monotone" dataKey="bodyFat" stroke="#a3e635" fill="#a3e63520" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
