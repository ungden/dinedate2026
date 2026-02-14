// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

/**
 * Cancel/Reject Date Order
 *
 * - Cancel a date order (by creator) or reject (by system for expired orders)
 * - Refund both users' escrow (full refund)
 * - Update status to 'cancelled' or 'expired'
 * - Send notification
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

  // 1. Auth check
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  
  const token = authHeader.replace('Bearer ', '')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const admin = createClient(supabaseUrl, supabaseServiceKey)
  
  // Verify user
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  
  const callerId = userData.user.id

  // 2. Parse body
  const { dateOrderId, reason } = await req.json()
  if (!dateOrderId) {
    return new Response(JSON.stringify({ error: 'Missing dateOrderId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 3. Fetch date_order
  const { data: dateOrder, error: dateOrderErr } = await admin
    .from('date_orders')
    .select('*')
    .eq('id', dateOrderId)
    .single()

  if (dateOrderErr || !dateOrder) {
    return new Response(JSON.stringify({ error: 'Date order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const isCreator = dateOrder.creator_id === callerId;

  if (!isCreator) {
    return new Response(JSON.stringify({ error: 'Only the creator can cancel a date order' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 4. Validate status - can cancel if 'active' or 'matched'
  if (dateOrder.status !== 'active' && dateOrder.status !== 'matched') {
    return new Response(JSON.stringify({ error: 'Date order cannot be cancelled in current status' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const creatorId = dateOrder.creator_id
  const applicantId = dateOrder.matched_user_id

  // 5. Refund creator escrow
  const creatorRefund = Number(dateOrder.creator_charge || 0)
  if (creatorRefund > 0) {
    const { data: creatorWallet } = await admin.from('users').select('wallet_balance, wallet_escrow').eq('id', creatorId).single()
    if (creatorWallet) {
      const creatorBalance = Number(creatorWallet.wallet_balance || 0)
      const creatorEscrow = Number(creatorWallet.wallet_escrow || 0)

      await admin.from('users').update({
        wallet_balance: creatorBalance + creatorRefund,
        wallet_escrow: Math.max(0, creatorEscrow - creatorRefund),
      }).eq('id', creatorId)

      // Log refund transaction
      await admin.from('transactions').insert({
        user_id: creatorId,
        type: 'refund',
        amount: creatorRefund,
        status: 'completed',
        description: `Hoan tien do huy date order`,
        related_id: dateOrderId,
        payment_method: 'wallet',
        created_at: new Date().toISOString(),
      })
    }
  }

  // 6. Refund applicant escrow (if matched)
  if (applicantId) {
    const applicantRefund = Number(dateOrder.applicant_charge || 0)
    if (applicantRefund > 0) {
      const { data: applicantWallet } = await admin.from('users').select('wallet_balance, wallet_escrow').eq('id', applicantId).single()
      if (applicantWallet) {
        const applicantBalance = Number(applicantWallet.wallet_balance || 0)
        const applicantEscrow = Number(applicantWallet.wallet_escrow || 0)

        await admin.from('users').update({
          wallet_balance: applicantBalance + applicantRefund,
          wallet_escrow: Math.max(0, applicantEscrow - applicantRefund),
        }).eq('id', applicantId)

        // Log refund transaction
        await admin.from('transactions').insert({
          user_id: applicantId,
          type: 'refund',
          amount: applicantRefund,
          status: 'completed',
          description: `Hoan tien do nguoi tao huy date order`,
          related_id: dateOrderId,
          payment_method: 'wallet',
          created_at: new Date().toISOString(),
        })
      }
    }
  }

  // 7. Update date_order status
  await admin.from('date_orders').update({
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancel_reason: reason || null,
    updated_at: new Date().toISOString(),
  }).eq('id', dateOrderId)

  // Cancel table_booking if exists
  await admin.from('table_bookings').update({
    status: 'cancelled',
  }).eq('date_order_id', dateOrderId)

  // 8. Notify applicant (if matched)
  if (applicantId) {
    await admin.from('notifications').insert({
      user_id: applicantId,
      type: 'date_cancelled',
      title: 'Date da bi huy',
      message: 'Nguoi tao da huy date. Tien da duoc hoan ve vi cua ban.',
      data: { dateOrderId },
      is_read: false,
    })
  }

  return new Response(JSON.stringify({ success: true, message: 'Date order cancelled. Refunds processed.' }), {
    status: 200, 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
