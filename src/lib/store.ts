import { DailyMetrics, Goals, PersonalRecord, WeightTrend, TimeRange } from './types';
import { mergeMetrics } from './parser';

const STORAGE_KEY = 'recon_health_data';
const GOALS_KEY = 'recon_goals';

// Client-side storage (localStorage)
// Can be swapped for Supabase later
export function loadMetrics(): DailyMetrics[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMetrics(data: DailyMetrics[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addMetrics(incoming: DailyMetrics[]): DailyMetrics[] {
  const existing = loadMetrics();
  const merged = mergeMetrics(existing, incoming);
  saveMetrics(merged);
  return merged;
}

export function clearMetrics(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function loadGoals(): Goals {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    return raw ? JSON.parse(raw) : { targetWeight: 85, dailySteps: 10000, dailyCalories: 500, dailySleep: 420 };
  } catch {
    return { targetWeight: 85, dailySteps: 10000, dailyCalories: 500, dailySleep: 420 };
  }
}

export function saveGoals(goals: Goals): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

// Computed data helpers

export function getWeightTrend(data: DailyMetrics[]): WeightTrend[] {
  const withWeight = data.filter(d => d.weight != null);
  if (withWeight.length === 0) return [];

  return withWeight.map((d, i) => {
    // 7-day moving average
    const start7 = Math.max(0, i - 6);
    const window7 = withWeight.slice(start7, i + 1).map(x => x.weight!);
    const avg7 = window7.reduce((a, b) => a + b, 0) / window7.length;

    // 30-day moving average
    const start30 = Math.max(0, i - 29);
    const window30 = withWeight.slice(start30, i + 1).map(x => x.weight!);
    const avg30 = window30.reduce((a, b) => a + b, 0) / window30.length;

    return {
      date: d.date,
      weight: d.weight!,
      movingAvg7d: Math.round(avg7 * 10) / 10,
      movingAvg30d: Math.round(avg30 * 10) / 10,
    };
  });
}

export function getWeightRate(trend: WeightTrend[]): number {
  if (trend.length < 7) return 0;
  const recent = trend.slice(-7);
  const older = trend.slice(-14, -7);
  if (older.length === 0) return 0;
  const recentAvg = recent.reduce((a, b) => a + b.movingAvg7d, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b.movingAvg7d, 0) / older.length;
  return Math.round((recentAvg - olderAvg) * 100) / 100;
}

export function getProjectedGoalDate(trend: WeightTrend[], goalWeight: number): string | null {
  if (trend.length < 14) return null;
  const rate = getWeightRate(trend); // kg per week
  if (rate >= 0) return null; // not losing

  const currentWeight = trend[trend.length - 1].movingAvg7d;
  const kgToLose = currentWeight - goalWeight;
  if (kgToLose <= 0) return 'Goal reached!';

  const weeksNeeded = kgToLose / Math.abs(rate);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeksNeeded * 7);
  return targetDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export function filterByTimeRange(data: DailyMetrics[], range: TimeRange): DailyMetrics[] {
  if (range === 'ALL') return data;

  const now = new Date();
  let daysBack: number;
  switch (range) {
    case '7D': daysBack = 7; break;
    case '30D': daysBack = 30; break;
    case '90D': daysBack = 90; break;
    case '6M': daysBack = 183; break;
    case '1Y': daysBack = 365; break;
    default: return data;
  }

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - daysBack);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  return data.filter(d => d.date >= cutoffStr);
}

export function getPersonalRecords(data: DailyMetrics[]): PersonalRecord[] {
  if (data.length === 0) return [];

  const records: PersonalRecord[] = [];

  // Lowest weight
  const withWeight = data.filter(d => d.weight != null);
  if (withWeight.length > 0) {
    const lowest = withWeight.reduce((a, b) => (a.weight! < b.weight! ? a : b));
    records.push({
      metric: 'weight',
      value: lowest.weight!,
      date: lowest.date,
      icon: '⚖️',
      label: 'Lowest Weight',
      unit: 'kg',
    });
  }

  // Most steps
  const withSteps = data.filter(d => d.steps != null);
  if (withSteps.length > 0) {
    const most = withSteps.reduce((a, b) => (a.steps! > b.steps! ? a : b));
    records.push({
      metric: 'steps',
      value: most.steps!,
      date: most.date,
      icon: '👟',
      label: 'Most Steps',
    });
  }

  // Lowest resting HR
  const withHR = data.filter(d => d.restingHeartRate != null);
  if (withHR.length > 0) {
    const lowest = withHR.reduce((a, b) => (a.restingHeartRate! < b.restingHeartRate! ? a : b));
    records.push({
      metric: 'rhr',
      value: lowest.restingHeartRate!,
      date: lowest.date,
      icon: '❤️',
      label: 'Lowest RHR',
      unit: 'bpm',
    });
  }

  // Best sleep
  const withSleep = data.filter(d => d.sleepDuration != null);
  if (withSleep.length > 0) {
    const best = withSleep.reduce((a, b) => (a.sleepDuration! > b.sleepDuration! ? a : b));
    const hours = Math.floor(best.sleepDuration! / 60);
    const mins = best.sleepDuration! % 60;
    records.push({
      metric: 'sleep',
      value: `${hours}h ${mins}m`,
      date: best.date,
      icon: '😴',
      label: 'Best Sleep',
    });
  }

  // Most calories
  const withCals = data.filter(d => d.activeCalories != null);
  if (withCals.length > 0) {
    const most = withCals.reduce((a, b) => (a.activeCalories! > b.activeCalories! ? a : b));
    records.push({
      metric: 'calories',
      value: most.activeCalories!,
      date: most.date,
      icon: '🔥',
      label: 'Most Cals Burned',
      unit: 'kcal',
    });
  }

  // Most flights
  const withFlights = data.filter(d => d.flightsClimbed != null);
  if (withFlights.length > 0) {
    const most = withFlights.reduce((a, b) => (a.flightsClimbed! > b.flightsClimbed! ? a : b));
    records.push({
      metric: 'flights',
      value: most.flightsClimbed!,
      date: most.date,
      icon: '🏔️',
      label: 'Most Flights',
    });
  }

  return records;
}

// Calculate streak for a metric
export function getStreak(data: DailyMetrics[], metric: 'steps' | 'calories', goal: number): number {
  let streak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    const val = metric === 'steps' ? data[i].steps : data[i].activeCalories;
    if (val != null && val >= goal) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getTodayMetrics(data: DailyMetrics[]): DailyMetrics | null {
  const today = new Date().toISOString().split('T')[0];
  return data.find(d => d.date === today) || (data.length > 0 ? data[data.length - 1] : null);
}

export function getComparisonDelta(data: DailyMetrics[], metric: keyof DailyMetrics, days: number = 7): { value: number; percentage: number } | null {
  if (data.length < days + 1) return null;

  const recent = data.slice(-days);
  const previous = data.slice(-days * 2, -days);
  if (previous.length === 0) return null;

  const recentAvg = recent.reduce((sum, d) => sum + (Number(d[metric]) || 0), 0) / recent.length;
  const prevAvg = previous.reduce((sum, d) => sum + (Number(d[metric]) || 0), 0) / previous.length;

  return {
    value: Math.round((recentAvg - prevAvg) * 10) / 10,
    percentage: prevAvg !== 0 ? Math.round(((recentAvg - prevAvg) / prevAvg) * 100) : 0,
  };
}
