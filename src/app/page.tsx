'use client';

import { useState, useEffect, useCallback } from 'react';
import { DailyMetrics, Goals, TimeRange, ViewTab } from '@/lib/types';
import { loadMetrics, loadMetricsAsync, saveMetrics, addMetrics, loadGoals, getTodayMetrics, getWeightTrend, getWeightRate, getProjectedGoalDate, getPersonalRecords, filterByTimeRange, getStreak, getComparisonDelta } from '@/lib/store';
import { generateMockData } from '@/lib/mock-data';
import { parseHealthData } from '@/lib/parser';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import MetricCard from '@/components/MetricCard';
import WeightChart from '@/components/WeightChart';
import DailyDetail from '@/components/DailyDetail';
import PersonalRecords from '@/components/PersonalRecords';
import FileUpload from '@/components/FileUpload';
import EmptyState from '@/components/EmptyState';

export default function Home() {
  const [data, setData] = useState<DailyMetrics[]>([]);
  const [goals, setGoals] = useState<Goals>({});
  const [timeRange, setTimeRange] = useState<TimeRange>('90D');
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [showUpload, setShowUpload] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function init() {
      // Try Supabase first, then localStorage, then mock data
      const stored = await loadMetricsAsync();
      if (stored.length > 0) {
        setData(stored);
      } else {
        const local = loadMetrics();
        if (local.length > 0) {
          setData(local);
        } else {
          // Load mock data for demo
          const mock = generateMockData();
          saveMetrics(mock);
          setData(mock);
        }
      }
      setGoals(loadGoals());
      setIsLoaded(true);
    }
    init();
  }, []);

  const handleFileUpload = useCallback((files: File[]) => {
    Promise.all(
      files.map(f => f.text().then(text => parseHealthData(text, f.name)))
    ).then(results => {
      const allNew = results.flat();
      const merged = addMetrics(allNew);
      setData(merged);
      setShowUpload(false);
    });
  }, []);

  if (!isLoaded) return null;

  const filteredData = filterByTimeRange(data, timeRange);
  const today = getTodayMetrics(data);
  const weightTrend = getWeightTrend(filteredData);
  const weightRate = getWeightRate(getWeightTrend(data));
  const totalLost = data.length > 0 && data[0].weight && today?.weight
    ? Math.round((data[0].weight - today.weight) * 10) / 10
    : 0;
  const goalDate = getProjectedGoalDate(getWeightTrend(data), goals.targetWeight || 85);
  const records = getPersonalRecords(data);
  const stepStreak = getStreak(data, 'steps', goals.dailySteps || 10000);
  const stepsDelta = getComparisonDelta(data, 'steps');
  const calsDelta = getComparisonDelta(data, 'activeCalories');
  const hrDelta = getComparisonDelta(data, 'restingHeartRate');

  const sleepEff = today?.sleepDuration && today?.sleepInBed
    ? Math.round((today.sleepDuration / today.sleepInBed) * 100)
    : null;

  const formatSleep = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  if (data.length === 0 && isLoaded) {
    return (
      <div className="min-h-screen">
        <Header />
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <EmptyState onUpload={() => setShowUpload(true)} />
        {showUpload && <FileUpload onUpload={handleFileUpload} onClose={() => setShowUpload(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header onUpload={() => setShowUpload(!showUpload)} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {showUpload && <FileUpload onUpload={handleFileUpload} onClose={() => setShowUpload(false)} />}

      <main className="max-w-[1400px] mx-auto p-4">
        {/* Section: Primary Metrics */}
        <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-dim)]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          <span>Primary Metrics</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
          <MetricCard
            label="Weight"
            value={today?.weight?.toFixed(1) || '—'}
            unit="kg"
            color="amber"
            delta={weightRate !== 0 ? { value: Math.abs(weightRate), direction: weightRate < 0 ? 'down' : 'up', good: weightRate < 0 } : undefined}
            sparklineData={data.slice(-30).filter(d => d.weight).map(d => d.weight!)}
            delay={0}
          />
          <MetricCard
            label="Steps"
            value={today?.steps?.toLocaleString() || '—'}
            color="green"
            delta={stepsDelta ? { value: Math.abs(stepsDelta.percentage), direction: stepsDelta.percentage > 0 ? 'up' : 'down', good: stepsDelta.percentage > 0, suffix: '%' } : undefined}
            progress={today?.steps && goals.dailySteps ? { current: today.steps, target: goals.dailySteps } : undefined}
            delay={1}
          />
          <MetricCard
            label="Active Cal"
            value={today?.activeCalories?.toString() || '—'}
            unit="kcal"
            color="lime"
            delta={calsDelta ? { value: Math.abs(calsDelta.percentage), direction: calsDelta.percentage > 0 ? 'up' : 'down', good: calsDelta.percentage > 0, suffix: '%' } : undefined}
            progress={today?.activeCalories && goals.dailyCalories ? { current: today.activeCalories, target: goals.dailyCalories } : undefined}
            delay={2}
          />
          <MetricCard
            label="Resting HR"
            value={today?.restingHeartRate?.toString() || '—'}
            unit="bpm"
            color="blue"
            delta={hrDelta ? { value: Math.abs(hrDelta.value), direction: hrDelta.value < 0 ? 'down' : 'up', good: hrDelta.value < 0 } : undefined}
            sparklineData={data.slice(-14).filter(d => d.restingHeartRate).map(d => d.restingHeartRate!)}
            delay={3}
          />
          <MetricCard
            label="Sleep"
            value={today?.sleepDuration ? formatSleep(today.sleepDuration) : '—'}
            color="blue"
            subtitle={sleepEff ? `${sleepEff}% eff` : undefined}
            sparklineData={data.slice(-7).filter(d => d.sleepDuration).map(d => d.sleepDuration!)}
            delay={4}
          />
          <MetricCard
            label="Distance"
            value={today?.distance?.toFixed(1) || '—'}
            unit="km"
            color="white"
            delay={5}
          />
          <MetricCard
            label="Flights"
            value={today?.flightsClimbed?.toString() || '—'}
            color="white"
            delay={6}
          />
          <MetricCard
            label="Body Fat"
            value={today?.bodyFat?.toFixed(1) || '—'}
            unit="%"
            color="white"
            sparklineData={data.slice(-12).filter(d => d.bodyFat).map(d => d.bodyFat!)}
            delay={7}
          />
        </div>

        {/* Section: Weight Intelligence */}
        <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-dim)]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          <span>Weight Intelligence</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        <WeightChart
          trend={weightTrend}
          rate={weightRate}
          totalLost={totalLost}
          goalWeight={goals.targetWeight || 85}
          goalDate={goalDate}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />

        {/* Section: Daily Breakdown */}
        <div className="flex items-center gap-2 mb-3 mt-4 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-dim)]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          <span>Daily Breakdown</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        <DailyDetail today={today} data={data} />

        {/* Section: SITREP */}
        <div className="flex items-center gap-2 mb-3 mt-4 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-dim)]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          <span>SITREP — Personal Records</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        <PersonalRecords records={records} stepStreak={stepStreak} />
      </main>
    </div>
  );
}
