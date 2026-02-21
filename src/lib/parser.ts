import Papa from 'papaparse';
import { DailyMetrics } from './types';

// Health Auto Export field mappings (CSV column names → DailyMetrics keys)
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

// Health Auto Export metric name → how to map the data point
// Format: { field: DailyMetrics key, valueKey: which field in the data point to use }
const METRIC_NAME_MAP: Record<string, { field: keyof DailyMetrics; valueKey: string; convert?: (v: number) => number }[]> = {
  // Body
  'body_mass': [{ field: 'weight', valueKey: 'qty' }],
  'weight': [{ field: 'weight', valueKey: 'qty' }],
  'body_fat_percentage': [{ field: 'bodyFat', valueKey: 'qty' }],
  'lean_body_mass': [],
  'body_mass_index': [],

  // Activity
  'step_count': [{ field: 'steps', valueKey: 'qty' }],
  'active_energy_burned': [{ field: 'activeCalories', valueKey: 'qty' }],
  'active_energy': [{ field: 'activeCalories', valueKey: 'qty' }],
  'basal_energy_burned': [{ field: 'basalCalories', valueKey: 'qty' }],
  'distance_walking_running': [{ field: 'distance', valueKey: 'qty' }],
  'walking_running_distance': [{ field: 'distance', valueKey: 'qty' }],
  'flights_climbed': [{ field: 'flightsClimbed', valueKey: 'qty' }],

  // Heart
  'heart_rate': [
    { field: 'heartRateMin', valueKey: 'min' },
    { field: 'heartRateMax', valueKey: 'max' },
    { field: 'heartRateAvg', valueKey: 'avg' },
  ],
  'resting_heart_rate': [{ field: 'restingHeartRate', valueKey: 'avg' }],
  'heart_rate_variability_sdnn': [],

  // Sleep — HAE can report in hours; we store in minutes
  'sleep_analysis': [
    { field: 'sleepDuration', valueKey: 'asleep', convert: hoursToMins },
    { field: 'sleepInBed', valueKey: 'inBed', convert: hoursToMins },
  ],
  'sleep_analysis_asleep': [{ field: 'sleepDuration', valueKey: 'qty', convert: hoursToMins }],
  'sleep_analysis_inbed': [{ field: 'sleepInBed', valueKey: 'qty', convert: hoursToMins }],
  'sleep_deep': [{ field: 'sleepDeep', valueKey: 'qty', convert: hoursToMins }],
  'sleep_core': [{ field: 'sleepLight', valueKey: 'qty', convert: hoursToMins }],
  'sleep_rem': [{ field: 'sleepREM', valueKey: 'qty', convert: hoursToMins }],
  'sleep_awake': [{ field: 'sleepAwake', valueKey: 'qty', convert: hoursToMins }],

  // Blood Oxygen
  'oxygen_saturation': [{ field: 'bloodOxygen', valueKey: 'avg' }],
  'blood_oxygen': [{ field: 'bloodOxygen', valueKey: 'avg' }],
};

function hoursToMins(v: number): number {
  // If the value is < 24, it's probably hours → convert to minutes
  // If >= 24, it's probably already in minutes
  return v < 24 ? Math.round(v * 60) : Math.round(v);
}

function normalizeDate(dateStr: string): string {
  // Handle ISO 8601 with timezone
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

/**
 * Parse Health Auto Export JSON format.
 *
 * Supported structures:
 * 1. HAE standard:  { "data": { "metrics": [ { "name": "...", "units": "...", "data": [...] } ] } }
 * 2. Flat metrics:  { "metrics": [ { "name": "...", "data": [...] } ] }
 * 3. Array of daily records: [ { "date": "...", "steps": 1234, ... } ]
 * 4. Summarized (aggregated by day): { "data": { "metrics": [ { "name": "step_count", "data": [ { "date": "...", "qty": 12345 } ] } ] } }
 */
export function parseJSON(jsonText: string): DailyMetrics[] {
  const data = JSON.parse(jsonText);
  const metrics: Map<string, DailyMetrics> = new Map();

  // Extract metric groups from various wrapper formats
  let metricGroups: { name?: string; data?: unknown[] }[] = [];

  if (data?.data?.metrics && Array.isArray(data.data.metrics)) {
    // HAE standard: { "data": { "metrics": [...] } }
    metricGroups = data.data.metrics;
  } else if (data?.metrics && Array.isArray(data.metrics)) {
    // { "metrics": [...] }
    metricGroups = data.metrics;
  } else if (Array.isArray(data)) {
    // Array of daily records — handle as flat records
    for (const row of data) {
      if (!row || typeof row !== 'object') continue;
      const record = row as Record<string, unknown>;
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
    return Array.from(metrics.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Process HAE metric groups: { name: "step_count", units: "count", data: [...] }
  for (const group of metricGroups) {
    if (!group || typeof group !== 'object') continue;

    const metricName = String(group.name || '').toLowerCase().trim();
    const dataPoints = group.data;

    if (!metricName || !Array.isArray(dataPoints)) continue;

    // Find mappings for this metric name
    const mappings = METRIC_NAME_MAP[metricName];

    for (const point of dataPoints) {
      if (!point || typeof point !== 'object') continue;
      const entry = point as Record<string, unknown>;

      // Get the date
      const dateStr = String(entry.date || entry.Date || '');
      if (!dateStr) continue;
      const date = normalizeDate(dateStr);
      const existing = metrics.get(date) || { date };

      if (mappings && mappings.length > 0) {
        // Use known mappings
        for (const mapping of mappings) {
          const rawVal = parseNumber(entry[mapping.valueKey] ?? entry.qty ?? entry.value ?? entry.avg);
          if (rawVal !== undefined) {
            const val = mapping.convert ? mapping.convert(rawVal) : rawVal;
            (existing as unknown as Record<string, unknown>)[mapping.field] = val;
          }
        }
      } else {
        // Unknown metric — try generic field mapping from FIELD_MAP
        const fieldKey = FIELD_MAP[metricName];
        if (fieldKey && fieldKey !== 'date') {
          const val = parseNumber(entry.qty ?? entry.value ?? entry.avg);
          if (val !== undefined) {
            (existing as unknown as Record<string, unknown>)[fieldKey] = val;
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
