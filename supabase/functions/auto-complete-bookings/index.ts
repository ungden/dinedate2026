// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

/**
 * Auto-Complete Bookings Function
 *
 * This function runs on a schedule (every hour) and:
 * 1. Finds all bookings with status = 'completed_pending'
 * 2. Where updated_at is more than 24 hours ago
 * 3. For each: executes the same logic as complete-booking (release escrow to partner)
 * 4. Logs the auto-completion
 * 5. Creates notification for both parties
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

// Spending Thresholds (same as complete-booking)
const VIP_THRESHOLD = 1_000_000;
const SVIP_THRESHOLD = 100_000_000;

// Auto-complete threshold: 24 hours in milliseconds
const AUTO_COMPLETE_HOURS = 24;
const AUTO_COMPLETE_MS = AUTO_COMPLETE_HOURS * 60 * 60 * 1000;

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
    // Calculate the cutoff time (24 hours ago)
    const cutoffTime = new Date(Date.now() - AUTO_COMPLETE_MS).toISOString();

    console.log(`[AUTO-COMPLETE] Running auto-complete job. Cutoff time: ${cutoffTime}`);

    // Find all bookings that need auto-completion
    // Exclude bookings that have been paused due to disputes
    const { data: bookings, error: fetchError } = await admin
      .from('bookings')
      .select('*')
      .eq('status', 'completed_pending')
      .is('dispute_paused_at', null)
      .lt('updated_at', cutoffTime);

    if (fetchError) {
      console.error('[AUTO-COMPLETE] Error fetching bookings:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch bookings', details: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!bookings || bookings.length === 0) {
      console.log('[AUTO-COMPLETE] No bookings to auto-complete.');
      return new Response(JSON.stringify({ success: true, message: 'No bookings to auto-complete', processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[AUTO-COMPLETE] Found ${bookings.length} bookings to auto-complete.`);

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const booking of bookings) {
      try {
        await processAutoComplete(admin, booking);
        processedCount++;
        console.log(`[AUTO-COMPLETE] Successfully processed booking ${booking.id}`);
      } catch (err: any) {
        errorCount++;
        const errorMsg = `Booking ${booking.id}: ${err.message}`;
        errors.push(errorMsg);
        console.error(`[AUTO-COMPLETE] Error processing booking ${booking.id}:`, err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Auto-complete job finished. Processed: ${processedCount}, Errors: ${errorCount}`,
      processed: processedCount,
      errors: errorCount > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('[AUTO-COMPLETE] Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Unexpected error', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

/**
 * Process auto-completion for a single booking
 * Same logic as complete-booking edge function when user confirms
 */
async function processAutoComplete(admin: any, booking: any) {
  const totalAmount = Number(booking.total_amount);
  const partnerEarning = Number(booking.partner_earning);
  const bookerId = booking.user_id;
  const partnerId = booking.partner_id;
  const bookingId = booking.id;

  // 1. Deduct Escrow from Booker
  const { data: bookerWallet, error: bookerError } = await admin
    .from('users')
    .select('wallet_escrow, total_spending, vip_tier')
    .eq('id', bookerId)
    .single();

  if (bookerError || !bookerWallet) {
    throw new Error(`Failed to fetch booker wallet: ${bookerError?.message || 'Not found'}`);
  }

  const currentEscrow = Number(bookerWallet.wallet_escrow || 0);
  const currentSpending = Number(bookerWallet.total_spending || 0);

  const newEscrow = currentEscrow - totalAmount;
  const newSpending = currentSpending + totalAmount;

  // Determine New Tier
  let newTier = bookerWallet.vip_tier || 'free';
  if (newSpending >= SVIP_THRESHOLD) newTier = 'svip';
  else if (newSpending >= VIP_THRESHOLD && newTier !== 'svip') newTier = 'vip';

  // 2. Update Booker: Escrow, Spending, Tier
  const { error: bookerUpdateError } = await admin
    .from('users')
    .update({
      wallet_escrow: newEscrow,
      total_spending: newSpending,
      vip_tier: newTier
    })
    .eq('id', bookerId);

  if (bookerUpdateError) {
    throw new Error(`Failed to update booker wallet: ${bookerUpdateError.message}`);
  }

  // 3. Notify if upgraded
  if (newTier !== bookerWallet.vip_tier) {
    await admin.from('notifications').insert({
      user_id: bookerId,
      type: 'system',
      title: `Chuc mung! Ban da len hang ${newTier.toUpperCase()}`,
      message: `Tong chi tieu cua ban da dat moc. Ban da mo khoa dac quyen xem tuoi Partner.`,
      is_read: false
    });
  }

  // 4. Add Balance to Partner
  const { data: partnerWallet, error: partnerError } = await admin
    .from('users')
    .select('wallet_balance')
    .eq('id', partnerId)
    .single();

  if (partnerError || !partnerWallet) {
    throw new Error(`Failed to fetch partner wallet: ${partnerError?.message || 'Not found'}`);
  }

  const currentBalance = Number(partnerWallet.wallet_balance || 0);
  const newBalance = currentBalance + partnerEarning;

  const { error: partnerUpdateError } = await admin
    .from('users')
    .update({ wallet_balance: newBalance })
    .eq('id', partnerId);

  if (partnerUpdateError) {
    throw new Error(`Failed to update partner wallet: ${partnerUpdateError.message}`);
  }

  // 5. Update Booking Status
  const { error: bookingUpdateError } = await admin
    .from('bookings')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      payout_status: 'paid',
      auto_completed: true // Mark as auto-completed
    })
    .eq('id', bookingId);

  if (bookingUpdateError) {
    throw new Error(`Failed to update booking status: ${bookingUpdateError.message}`);
  }

  // 6. Log Transactions
  await admin.from('transactions').insert({
    user_id: bookerId,
    type: 'booking_payment',
    amount: totalAmount,
    status: 'completed',
    description: `[Tu dong] Thanh toan dich vu: ${booking.activity}`,
    related_id: bookingId,
    payment_method: 'escrow'
  });

  await admin.from('transactions').insert({
    user_id: partnerId,
    type: 'booking_earning',
    amount: partnerEarning,
    status: 'completed',
    description: `[Tu dong] Thu nhap tu dich vu: ${booking.activity}`,
    related_id: bookingId
  });

  // 7. Create Notifications for both parties
  await admin.from('notifications').insert({
    user_id: bookerId,
    type: 'booking_completed',
    title: 'Don hang da tu dong hoan tat',
    message: `Don hang "${booking.activity}" da tu dong hoan tat sau 24h. Tien da duoc chuyen cho Partner.`,
    data: { bookingId },
    is_read: false
  });

  await admin.from('notifications').insert({
    user_id: partnerId,
    type: 'booking_completed',
    title: 'Da nhan thanh toan tu dong',
    message: `Don hang "${booking.activity}" da tu dong hoan tat. +${partnerEarning.toLocaleString('vi-VN')} VND da duoc cong vao vi cua ban.`,
    data: { bookingId },
    is_read: false
  });

  // 8. PRO PARTNER UPGRADE LOGIC
  const { count } = await admin
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('partner_id', partnerId)
    .eq('status', 'completed');

  const completedCount = (count || 0);

  const { data: partnerUser } = await admin
    .from('users')
    .select('average_rating, is_pro')
    .eq('id', partnerId)
    .single();

  const rating = Number(partnerUser?.average_rating || 5.0);
  const isAlreadyPro = !!partnerUser?.is_pro;

  if (!isAlreadyPro && completedCount >= 5 && rating >= 4.8) {
    await admin.from('users').update({ is_pro: true }).eq('id', partnerId);
    await admin.from('notifications').insert({
      user_id: partnerId,
      type: 'system',
      title: 'Chuc mung! Ban da len Pro Partner',
      message: 'Ban da hoan thanh 5 don xuat sac. Tinh nang Tu dat gia & Booking theo ngay da duoc mo khoa.',
      is_read: false
    });
  }

  console.log(`[AUTO-COMPLETE] Booking ${bookingId} auto-completed successfully`);
}
