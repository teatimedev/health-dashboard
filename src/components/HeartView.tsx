'use client';

import { DailyMetrics, TimeRange } from '@/lib/types';
import { filterByTimeRange } from '@/lib/store';
import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell,
} from 'recharts';

interface HeartViewProps {
  data: DailyMetrics[];
}

const TIME_RANGES: TimeRange[] = ['7D', '30D', '90D', '6M', '1Y', 'ALL'];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-dim)]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      <span>{title}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

function StatBox({ label, value, unit, color = 'blue' }: { label: string; value: string; unit?: string; color?: string }) {
  const colorVar = `var(--${color})`;
  return (
    <div className="bg-[var(--bg-secondary)] border-l-2 px-3 py-2.5" style={{ borderColor: colorVar }}>
      <div className="text-[9px] text-[var(--text-dim)] uppercase tracking-wider" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{label}</div>
      <div className="text-2xl font-bold leading-tight" style={{ fontFamily: "'Rajdhani', sans-serif", color: colorVar }}>
        {value}
        {unit && <span className="text-[10px] text-[var(--text-dim)] ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function getHRZone(hr: number): { zone: string; color: string } {
  if (hr < 60) return { zone: 'Rest', color: '#38bdf8' };
  if (hr < 100) return { zone: 'Light', color: '#4ade80' };
  if (hr < 120) return { zone: 'Fat Burn', color: '#a3e635' };
  if (hr < 140) return { zone: 'Cardio', color: '#ffb627' };
  if (hr < 160) return { zone: 'Hard', color: '#ef4444' };
  return { zone: 'Peak', color: '#dc2626' };
}

export default function HeartView({ data }: HeartViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const filtered = filterByTimeRange(data, timeRange);
  const withHR = filtered.filter(d => d.restingHeartRate != null);

  // Current stats
  const current = withHR.length > 0 ? withHR[withHR.length - 1] : null;
  const avgRHR = withHR.length > 0
    ? Math.round(withHR.reduce((s, d) => s + d.restingHeartRate!, 0) / withHR.length)
    : 0;
  const lowestRHR = withHR.length > 0
    ? Math.min(...withHR.map(d => d.restingHeartRate!))
    : 0;
  const highestRHR = withHR.length > 0
    ? Math.max(...withHR.map(d => d.restingHeartRate!))
    : 0;

  // HR range data
  const maxHR = filtered.filter(d => d.heartRateMax != null).length > 0
    ? Math.max(...filtered.filter(d => d.heartRateMax != null).map(d => d.heartRateMax!))
    : 0;
  const minHR = filtered.filter(d => d.heartRateMin != null).length > 0
    ? Math.min(...filtered.filter(d => d.heartRateMin != null).map(d => d.heartRateMin!))
    : 0;

  // RHR trend data
  const rhrTrend = useMemo(() => {
    const result = withHR.map((d, i) => {
      const start = Math.max(0, i - 6);
      const window7 = withHR.slice(start, i + 1).map(x => x.restingHeartRate!);
      const avg7 = Math.round((window7.reduce((a, b) => a + b, 0) / window7.length) * 10) / 10;
      return {
        date: d.date,
        rhr: d.restingHeartRate!,
        avg7d: avg7,
      };
    });
    return result;
  }, [withHR]);

  // HR range band chart
  const hrRange = useMemo(() => {
    return filtered
      .filter(d => d.heartRateMin != null && d.heartRateMax != null)
      .map(d => ({
        date: d.date,
        min: d.heartRateMin!,
        max: d.heartRateMax!,
        avg: d.heartRateAvg || Math.round((d.heartRateMin! + d.heartRateMax!) / 2),
        resting: d.restingHeartRate || 0,
      }));
  }, [filtered]);

  // Blood oxygen
  const spo2Data = useMemo(() => {
    return filtered
      .filter(d => d.bloodOxygen != null)
      .map(d => ({ date: d.date, spo2: d.bloodOxygen! }));
  }, [filtered]);

  const avgSpo2 = spo2Data.length > 0
    ? Math.round((spo2Data.reduce((s, d) => s + d.spo2, 0) / spo2Data.length) * 10) / 10
    : 0;

  // RHR change over period
  const rhrChange = withHR.length >= 14
    ? Math.round((withHR.slice(-7).reduce((s, d) => s + d.restingHeartRate!, 0) / 7 -
        withHR.slice(-14, -7).reduce((s, d) => s + d.restingHeartRate!, 0) / 7) * 10) / 10
    : 0;

  // HR distribution (histogram)
  const hrDistribution = useMemo(() => {
    const buckets: Record<string, number> = {};
    const zones = ['Rest (<60)', 'Light (60-99)', 'Fat Burn (100-119)', 'Cardio (120-139)', 'Hard (140-159)', 'Peak (160+)'];
    zones.forEach(z => buckets[z] = 0);
    filtered.forEach(d => {
      if (d.heartRateMax) {
        // Estimate time in zones from max/min/avg
        if (d.heartRateMin && d.heartRateMin < 60) buckets['Rest (<60)']++;
        if (d.heartRateAvg && d.heartRateAvg < 100) buckets['Light (60-99)']++;
        else if (d.heartRateAvg && d.heartRateAvg < 120) buckets['Fat Burn (100-119)']++;
        if (d.heartRateMax >= 120 && d.heartRateMax < 140) buckets['Cardio (120-139)']++;
        if (d.heartRateMax >= 140 && d.heartRateMax < 160) buckets['Hard (140-159)']++;
        if (d.heartRateMax >= 160) buckets['Peak (160+)']++;
      }
    });
    const colors = ['#38bdf8', '#4ade80', '#a3e635', '#ffb627', '#ef4444', '#dc2626'];
    return zones.map((zone, i) => ({ zone: zone.split(' ')[0], days: buckets[zones[i]], color: colors[i] }));
  }, [filtered]);

  const labelInterval = Math.max(1, Math.floor(rhrTrend.length / 10));

  return (
    <main className="max-w-[1400px] mx-auto p-4">
      {/* Stats */}
      <SectionHeader title="Heart Rate Overview" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <StatBox label="Resting HR" value={current?.restingHeartRate?.toString() || '—'} unit="bpm" color="blue" />
        <StatBox label="Average RHR" value={avgRHR.toString()} unit="bpm" color="blue" />
        <StatBox label="Lowest RHR" value={lowestRHR.toString()} unit="bpm" color="green" />
        <StatBox label="Highest RHR" value={highestRHR.toString()} unit="bpm" color="amber" />
        <StatBox label="RHR Change" value={`${rhrChange > 0 ? '+' : ''}${rhrChange}`} unit="bpm" color={rhrChange <= 0 ? 'green' : 'red'} />
        <StatBox label="Avg SpO₂" value={avgSpo2 > 0 ? avgSpo2.toString() : '—'} unit="%" color={avgSpo2 >= 95 ? 'green' : 'amber'} />
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

      {/* RHR Trend */}
      <SectionHeader title="Resting Heart Rate Trend" />
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 mb-4 relative">
        <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t border-l border-[var(--blue)] opacity-30" />
        <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b border-r border-[var(--blue)] opacity-30" />
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rhrTrend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
              <XAxis dataKey="date" tickFormatter={formatDate} interval={labelInterval} tick={{ fontSize: 9, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
              <YAxis domain={['dataMin - 3', 'dataMax + 3']} tick={{ fontSize: 9, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} tickFormatter={v => `${v} bpm`} />
              <Tooltip
                contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                labelFormatter={(l: unknown) => formatDate(String(l))}
                formatter={(v: unknown, name: unknown) => [`${Number(v)} bpm`, name === 'rhr' ? 'Daily RHR' : '7d Average']}
              />
              <Line type="monotone" dataKey="rhr" stroke="#38bdf8" strokeWidth={1} dot={false} opacity={0.4} />
              <Line type="monotone" dataKey="avg7d" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-5 mt-2 text-[10px] text-[var(--text-dim)]">
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-[var(--blue)] opacity-40" />Daily</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-[3px] bg-[var(--blue)]" />7d Average</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* HR Range */}
        <div>
          <SectionHeader title="Daily HR Range" />
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hrRange}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
                  <XAxis dataKey="date" tickFormatter={formatDate} interval={Math.max(1, Math.floor(hrRange.length / 6))} tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                    labelFormatter={(l: unknown) => formatDate(String(l))}
                    formatter={(v: unknown, name: unknown) => [`${v} bpm`, name === 'max' ? 'Max' : name === 'min' ? 'Min' : name === 'avg' ? 'Average' : 'Resting']}
                  />
                  <Area type="monotone" dataKey="max" stroke="#ef4444" fill="#ef444415" strokeWidth={1} dot={false} />
                  <Area type="monotone" dataKey="avg" stroke="#ffb627" fill="none" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="resting" stroke="#4ade80" fill="none" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="min" stroke="#38bdf8" fill="#38bdf810" strokeWidth={1} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-3 mt-2 text-[9px] text-[var(--text-dim)]">
              <span><span className="text-[var(--red)]">●</span> Max: {maxHR} bpm</span>
              <span><span className="text-[var(--amber)]">●</span> Avg</span>
              <span><span className="text-[var(--green)]">●</span> Resting</span>
              <span><span className="text-[var(--blue)]">●</span> Min: {minHR} bpm</span>
            </div>
          </div>
        </div>

        {/* HR Zone Distribution */}
        <div>
          <SectionHeader title="HR Zone Distribution" />
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hrDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#181c14" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 8, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <YAxis dataKey="zone" type="category" tick={{ fontSize: 9, fill: '#8a9478' }} width={55} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                    formatter={(v: unknown) => [`${v} days`, 'Days in zone']}
                  />
                  <Bar dataKey="days" radius={[0, 2, 2, 0]}>
                    {hrDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Blood Oxygen */}
      {spo2Data.length > 0 && (
        <>
          <SectionHeader title="Blood Oxygen (SpO₂)" />
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 mb-4">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spo2Data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
                  <XAxis dataKey="date" tickFormatter={formatDate} interval={Math.max(1, Math.floor(spo2Data.length / 8))} tick={{ fontSize: 9, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} />
                  <YAxis domain={[90, 100]} tick={{ fontSize: 9, fill: '#4a5440' }} axisLine={{ stroke: '#181c14' }} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: '#121410', border: '1px solid #2a3020', borderRadius: 0, fontSize: 10, fontFamily: "'Source Code Pro'" }}
                    labelFormatter={(l: unknown) => formatDate(String(l))}
                    formatter={(v: unknown) => [`${Number(v).toFixed(1)}%`, 'SpO₂']}
                  />
                  <ReferenceLine y={95} stroke="#4ade8060" strokeDasharray="4 4" label={{ value: 'Normal ≥95%', fontSize: 9, fill: '#4ade8060', position: 'insideTopRight' }} />
                  <Line type="monotone" dataKey="spo2" stroke="#4ade80" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
