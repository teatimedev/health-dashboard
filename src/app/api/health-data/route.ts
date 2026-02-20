import { NextRequest, NextResponse } from 'next/server';

// POST /api/health-data
// Accepts JSON or CSV from Health Auto Export
// Secured with x-api-key header matching API_KEY env var
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

    // For now, we store in a simple approach
    // In production, this would go to Supabase
    // The client will poll or receive via websocket

    // Return success - the actual parsing happens client-side
    // This endpoint is a webhook receiver for Health Auto Export
    return NextResponse.json({
      success: true,
      message: 'Data received',
      size: body.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing health data:', error);
    return NextResponse.json(
      { error: 'Failed to process data' },
      { status: 500 }
    );
  }
}

// GET /api/health-data - health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'RECON Health Intelligence System',
    endpoints: {
      'POST /api/health-data': 'Submit health data (JSON/CSV)',
    },
  });
}
