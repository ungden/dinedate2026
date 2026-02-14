// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

/**
 * Auto-Expire Date Orders
 *
 * This function runs on a schedule (every hour) and:
 * 1. Finds date_orders where status = 'active' AND expires_at < NOW()
 * 2. Auto-expires them
 * 3. Refunds creator's escrow if any was held
 * 4. Sends notification to creator
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
    const now = new Date().toISOString();

    console.log(`[AUTO-EXPIRE] Running auto-expire job. Current time: ${now}`);

    // Find all active date_orders that have expired
    const { data: dateOrders, error: fetchError } = await admin
      .from('date_orders')
      .select('*')
      .eq('status', 'active')
      .lt('expires_at', now);

    if (fetchError) {
      console.error('[AUTO-EXPIRE] Error fetching date orders:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch date orders', details: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!dateOrders || dateOrders.length === 0) {
      console.log('[AUTO-EXPIRE] No date orders to auto-expire.');
      return new Response(JSON.stringify({ success: true, message: 'No date orders to auto-expire', processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[AUTO-EXPIRE] Found ${dateOrders.length} date orders to auto-expire.`);

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const dateOrder of dateOrders) {
      try {
        await processAutoExpire(admin, dateOrder);
        processedCount++;
        console.log(`[AUTO-EXPIRE] Successfully processed date order ${dateOrder.id}`);
      } catch (err: any) {
        errorCount++;
        const errorMsg = `Date order ${dateOrder.id}: ${err.message}`;
        errors.push(errorMsg);
        console.error(`[AUTO-EXPIRE] Error processing date order ${dateOrder.id}:`, err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Auto-expire job finished. Processed: ${processedCount}, Errors: ${errorCount}`,
      processed: processedCount,
      errors: errorCount > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('[AUTO-EXPIRE] Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Unexpected error', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

/**
 * Process auto-expiry for a single date order
 */
async function processAutoExpire(admin: any, dateOrder: any) {
  const creatorId = dateOrder.creator_id;
  const dateOrderId = dateOrder.id;

  // Refund creator's escrow if any was held (e.g. pre-hold on creation)
  const creatorRefund = Number(dateOrder.creator_charge || 0);

  if (creatorRefund > 0) {
    const { data: creatorWallet, error: creatorError } = await admin
      .from('users')
      .select('wallet_balance, wallet_escrow')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creatorWallet) {
      throw new Error(`Failed to fetch creator wallet: ${creatorError?.message || 'Not found'}`);
    }

    const currentBalance = Number(creatorWallet.wallet_balance || 0);
    const currentEscrow = Number(creatorWallet.wallet_escrow || 0);

    const { error: walletUpdateError } = await admin
      .from('users')
      .update({
        wallet_balance: currentBalance + creatorRefund,
        wallet_escrow: Math.max(0, currentEscrow - creatorRefund),
      })
      .eq('id', creatorId);

    if (walletUpdateError) {
      throw new Error(`Failed to update creator wallet: ${walletUpdateError.message}`);
    }

    // Log refund transaction
    await admin.from('transactions').insert({
      user_id: creatorId,
      type: 'refund',
      amount: creatorRefund,
      status: 'completed',
      description: `[Tu dong] Hoan tien do date order het han`,
      related_id: dateOrderId,
      payment_method: 'wallet',
      created_at: new Date().toISOString(),
    });
  }

  // Update date_order status to expired
  const { error: dateOrderUpdateError } = await admin
    .from('date_orders')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('id', dateOrderId);

  if (dateOrderUpdateError) {
    throw new Error(`Failed to update date order status: ${dateOrderUpdateError.message}`);
  }

  // Notify creator
  await admin.from('notifications').insert({
    user_id: creatorId,
    type: 'date_expired',
    title: 'Date order da het han',
    message: `Date order cua ban da het han ma khong co ai duoc chon.${creatorRefund > 0 ? ` Da hoan ${creatorRefund.toLocaleString('vi-VN')} VND ve vi.` : ''}`,
    data: { dateOrderId },
    is_read: false,
  });

  console.log(`[AUTO-EXPIRE] Date order ${dateOrderId} expired. Refunded creator: ${creatorRefund}`);
}
