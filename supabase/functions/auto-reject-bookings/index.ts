// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

/**
 * Auto-Reject Bookings Function
 *
 * This function runs on a schedule (every hour) and:
 * 1. Finds all bookings with status = 'pending'
 * 2. Where created_at is more than 4 hours ago
 * 3. For each: executes refund logic (same as reject-booking)
 * 4. Creates notification: "Partner khong phan hoi. Da hoan tien."
 */

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://www.dinedate.vn').split(',');

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// Auto-reject threshold: 4 hours in milliseconds
const AUTO_REJECT_HOURS = 4;
const AUTO_REJECT_MS = AUTO_REJECT_HOURS * 60 * 60 * 1000;

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Calculate the cutoff time (4 hours ago)
    const cutoffTime = new Date(Date.now() - AUTO_REJECT_MS).toISOString();

    console.log(`[AUTO-REJECT] Running auto-reject job. Cutoff time: ${cutoffTime}`);

    // Find all bookings that need auto-rejection
    const { data: bookings, error: fetchError } = await admin
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', cutoffTime);

    if (fetchError) {
      console.error('[AUTO-REJECT] Error fetching bookings:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch bookings', details: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!bookings || bookings.length === 0) {
      console.log('[AUTO-REJECT] No bookings to auto-reject.');
      return new Response(JSON.stringify({ success: true, message: 'No bookings to auto-reject', processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[AUTO-REJECT] Found ${bookings.length} bookings to auto-reject.`);

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const booking of bookings) {
      try {
        await processAutoReject(admin, booking);
        processedCount++;
        console.log(`[AUTO-REJECT] Successfully processed booking ${booking.id}`);
      } catch (err: any) {
        errorCount++;
        const errorMsg = `Booking ${booking.id}: ${err.message}`;
        errors.push(errorMsg);
        console.error(`[AUTO-REJECT] Error processing booking ${booking.id}:`, err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Auto-reject job finished. Processed: ${processedCount}, Errors: ${errorCount}`,
      processed: processedCount,
      errors: errorCount > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('[AUTO-REJECT] Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Unexpected error', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

/**
 * Process auto-rejection for a single booking
 * Same logic as reject-booking edge function
 */
async function processAutoReject(admin: any, booking: any) {
  const refundAmount = Number(booking.total_amount || 0);
  const bookerId = booking.user_id;
  const partnerId = booking.partner_id;
  const bookingId = booking.id;

  // 1. Fetch Booker Wallet
  const { data: bookerWallet, error: bookerError } = await admin
    .from('users')
    .select('wallet_balance, wallet_escrow')
    .eq('id', bookerId)
    .single();

  if (bookerError || !bookerWallet) {
    throw new Error(`Failed to fetch booker wallet: ${bookerError?.message || 'Not found'}`);
  }

  const currentBalance = Number(bookerWallet.wallet_balance || 0);
  const currentEscrow = Number(bookerWallet.wallet_escrow || 0);

  // 2. Return Money (Balance + Refund, Escrow - Refund)
  const { error: walletUpdateError } = await admin
    .from('users')
    .update({
      wallet_balance: currentBalance + refundAmount,
      wallet_escrow: Math.max(0, currentEscrow - refundAmount)
    })
    .eq('id', bookerId);

  if (walletUpdateError) {
    throw new Error(`Failed to update booker wallet: ${walletUpdateError.message}`);
  }

  // 3. Update Booking Status
  const { error: bookingUpdateError } = await admin
    .from('bookings')
    .update({
      status: 'auto_rejected',
      updated_at: new Date().toISOString(),
      auto_rejected: true // Mark as auto-rejected
    })
    .eq('id', bookingId);

  if (bookingUpdateError) {
    throw new Error(`Failed to update booking status: ${bookingUpdateError.message}`);
  }

  // 4. Log Transaction
  await admin.from('transactions').insert({
    user_id: bookerId,
    type: 'refund',
    amount: refundAmount,
    status: 'completed',
    description: `[Tu dong] Hoan tien do Partner khong phan hoi: ${booking.activity}`,
    related_id: bookingId,
    payment_method: 'wallet',
    created_at: new Date().toISOString()
  });

  // 5. Create Notifications for both parties
  // Notify User (Booker)
  await admin.from('notifications').insert({
    user_id: bookerId,
    type: 'booking_rejected',
    title: 'Don hang tu dong huy',
    message: `Partner khong phan hoi trong 4 gio. Da hoan ${refundAmount.toLocaleString('vi-VN')} VND ve vi cua ban.`,
    data: { bookingId },
    is_read: false
  });

  // Notify Partner
  await admin.from('notifications').insert({
    user_id: partnerId,
    type: 'booking_expired',
    title: 'Don hang da het han',
    message: `Ban da bo lo don hang "${booking.activity}" do khong phan hoi trong 4 gio. Don hang da tu dong huy.`,
    data: { bookingId },
    is_read: false
  });

  console.log(`[AUTO-REJECT] Booking ${bookingId} auto-rejected successfully. Refunded: ${refundAmount}`);
}
