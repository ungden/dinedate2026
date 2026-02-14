// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import {
  checkRateLimitDb,
  getClientIP,
  createRateLimitResponse,
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

/**
 * Complete Date Order
 *
 * Called when a date is completed (manually or auto-complete).
 * - Release escrow: pay the restaurant (combo price - commission)
 * - Keep platform fees
 * - Update date_order status to 'completed'
 * - Increment both users' total_dates counter
 * - Send review request notification to both users
 */

// Restaurant commission rate (platform keeps this from combo price)
const RESTAURANT_COMMISSION_RATE = 0.15

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

  // Rate limit check
  const clientIP = getClientIP(req);
  const rateLimitId = `${clientIP}:${token.substring(0, 16)}`;
  const rateLimitResult = await checkRateLimitDb(admin, rateLimitId, 'booking');

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  // Verify user
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  
  const callerId = userData.user.id

  // 2. Parse body
  const { dateOrderId } = await req.json()
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
  const isApplicant = dateOrder.matched_user_id === callerId;

  if (!isCreator && !isApplicant) {
    return new Response(JSON.stringify({ error: 'Permission denied' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Already completed
  if (dateOrder.status === 'completed') {
    return new Response(JSON.stringify({ message: 'Already completed' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Must be in 'matched' status to complete
  if (dateOrder.status !== 'matched') {
    return new Response(JSON.stringify({ error: 'Invalid state transition. Status must be matched.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const creatorId = dateOrder.creator_id
  const applicantId = dateOrder.matched_user_id
  const comboPrice = Number(dateOrder.combo_price || 0)
  const creatorCharge = Number(dateOrder.creator_charge || 0)
  const applicantCharge = Number(dateOrder.applicant_charge || 0)
  const restaurantPayout = Number(dateOrder.restaurant_payout || Math.round(comboPrice * (1 - RESTAURANT_COMMISSION_RATE)))

  // 4. Release escrow - deduct from both users' escrow
  const { data: creatorWallet } = await admin.from('users').select('wallet_escrow, total_dates').eq('id', creatorId).single()
  const { data: applicantWallet } = await admin.from('users').select('wallet_escrow, total_dates').eq('id', applicantId).single()

  const creatorEscrow = Number(creatorWallet?.wallet_escrow || 0)
  const applicantEscrow = Number(applicantWallet?.wallet_escrow || 0)
  const creatorDates = Number(creatorWallet?.total_dates || 0)
  const applicantDates = Number(applicantWallet?.total_dates || 0)

  // Deduct escrow and increment total_dates for creator
  await admin.from('users').update({
    wallet_escrow: Math.max(0, creatorEscrow - creatorCharge),
    total_dates: creatorDates + 1,
  }).eq('id', creatorId)

  // Deduct escrow and increment total_dates for applicant
  await admin.from('users').update({
    wallet_escrow: Math.max(0, applicantEscrow - applicantCharge),
    total_dates: applicantDates + 1,
  }).eq('id', applicantId)

  // 5. Pay restaurant (add to restaurant's wallet/payout - stored in restaurant record)
  if (dateOrder.restaurant_id) {
    const { data: restaurant } = await admin
      .from('restaurants')
      .select('id, pending_payout')
      .eq('id', dateOrder.restaurant_id)
      .single()

    if (restaurant) {
      const currentPayout = Number(restaurant.pending_payout || 0)
      await admin.from('restaurants').update({
        pending_payout: currentPayout + restaurantPayout,
      }).eq('id', dateOrder.restaurant_id)
    }
  }

  // 6. Update date_order status
  await admin.from('date_orders').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', dateOrderId)

  // Update table_booking status
  await admin.from('table_bookings').update({
    status: 'completed',
  }).eq('date_order_id', dateOrderId)

  // 7. Log transactions
  await admin.from('transactions').insert([
    {
      user_id: creatorId,
      type: 'date_payment',
      amount: creatorCharge,
      status: 'completed',
      description: `Thanh toan date hoan tat`,
      related_id: dateOrderId,
      payment_method: 'escrow',
    },
    {
      user_id: applicantId,
      type: 'date_payment',
      amount: applicantCharge,
      status: 'completed',
      description: `Thanh toan date hoan tat`,
      related_id: dateOrderId,
      payment_method: 'escrow',
    },
  ])

  // 8. Send review request notifications to both users
  await admin.from('notifications').insert([
    {
      user_id: creatorId,
      type: 'review_request',
      title: 'Date da hoan tat!',
      message: 'Hay danh gia trai nghiem cua ban de giup cong dong tot hon.',
      data: { dateOrderId, reviewTarget: applicantId },
      is_read: false,
    },
    {
      user_id: applicantId,
      type: 'review_request',
      title: 'Date da hoan tat!',
      message: 'Hay danh gia trai nghiem cua ban de giup cong dong tot hon.',
      data: { dateOrderId, reviewTarget: creatorId },
      is_read: false,
    },
  ])

  // 9. Process referral reward on first completed date for each user
  await processReferralRewardIfFirst(admin, creatorId, dateOrderId)
  await processReferralRewardIfFirst(admin, applicantId, dateOrderId)

  return new Response(JSON.stringify({ success: true, status: 'completed', message: 'Date completed, escrow released' }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})

/**
 * Process referral reward if this is the user's first completed date
 */
async function processReferralRewardIfFirst(admin: any, userId: string, dateOrderId: string) {
  const REFERRER_REWARD = 50000
  const REFERRED_REWARD = 30000

  // Count completed dates for this user (as creator or applicant)
  const { count: creatorCount } = await admin
    .from('date_orders')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', userId)
    .eq('status', 'completed')

  const { count: applicantCount } = await admin
    .from('date_orders')
    .select('*', { count: 'exact', head: true })
    .eq('matched_user_id', userId)
    .eq('status', 'completed')

  const totalCompleted = (creatorCount || 0) + (applicantCount || 0)

  // Only process on first completed date
  if (totalCompleted !== 1) return

  // Check if user was referred
  const { data: userInfo } = await admin
    .from('users')
    .select('referred_by, name')
    .eq('id', userId)
    .single()

  if (!userInfo?.referred_by) return

  const referrerId = userInfo.referred_by

  // Check if reward already processed
  const { data: existingReward } = await admin
    .from('referral_rewards')
    .select('*')
    .eq('referrer_id', referrerId)
    .eq('referred_id', userId)
    .single()

  if (existingReward && existingReward.status === 'completed') return

  // Get current balances
  const { data: referrerWallet } = await admin
    .from('users')
    .select('wallet_balance')
    .eq('id', referrerId)
    .single()

  const { data: userWallet } = await admin
    .from('users')
    .select('wallet_balance')
    .eq('id', userId)
    .single()

  const referrerBalance = Number(referrerWallet?.wallet_balance || 0)
  const userBalance = Number(userWallet?.wallet_balance || 0)

  // Add rewards
  await admin.from('users').update({
    wallet_balance: referrerBalance + REFERRER_REWARD
  }).eq('id', referrerId)

  await admin.from('users').update({
    wallet_balance: userBalance + REFERRED_REWARD
  }).eq('id', userId)

  // Update or create reward record
  if (existingReward) {
    await admin.from('referral_rewards').update({
      status: 'completed',
      completed_at: new Date().toISOString()
    }).eq('id', existingReward.id)
  } else {
    await admin.from('referral_rewards').insert({
      referrer_id: referrerId,
      referred_id: userId,
      referrer_reward: REFERRER_REWARD,
      referred_reward: REFERRED_REWARD,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
  }

  // Create transactions
  const rewardId = existingReward?.id || null
  await admin.from('transactions').insert([
    {
      user_id: referrerId,
      type: 'referral_bonus',
      amount: REFERRER_REWARD,
      status: 'completed',
      description: `Thuong gioi thieu: ${userInfo.name || 'Thanh vien moi'}`,
      related_id: rewardId,
    },
    {
      user_id: userId,
      type: 'referral_bonus',
      amount: REFERRED_REWARD,
      status: 'completed',
      description: 'Thuong dang ky qua gioi thieu',
      related_id: rewardId,
    },
  ])

  // Create notifications
  await admin.from('notifications').insert([
    {
      user_id: referrerId,
      type: 'system',
      title: 'Thuong gioi thieu!',
      message: `Ban nhan duoc ${REFERRER_REWARD.toLocaleString()}d vi ${userInfo.name || 'ban be'} da hoan thanh date dau tien!`,
      is_read: false,
    },
    {
      user_id: userId,
      type: 'system',
      title: 'Thuong dang ky!',
      message: `Ban nhan duoc ${REFERRED_REWARD.toLocaleString()}d tu chuong trinh gioi thieu. Cam on ban da tham gia DineDate!`,
      is_read: false,
    },
  ])

  console.log(`[Referral] Processed reward for referrer: ${referrerId}, referred: ${userId}`)
}
