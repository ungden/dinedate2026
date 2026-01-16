import { NextResponse } from 'next/server';

/**
 * API Route for Auto-Reject Bookings Cron Job
 *
 * This route can be called by:
 * 1. Vercel Cron Jobs (via vercel.json crons config)
 * 2. GitHub Actions scheduled workflows
 * 3. Any external cron service
 *
 * It triggers the Supabase Edge Function that auto-rejects
 * bookings that have been in 'pending' status for > 4 hours.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for this cron job

export async function GET(request: Request) {
  // Verify cron secret for security (optional but recommended)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[AUTO-REJECT CRON] Missing environment variables');
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 500 }
    );
  }

  try {
    console.log('[AUTO-REJECT CRON] Triggering auto-reject-bookings edge function...');

    const response = await fetch(`${supabaseUrl}/functions/v1/auto-reject-bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[AUTO-REJECT CRON] Edge function error:', data);
      return NextResponse.json(
        { success: false, error: data.error || 'Edge function failed' },
        { status: response.status }
      );
    }

    console.log('[AUTO-REJECT CRON] Edge function response:', data);

    return NextResponse.json({
      success: true,
      message: 'Auto-reject cron job executed successfully',
      result: data,
    });
  } catch (error: any) {
    console.error('[AUTO-REJECT CRON] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: Request) {
  return GET(request);
}
