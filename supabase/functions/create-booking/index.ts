// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import {
  checkRateLimitDb,
  getClientIP,
  createRateLimitResponse,
  addRateLimitHeaders,
} from '../_shared/rate-limit.ts'

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

// Platform fee per person (fixed amount, e.g. 29,000 VND)
const PLATFORM_FEE_PER_PERSON = 29000
// VIP users get 50% off platform fee
const VIP_FEE_DISCOUNT = 0.5
// Restaurant commission rate (platform keeps this from combo price)
const RESTAURANT_COMMISSION_RATE = 0.15

type CreateDateOrderBody = {
  dateOrderId: string   // The date_order being matched
  applicantId: string   // The user who applied and got accepted
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const token = authHeader.replace('Bearer ', '')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Use service role for privileged operations (wallet updates)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  // Rate limit check
  const clientIP = getClientIP(req)
  const rateLimitId = `${clientIP}:${token.substring(0, 16)}`
  const rateLimitResult = await checkRateLimitDb(supabaseAdmin, rateLimitId, 'booking')

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, corsHeaders)
  }

  const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  const { data: userData, error: userErr } = await supabaseUserClient.auth.getUser()
  if (userErr || !userData?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const userId = userData.user.id

  const body = (await req.json()) as CreateDateOrderBody

  if (!body?.dateOrderId || !body?.applicantId) {
    return new Response(JSON.stringify({ error: 'Missing required fields: dateOrderId, applicantId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 1) Fetch date_order with restaurant combo info
  const { data: dateOrder, error: dateOrderErr } = await supabaseAdmin
    .from('date_orders')
    .select('id, creator_id, status, restaurant_id, combo_id, date_time, payment_split, expires_at')
    .eq('id', body.dateOrderId)
    .single()

  if (dateOrderErr || !dateOrder) {
    return new Response(JSON.stringify({ error: 'Date order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (dateOrder.status !== 'active') {
    return new Response(JSON.stringify({ error: 'Date order is not active' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Only creator can accept an applicant
  if (dateOrder.creator_id !== userId) {
    return new Response(JSON.stringify({ error: 'Only the creator can accept an applicant' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 2) Fetch combo details
  const { data: combo, error: comboErr } = await supabaseAdmin
    .from('restaurant_combos')
    .select('id, restaurant_id, name, price')
    .eq('id', dateOrder.combo_id)
    .single()

  if (comboErr || !combo) {
    return new Response(JSON.stringify({ error: 'Restaurant combo not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const comboPrice = Number(combo.price || 0)
  if (comboPrice <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid combo price' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 3) Fetch both users (creator + applicant) for VIP status & wallet
  const { data: creatorRow, error: creatorErr } = await supabaseAdmin
    .from('users')
    .select('id, wallet_balance, wallet_escrow, vip_tier, name')
    .eq('id', dateOrder.creator_id)
    .single()

  if (creatorErr || !creatorRow) {
    return new Response(JSON.stringify({ error: 'Creator not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { data: applicantRow, error: applicantErr } = await supabaseAdmin
    .from('users')
    .select('id, wallet_balance, wallet_escrow, vip_tier, name')
    .eq('id', body.applicantId)
    .single()

  if (applicantErr || !applicantRow) {
    return new Response(JSON.stringify({ error: 'Applicant not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 4) Calculate payment split
  // payment_split: '50_50' | '70_30' | '100_0' (creator pays %)
  const splitParts = (dateOrder.payment_split || '50_50').split('_').map(Number)
  const creatorShareRate = (splitParts[0] || 50) / 100
  const applicantShareRate = (splitParts[1] || 50) / 100

  const creatorComboShare = Math.round(comboPrice * creatorShareRate)
  const applicantComboShare = Math.round(comboPrice * applicantShareRate)

  // 5) Calculate platform fees with VIP discount
  const isCreatorVip = creatorRow.vip_tier && creatorRow.vip_tier !== 'free'
  const isApplicantVip = applicantRow.vip_tier && applicantRow.vip_tier !== 'free'

  const creatorPlatformFee = Math.round(PLATFORM_FEE_PER_PERSON * (isCreatorVip ? (1 - VIP_FEE_DISCOUNT) : 1))
  const applicantPlatformFee = Math.round(PLATFORM_FEE_PER_PERSON * (isApplicantVip ? (1 - VIP_FEE_DISCOUNT) : 1))

  const creatorTotal = creatorComboShare + creatorPlatformFee
  const applicantTotal = applicantComboShare + applicantPlatformFee

  // 6) Check wallet balances
  const creatorBalance = Number(creatorRow.wallet_balance || 0)
  const applicantBalance = Number(applicantRow.wallet_balance || 0)

  if (creatorBalance < creatorTotal) {
    return new Response(JSON.stringify({ error: 'CREATOR_INSUFFICIENT_FUNDS', required: creatorTotal, available: creatorBalance }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (applicantBalance < applicantTotal) {
    return new Response(JSON.stringify({ error: 'APPLICANT_INSUFFICIENT_FUNDS', required: applicantTotal, available: applicantBalance }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 7) Hold escrow for creator
  const creatorEscrow = Number(creatorRow.wallet_escrow || 0)
  const { error: creatorWalletErr } = await supabaseAdmin
    .from('users')
    .update({
      wallet_balance: creatorBalance - creatorTotal,
      wallet_escrow: creatorEscrow + creatorTotal,
    })
    .eq('id', dateOrder.creator_id)

  if (creatorWalletErr) {
    return new Response(JSON.stringify({ error: 'Failed to update creator wallet' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 8) Hold escrow for applicant
  const applicantEscrow = Number(applicantRow.wallet_escrow || 0)
  const { error: applicantWalletErr } = await supabaseAdmin
    .from('users')
    .update({
      wallet_balance: applicantBalance - applicantTotal,
      wallet_escrow: applicantEscrow + applicantTotal,
    })
    .eq('id', body.applicantId)

  if (applicantWalletErr) {
    // Rollback creator wallet
    await supabaseAdmin.from('users').update({
      wallet_balance: creatorBalance,
      wallet_escrow: creatorEscrow,
    }).eq('id', dateOrder.creator_id)

    return new Response(JSON.stringify({ error: 'Failed to update applicant wallet' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 9) Update date_order to 'matched'
  const restaurantPayout = Math.round(comboPrice * (1 - RESTAURANT_COMMISSION_RATE))
  const totalPlatformFees = creatorPlatformFee + applicantPlatformFee
  const restaurantCommission = comboPrice - restaurantPayout

  const { error: dateOrderUpdateErr } = await supabaseAdmin
    .from('date_orders')
    .update({
      status: 'matched',
      matched_user_id: body.applicantId,
      matched_at: new Date().toISOString(),
      combo_price: comboPrice,
      creator_charge: creatorTotal,
      applicant_charge: applicantTotal,
      creator_platform_fee: creatorPlatformFee,
      applicant_platform_fee: applicantPlatformFee,
      creator_combo_share: creatorComboShare,
      applicant_combo_share: applicantComboShare,
      restaurant_payout: restaurantPayout,
      platform_earning: totalPlatformFees + restaurantCommission,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.dateOrderId)

  if (dateOrderUpdateErr) {
    console.error('Failed to update date_order:', dateOrderUpdateErr)
    return new Response(JSON.stringify({ error: 'Failed to update date order' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 10) Create table_booking for the restaurant
  const { error: tableBookingErr } = await supabaseAdmin
    .from('table_bookings')
    .insert({
      date_order_id: body.dateOrderId,
      restaurant_id: dateOrder.restaurant_id,
      combo_id: dateOrder.combo_id,
      date_time: dateOrder.date_time,
      guest_count: 2,
      status: 'confirmed',
      creator_id: dateOrder.creator_id,
      applicant_id: body.applicantId,
    })

  if (tableBookingErr) {
    console.error('Failed to create table booking:', tableBookingErr)
    // Non-fatal: date order is already matched
  }

  // 11) Log escrow transactions for both users
  await supabaseAdmin.from('transactions').insert([
    {
      user_id: dateOrder.creator_id,
      type: 'escrow_hold',
      amount: creatorTotal,
      status: 'completed',
      description: `Giu tien cho date: ${combo.name}`,
      related_id: body.dateOrderId,
      payment_method: 'wallet',
    },
    {
      user_id: body.applicantId,
      type: 'escrow_hold',
      amount: applicantTotal,
      status: 'completed',
      description: `Giu tien cho date: ${combo.name}`,
      related_id: body.dateOrderId,
      payment_method: 'wallet',
    },
  ])

  // 12) Send notifications to both users
  await supabaseAdmin.from('notifications').insert([
    {
      user_id: dateOrder.creator_id,
      type: 'date_matched',
      title: 'Date da duoc ghep!',
      message: `${applicantRow.name || 'Ai do'} da chap nhan loi moi cua ban. Hen gap nhau tai nha hang!`,
      data: { dateOrderId: body.dateOrderId },
      is_read: false,
    },
    {
      user_id: body.applicantId,
      type: 'date_matched',
      title: 'Ban duoc chon!',
      message: `${creatorRow.name || 'Ai do'} da chap nhan ban. Hen gap nhau tai nha hang!`,
      data: { dateOrderId: body.dateOrderId },
      is_read: false,
    },
  ])

  return new Response(JSON.stringify({
    dateOrderId: body.dateOrderId,
    status: 'matched',
    creatorCharge: creatorTotal,
    applicantCharge: applicantTotal,
  }), {
    status: 200,
    headers: addRateLimitHeaders({ ...corsHeaders, 'Content-Type': 'application/json' }, rateLimitResult, 'booking'),
  })
})
