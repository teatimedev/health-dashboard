// Core health data types

export interface DailyMetrics {
  date: string; // YYYY-MM-DD
  weight?: number; // kg
  bodyFat?: number; // percentage
  steps?: number;
  activeCalories?: number; // kcal
  basalCalories?: number; // kcal
  distance?: number; // km
  flightsClimbed?: number;
  restingHeartRate?: number; // bpm
  heartRateMin?: number;
  heartRateMax?: number;
  heartRateAvg?: number;
  sleepDuration?: number; // minutes
  sleepInBed?: number; // minutes
  sleepDeep?: number; // minutes
  sleepLight?: number; // minutes
  sleepREM?: number; // minutes
  sleepAwake?: number; // minutes
  bloodOxygen?: number; // percentage
}

export interface HourlyMetrics {
  date: string;
  hour: number; // 0-23
  steps?: number;
  heartRate?: number;
  activeCalories?: number;
}

export interface Workout {
  date: string;
  type: string;
  duration: number; // minutes
  calories: number;
  distance?: number; // km
  heartRateAvg?: number;
}

export interface Goals {
  targetWeight?: number; // kg
  targetDate?: string; // YYYY-MM-DD
  dailySteps?: number;
  dailyCalories?: number;
  dailySleep?: number; // minutes
}

export interface WeightTrend {
  date: string;
  weight: number;
  movingAvg7d: number;
  movingAvg30d: number;
}

export interface PersonalRecord {
  metric: string;
  value: number | string;
  date: string;
  icon: string;
  label: string;
  unit?: string;
}

export type TimeRange = '7D' | '30D' | '90D' | '6M' | '1Y' | 'ALL';

export type ViewTab = 'dashboard' | 'weight' | 'activity' | 'heart' | 'sleep' | 'sitrep';
