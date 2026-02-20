import { DailyMetrics } from './types';

// Generate realistic mock data matching Jordan's profile
export function generateMockData(): DailyMetrics[] {
  const data: DailyMetrics[] = [];
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 90);

  let weight = 104.2;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayIndex = Math.floor((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Weight: general downward trend ~0.5kg/week with daily fluctuations
    weight -= (Math.random() * 0.12 + 0.04);
    weight += (Math.random() - 0.48) * 0.5;
    // Plateau around days 30-45
    if (dayIndex > 30 && dayIndex < 45) weight += 0.025;
    const dailyWeight = Math.round(weight * 10) / 10;

    // Steps: weekdays 8000-12000, weekends 3000-7000
    const baseSteps = isWeekend ? 3000 + Math.random() * 4000 : 8000 + Math.random() * 4000;
    const steps = Math.round(baseSteps);

    // Active calories: correlates with steps
    const activeCalories = Math.round(steps * 0.045 + Math.random() * 80);

    // Basal calories
    const basalCalories = Math.round(1800 + Math.random() * 100);

    // Distance: roughly steps / 1350
    const distance = Math.round((steps / 1350) * 10) / 10;

    // Flights: 3-12
    const flightsClimbed = Math.round(3 + Math.random() * 9);

    // Resting HR: starts at ~74, trends down to ~69
    const hrTrend = 74 - (dayIndex / 90) * 5;
    const restingHeartRate = Math.round(hrTrend + (Math.random() - 0.5) * 3);

    // Heart rate range
    const heartRateMin = Math.round(55 + Math.random() * 8);
    const heartRateMax = Math.round(120 + Math.random() * 30);
    const heartRateAvg = Math.round(70 + Math.random() * 10);

    // Sleep: 6-8 hours, weekends slightly more
    const baseSleep = isWeekend ? 7.5 : 6.8;
    const sleepHours = baseSleep + (Math.random() - 0.5) * 1.5;
    const sleepDuration = Math.round(sleepHours * 60);
    const sleepInBed = Math.round(sleepDuration + 20 + Math.random() * 30);
    const sleepDeep = Math.round(sleepDuration * (0.15 + Math.random() * 0.08));
    const sleepREM = Math.round(sleepDuration * (0.2 + Math.random() * 0.05));
    const sleepAwake = Math.round(sleepInBed - sleepDuration);
    const sleepLight = sleepDuration - sleepDeep - sleepREM;

    // Body fat: starts ~30.2%, trends down
    const bodyFat = Math.round((30.2 - (dayIndex / 90) * 1.8 + (Math.random() - 0.5) * 0.4) * 10) / 10;

    // Blood oxygen
    const bloodOxygen = Math.round((96 + Math.random() * 3) * 10) / 10;

    data.push({
      date: dateStr,
      weight: dailyWeight,
      bodyFat,
      steps,
      activeCalories,
      basalCalories,
      distance,
      flightsClimbed,
      restingHeartRate,
      heartRateMin,
      heartRateMax,
      heartRateAvg,
      sleepDuration,
      sleepInBed,
      sleepDeep,
      sleepLight,
      sleepREM,
      sleepAwake,
      bloodOxygen,
    });
  }

  // Adjust weight to end near 97.8
  const offset = 97.8 - data[data.length - 1].weight!;
  for (let i = 0; i < data.length; i++) {
    data[i].weight = Math.round((data[i].weight! + offset * (i / data.length)) * 10) / 10;
  }

  return data;
}
