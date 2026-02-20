import Papa from 'papaparse';
import { DailyMetrics, HourlyMetrics } from './types';

// Health Auto Export field mappings
const FIELD_MAP: Record<string, keyof DailyMetrics> = {
  'date': 'date',
  'Date': 'date',
  'weight': 'weight',
  'Weight': 'weight',
  'weight_kg': 'weight',
  'Weight (kg)': 'weight',
  'body_mass': 'weight',
  'Body Mass (kg)': 'weight',
  'body_fat_percentage': 'bodyFat',
  'Body Fat Percentage': 'bodyFat',
  'body_fat': 'bodyFat',
  'step_count': 'steps',
  'Step Count': 'steps',
  'steps': 'steps',
  'Steps': 'steps',
  'active_energy': 'activeCalories',
  'Active Energy (kcal)': 'activeCalories',
  'active_energy_burned': 'activeCalories',
  'Active Energy Burned (kcal)': 'activeCalories',
  'basal_energy_burned': 'basalCalories',
  'Basal Energy Burned (kcal)': 'basalCalories',
  'walking_running_distance': 'distance',
  'Walking + Running Distance (km)': 'distance',
  'distance_walking_running': 'distance',
  'flights_climbed': 'flightsClimbed',
  'Flights Climbed': 'flightsClimbed',
  'resting_heart_rate': 'restingHeartRate',
  'Resting Heart Rate (bpm)': 'restingHeartRate',
  'heart_rate_min': 'heartRateMin',
  'heart_rate_max': 'heartRateMax',
  'heart_rate_avg': 'heartRateAvg',
  'Heart Rate [Min] (bpm)': 'heartRateMin',
  'Heart Rate [Max] (bpm)': 'heartRateMax',
  'Heart Rate [Avg] (bpm)': 'heartRateAvg',
  'sleep_duration': 'sleepDuration',
  'Sleep Duration (min)': 'sleepDuration',
  'sleep_analysis_asleep': 'sleepDuration',
  'Sleep Analysis [Asleep] (hr)': 'sleepDuration',
  'sleep_analysis_inbed': 'sleepInBed',
  'Sleep Analysis [In Bed] (hr)': 'sleepInBed',
  'sleep_deep': 'sleepDeep',
  'sleep_light': 'sleepLight',
  'sleep_rem': 'sleepREM',
  'sleep_awake': 'sleepAwake',
  'blood_oxygen': 'bloodOxygen',
  'Blood Oxygen (%)': 'bloodOxygen',
  'oxygen_saturation': 'bloodOxygen',
};

function normalizeDate(dateStr: string): string {
  // Handle various date formats
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  // Try DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
}

function parseNumber(val: unknown): number | undefined {
  if (val === null || val === undefined || val === '') return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}

export function parseCSV(csvText: string): DailyMetrics[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const metrics: Map<string, DailyMetrics> = new Map();

  for (const row of result.data as unknown as Record<string, unknown>[]) {
    const mapped: Partial<DailyMetrics> = {};

    for (const [csvKey, value] of Object.entries(row)) {
      const metricKey = FIELD_MAP[csvKey] || FIELD_MAP[csvKey.trim()];
      if (metricKey && value !== null && value !== undefined && value !== '') {
        if (metricKey === 'date') {
          mapped.date = normalizeDate(String(value));
        } else {
          let num = parseNumber(value);
          // Convert hours to minutes for sleep fields from Health Auto Export
          if (num !== undefined && csvKey.includes('(hr)') &&
              (metricKey === 'sleepDuration' || metricKey === 'sleepInBed')) {
            num = Math.round(num * 60);
          }
          (mapped as unknown as Record<string, unknown>)[metricKey] = num;
        }
      }
    }

    if (mapped.date) {
      const existing = metrics.get(mapped.date) || { date: mapped.date };
      // Merge: keep existing values, overwrite with new non-undefined values
      for (const [key, value] of Object.entries(mapped)) {
        if (value !== undefined) {
          (existing as unknown as Record<string, unknown>)[key] = value;
        }
      }
      metrics.set(mapped.date, existing as DailyMetrics);
    }
  }

  return Array.from(metrics.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function parseJSON(jsonText: string): DailyMetrics[] {
  const data = JSON.parse(jsonText);
  const metrics: Map<string, DailyMetrics> = new Map();

  // Health Auto Export JSON format: { "data": { "metrics": [...] } }
  // or array of metric objects
  let metricArrays: Record<string, unknown>[][] = [];

  if (data?.data?.metrics) {
    metricArrays = data.data.metrics;
  } else if (Array.isArray(data)) {
    metricArrays = [data];
  } else if (data?.metrics) {
    metricArrays = Array.isArray(data.metrics[0]) ? data.metrics : [data.metrics];
  }

  // Handle Health Auto Export format: each metric type has its own array
  for (const metricGroup of metricArrays) {
    if (!Array.isArray(metricGroup)) {
      // Might be { name: "...", data: [...] } format
      const group = metricGroup as unknown as Record<string, unknown>;
      if (group.name && Array.isArray(group.data)) {
        const metricName = String(group.name);
        for (const entry of group.data as unknown as Record<string, unknown>[]) {
          const dateStr = String(entry.date || entry.Date || '');
          if (!dateStr) continue;
          const date = normalizeDate(dateStr);
          const existing = metrics.get(date) || { date };

          const fieldKey = FIELD_MAP[metricName];
          if (fieldKey && fieldKey !== 'date') {
            const val = parseNumber(entry.qty || entry.value || entry.avg);
            if (val !== undefined) {
              (existing as unknown as Record<string, unknown>)[fieldKey] = val;
            }
          }
          metrics.set(date, existing as DailyMetrics);
        }
      }
      continue;
    }

    // Array of daily records
    for (const row of metricGroup) {
      const record = row as unknown as Record<string, unknown>;
      const dateStr = String(record.date || record.Date || record.dateString || '');
      if (!dateStr) continue;

      const date = normalizeDate(dateStr);
      const existing = metrics.get(date) || { date };

      for (const [key, value] of Object.entries(record)) {
        const fieldKey = FIELD_MAP[key];
        if (fieldKey && fieldKey !== 'date' && value !== null && value !== undefined) {
          const num = parseNumber(value);
          if (num !== undefined) {
            (existing as unknown as Record<string, unknown>)[fieldKey] = num;
          }
        }
      }

      metrics.set(date, existing as DailyMetrics);
    }
  }

  return Array.from(metrics.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function parseHealthData(text: string, filename: string): DailyMetrics[] {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'csv') {
    return parseCSV(text);
  } else if (ext === 'json') {
    return parseJSON(text);
  }
  // Try JSON first, fall back to CSV
  try {
    return parseJSON(text);
  } catch {
    return parseCSV(text);
  }
}

// Merge new data with existing, avoiding duplicates
export function mergeMetrics(existing: DailyMetrics[], incoming: DailyMetrics[]): DailyMetrics[] {
  const map = new Map<string, DailyMetrics>();

  for (const m of existing) {
    map.set(m.date, { ...m });
  }

  for (const m of incoming) {
    const current = map.get(m.date) || { date: m.date };
    for (const [key, value] of Object.entries(m)) {
      if (value !== undefined && value !== null) {
        (current as unknown as Record<string, unknown>)[key] = value;
      }
    }
    map.set(m.date, current as DailyMetrics);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
