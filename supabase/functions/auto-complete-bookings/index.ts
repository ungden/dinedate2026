// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

/**
 * Auto-Complete Date Orders
 *
 * This function runs on a schedule (every hour) and:
 * 1. Finds date_orders where status = 'matched' AND date_time < NOW() - 4 hours
 * 2. Auto-completes them
 * 3. Releases escrow to restaurant, keeps platform fee
 * 4. Increments both users' total_dates counter
 * 5. Sends review request notifications
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

// Auto-complete: 4 hours after date_time
const AUTO_COMPLETE_HOURS = 4;
const AUTO_COMPLETE_MS = AUTO_COMPLETE_HOURS * 60 * 60 * 1000;

// Restaurant commission rate
const RESTAURANT_COMMISSION_RATE = 0.15;

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
    // Calculate cutoff time (4 hours ago = date has already passed + buffer)
    const cutoffTime = new Date(Date.now() - AUTO_COMPLETE_MS).toISOString();

    console.log(`[AUTO-COMPLETE] Running auto-complete job. Cutoff time: ${cutoffTime}`);

    // Find all matched date_orders where date_time has passed by 4+ hours
    const { data: dateOrders, error: fetchError } = await admin
      .from('date_orders')
      .select('*')
      .eq('status', 'matched')
      .lt('date_time', cutoffTime);

    if (fetchError) {
      console.error('[AUTO-COMPLETE] Error fetching date orders:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch date orders', details: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!dateOrders || dateOrders.length === 0) {
      console.log('[AUTO-COMPLETE] No date orders to auto-complete.');
      return new Response(JSON.stringify({ success: true, message: 'No date orders to auto-complete', processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[AUTO-COMPLETE] Found ${dateOrders.length} date orders to auto-complete.`);

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const dateOrder of dateOrders) {
      try {
        await processAutoComplete(admin, dateOrder);
        processedCount++;
        console.log(`[AUTO-COMPLETE] Successfully processed date order ${dateOrder.id}`);
      } catch (err: any) {
        errorCount++;
        const errorMsg = `Date order ${dateOrder.id}: ${err.message}`;
        errors.push(errorMsg);
        console.error(`[AUTO-COMPLETE] Error processing date order ${dateOrder.id}:`, err);
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
 * Process auto-completion for a single date order
 */
async function processAutoComplete(admin: any, dateOrder: any) {
  const creatorId = dateOrder.creator_id;
  const applicantId = dateOrder.matched_user_id;
  const dateOrderId = dateOrder.id;
  const comboPrice = Number(dateOrder.combo_price || 0);
  const creatorCharge = Number(dateOrder.creator_charge || 0);
  const applicantCharge = Number(dateOrder.applicant_charge || 0);
  const restaurantPayout = Number(dateOrder.restaurant_payout || Math.round(comboPrice * (1 - RESTAURANT_COMMISSION_RATE)));

  // 1. Deduct escrow and increment total_dates for creator
  const { data: creatorWallet, error: creatorError } = await admin
    .from('users')
    .select('wallet_escrow, total_dates')
    .eq('id', creatorId)
    .single();

  if (creatorError || !creatorWallet) {
    throw new Error(`Failed to fetch creator wallet: ${creatorError?.message || 'Not found'}`);
  }

  const creatorEscrow = Number(creatorWallet.wallet_escrow || 0);
  const creatorDates = Number(creatorWallet.total_dates || 0);

  const { error: creatorUpdateError } = await admin
    .from('users')
    .update({
      wallet_escrow: Math.max(0, creatorEscrow - creatorCharge),
      total_dates: creatorDates + 1,
    })
    .eq('id', creatorId);

  if (creatorUpdateError) {
    throw new Error(`Failed to update creator wallet: ${creatorUpdateError.message}`);
  }

  // 2. Deduct escrow and increment total_dates for applicant
  const { data: applicantWallet, error: applicantError } = await admin
    .from('users')
    .select('wallet_escrow, total_dates')
    .eq('id', applicantId)
    .single();

  if (applicantError || !applicantWallet) {
    throw new Error(`Failed to fetch applicant wallet: ${applicantError?.message || 'Not found'}`);
  }

  const applicantEscrow = Number(applicantWallet.wallet_escrow || 0);
  const applicantDates = Number(applicantWallet.total_dates || 0);

  const { error: applicantUpdateError } = await admin
    .from('users')
    .update({
      wallet_escrow: Math.max(0, applicantEscrow - applicantCharge),
      total_dates: applicantDates + 1,
    })
    .eq('id', applicantId);

  if (applicantUpdateError) {
    throw new Error(`Failed to update applicant wallet: ${applicantUpdateError.message}`);
  }

  // 3. Pay restaurant
  if (dateOrder.restaurant_id) {
    const { data: restaurant } = await admin
      .from('restaurants')
      .select('id, pending_payout')
      .eq('id', dateOrder.restaurant_id)
      .single();

    if (restaurant) {
      const currentPayout = Number(restaurant.pending_payout || 0);
      await admin.from('restaurants').update({
        pending_payout: currentPayout + restaurantPayout,
      }).eq('id', dateOrder.restaurant_id);
    }
  }

  // 4. Update date_order status
  const { error: dateOrderUpdateError } = await admin
    .from('date_orders')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      auto_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dateOrderId);

  if (dateOrderUpdateError) {
    throw new Error(`Failed to update date order status: ${dateOrderUpdateError.message}`);
  }

  // Update table_booking
  await admin.from('table_bookings').update({
    status: 'completed',
  }).eq('date_order_id', dateOrderId);

  // 5. Log transactions
  await admin.from('transactions').insert([
    {
      user_id: creatorId,
      type: 'date_payment',
      amount: creatorCharge,
      status: 'completed',
      description: `[Tu dong] Thanh toan date hoan tat`,
      related_id: dateOrderId,
      payment_method: 'escrow',
    },
    {
      user_id: applicantId,
      type: 'date_payment',
      amount: applicantCharge,
      status: 'completed',
      description: `[Tu dong] Thanh toan date hoan tat`,
      related_id: dateOrderId,
      payment_method: 'escrow',
    },
  ]);

  // 6. Send review request notifications
  await admin.from('notifications').insert([
    {
      user_id: creatorId,
      type: 'review_request',
      title: 'Date da tu dong hoan tat!',
      message: 'Date cua ban da tu dong hoan tat. Hay danh gia trai nghiem cua ban.',
      data: { dateOrderId, reviewTarget: applicantId },
      is_read: false,
    },
    {
      user_id: applicantId,
      type: 'review_request',
      title: 'Date da tu dong hoan tat!',
      message: 'Date cua ban da tu dong hoan tat. Hay danh gia trai nghiem cua ban.',
      data: { dateOrderId, reviewTarget: creatorId },
      is_read: false,
    },
  ]);

  console.log(`[AUTO-COMPLETE] Date order ${dateOrderId} auto-completed successfully`);
}
