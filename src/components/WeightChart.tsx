'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { WeightTrend, TimeRange } from '@/lib/types';

interface WeightChartProps {
  trend: WeightTrend[];
  rate: number;
  totalLost: number;
  goalWeight: number;
  goalDate: string | null;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const TIME_RANGES: TimeRange[] = ['7D', '30D', '90D', '6M', '1Y', 'ALL'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function WeightChart({ trend, rate, totalLost, goalWeight, goalDate, timeRange, onTimeRangeChange }: WeightChartProps) {
  const weights = trend.map(t => t.weight);
  const minWeight = Math.min(...weights, goalWeight);
  const maxWeight = Math.max(...weights);
  const yMin = Math.floor(minWeight - 2);
  const yMax = Math.ceil(maxWeight + 1);

  // Show every Nth label based on data length
  const labelInterval = Math.max(1, Math.floor(trend.length / 8));

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 mb-4 relative animate-fade-in" style={{ animationDelay: '0.5s' }}>
      {/* Corner brackets */}
      <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t border-l border-[var(--amber)] opacity-30" />
      <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b border-r border-[var(--amber)] opacity-30" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-bold uppercase tracking-[3px] text-[var(--amber)]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          ▸ Weight Trajectory
        </h2>
        <div className="flex gap-4 text-[10px]">
          <div>
            <span className="text-[var(--text-dim)]">Rate: </span>
            <span className="text-[var(--green)] font-semibold">{rate > 0 ? '+' : ''}{rate} kg/wk</span>
          </div>
          <div>
            <span className="text-[var(--text-dim)]">Total: </span>
            <span className="text-[var(--green)] font-semibold">{totalLost > 0 ? '-' : '+'}{Math.abs(totalLost)} kg</span>
          </div>
          {goalDate && (
            <div className="hidden sm:block">
              <span className="text-[var(--text-dim)]">ETA {goalWeight}kg: </span>
              <span className="text-[var(--green)] font-semibold">{goalDate}</span>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {TIME_RANGES.map(r => (
            <button
              key={r}
              onClick={() => onTimeRangeChange(r)}
              className={`px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider transition-all ${
                timeRange === r
                  ? 'bg-[var(--amber)] text-[var(--bg-primary)] border-[var(--amber)]'
                  : 'bg-transparent text-[var(--text-dim)] border-[var(--border)] hover:border-[var(--text-dim)] hover:text-[var(--text-secondary)]'
              } border`}
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[260px] md:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#181c14" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              interval={labelInterval}
              tick={{ fontSize: 9, fill: '#4a5440', fontFamily: "'Source Code Pro', monospace" }}
              axisLine={{ stroke: '#181c14' }}
              tickLine={{ stroke: '#181c14' }}
            />
            <YAxis
              domain={[yMin, yMax]}
              tickFormatter={v => `${v}kg`}
              tick={{ fontSize: 9, fill: '#4a5440', fontFamily: "'Source Code Pro', monospace" }}
              axisLine={{ stroke: '#181c14' }}
              tickLine={{ stroke: '#181c14' }}
              width={45}
            />
            <Tooltip
              contentStyle={{
                background: '#121410',
                border: '1px solid #2a3020',
                borderRadius: 0,
                fontFamily: "'Source Code Pro', monospace",
                fontSize: 11,
              }}
              labelStyle={{ color: '#8a9478', fontSize: 10 }}
              labelFormatter={(label: unknown) => formatDate(String(label))}
              formatter={(value: unknown, name: unknown) => [
                `${Number(value).toFixed(1)} kg`,
                name === 'weight' ? 'Daily' : name === 'movingAvg7d' ? '7d Avg' : '30d Avg',
              ]}
            />
            <ReferenceLine y={goalWeight} stroke="#4a5440" strokeDasharray="6 4" label={{ value: `Goal: ${goalWeight}kg`, position: 'right', fontSize: 9, fill: '#4a5440' }} />
            <Line type="monotone" dataKey="weight" stroke="#ffb627" strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: '#ffb627' }} />
            <Line type="monotone" dataKey="movingAvg7d" stroke="#4ade80" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-5 mt-3 text-[10px] text-[var(--text-dim)]">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-[var(--amber)]" />
          Daily
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-[var(--green)]" />
          7d Avg
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-[var(--text-dim)] border-t border-dashed border-[var(--text-dim)]" style={{ height: 0 }} />
          Goal
        </div>
      </div>
    </div>
  );
}
