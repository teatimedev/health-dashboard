import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { parseHealthData } from '@/lib/parser';
import { DailyMetrics } from '@/lib/types';

// Convert camelCase DailyMetrics to snake_case for Supabase
function toDbRow(m: DailyMetrics) {
  return {
    date: m.date,
    weight: m.weight ?? null,
    body_fat: m.bodyFat ?? null,
    steps: m.steps ?? null,
    active_calories: m.activeCalories ?? null,
    basal_calories: m.basalCalories ?? null,
    distance: m.distance ?? null,
    flights_climbed: m.flightsClimbed ?? null,
    resting_heart_rate: m.restingHeartRate ?? null,
    heart_rate_min: m.heartRateMin ?? null,
    heart_rate_max: m.heartRateMax ?? null,
    heart_rate_avg: m.heartRateAvg ?? null,
    sleep_duration: m.sleepDuration ?? null,
    sleep_in_bed: m.sleepInBed ?? null,
    sleep_deep: m.sleepDeep ?? null,
    sleep_light: m.sleepLight ?? null,
    sleep_rem: m.sleepREM ?? null,
    sleep_awake: m.sleepAwake ?? null,
    blood_oxygen: m.bloodOxygen ?? null,
    updated_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  // Auth check
  const apiKey = process.env.API_KEY;
  if (apiKey) {
    const provided = request.headers.get('x-api-key');
    if (provided !== apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let body: string;

    if (contentType.includes('application/json')) {
      const json = await request.json();
      body = JSON.stringify(json);
    } else {
      body = await request.text();
    }

    // Parse the health data
    const parsed = parseHealthData(body, contentType.includes('json') ? 'data.json' : 'data.csv');

    if (parsed.length === 0) {
      return NextResponse.json({ error: 'No valid health data found' }, { status: 400 });
    }

    // Store in Supabase
    const supabase = getServiceClient();
    if (supabase) {
      const rows = parsed.map(toDbRow);

      // Upsert in batches of 100
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        const { error } = await supabase
          .from('daily_metrics')
          .upsert(batch, { onConflict: 'date' });

        if (error) {
          console.error('Supabase upsert error:', error);
          return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${parsed.length} days of health data`,
      days: parsed.length,
      dateRange: {
        from: parsed[0].date,
        to: parsed[parsed.length - 1].date,
      },
      stored: !!supabase,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing health data:', error);
    return NextResponse.json(
      { error: 'Failed to process data', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/health-data - fetch stored data
export async function GET(request: NextRequest) {
  const apiKey = process.env.API_KEY;
  if (apiKey) {
    const provided = request.headers.get('x-api-key') || request.nextUrl.searchParams.get('key');
    if (provided !== apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('daily_metrics')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count: data?.length || 0 });
}
