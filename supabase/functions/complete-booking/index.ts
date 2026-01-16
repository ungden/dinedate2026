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

// Spending Thresholds
const VIP_THRESHOLD = 1_000_000;
const SVIP_THRESHOLD = 100_000_000;

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

  // Rate limit check for booking endpoints (10 per minute)
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
  const { bookingId } = await req.json()
  if (!bookingId) {
    return new Response(JSON.stringify({ error: 'Missing bookingId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 3. Fetch Booking
  const { data: booking, error: bookingErr } = await admin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (bookingErr || !booking) {
    return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const isPartner = booking.partner_id === callerId;
  const isBooker = booking.user_id === callerId;

  if (!isPartner && !isBooker) {
    return new Response(JSON.stringify({ error: 'Permission denied' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // A. If already paid
  if (booking.status === 'completed') {
    return new Response(JSON.stringify({ message: 'Already completed' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // B. Partner marks as finished -> Move to 'completed_pending'
  if (isPartner && (booking.status === 'in_progress' || booking.status === 'accepted')) {
      await admin.from('bookings').update({ 
          status: 'completed_pending',
          updated_at: new Date().toISOString()
      }).eq('id', bookingId);

      return new Response(JSON.stringify({ success: true, status: 'completed_pending', message: 'Waiting for user confirmation' }), {
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
  }

  // C. User Confirms (Release Money)
  if (isBooker && (booking.status === 'completed_pending' || booking.status === 'in_progress')) {
      const totalAmount = Number(booking.total_amount)
      const partnerEarning = Number(booking.partner_earning)
      const bookerId = booking.user_id
      const partnerId = booking.partner_id

      // 6. Execute Transaction
      
      // Deduct Escrow from Booker
      const { data: bookerWallet } = await admin.from('users').select('wallet_escrow, wallet_balance, total_spending, vip_tier').eq('id', bookerId).single()
      const currentEscrow = Number(bookerWallet?.wallet_escrow || 0)
      const currentSpending = Number(bookerWallet?.total_spending || 0)
      
      const newEscrow = currentEscrow - totalAmount
      const newSpending = currentSpending + totalAmount

      // Determine New Tier
      let newTier = bookerWallet?.vip_tier || 'free';
      if (newSpending >= SVIP_THRESHOLD) newTier = 'svip';
      else if (newSpending >= VIP_THRESHOLD && newTier !== 'svip') newTier = 'vip';

      // Update Booker: Escrow, Spending, Tier
      await admin.from('users').update({ 
          wallet_escrow: newEscrow,
          total_spending: newSpending,
          vip_tier: newTier
      }).eq('id', bookerId)

      // Notify if upgraded
      if (newTier !== bookerWallet?.vip_tier) {
          await admin.from('notifications').insert({
              user_id: bookerId,
              type: 'system',
              title: `🎉 Chúc mừng! Bạn đã lên hạng ${newTier.toUpperCase()}`,
              message: `Tổng chi tiêu của bạn đã đạt mốc. Bạn đã mở khóa đặc quyền xem tuổi Partner.`,
              read: false
          });
      }

      // Add Balance to Partner
      const { data: partnerWallet } = await admin.from('users').select('wallet_balance').eq('id', partnerId).single()
      const currentBalance = Number(partnerWallet?.wallet_balance || 0)
      const newBalance = currentBalance + partnerEarning
      await admin.from('users').update({ wallet_balance: newBalance }).eq('id', partnerId)

      // Update Booking Status
      await admin.from('bookings').update({ 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          payout_status: 'paid'
      }).eq('id', bookingId)

      // Log Transactions
      await admin.from('transactions').insert({
        user_id: bookerId,
        type: 'booking_payment',
        amount: totalAmount,
        status: 'completed',
        description: `Thanh toán dịch vụ: ${booking.activity}`,
        related_id: bookingId,
        payment_method: 'escrow'
      })

      await admin.from('transactions').insert({
        user_id: partnerId,
        type: 'booking_earning',
        amount: partnerEarning,
        status: 'completed',
        description: `Thu nhập từ dịch vụ: ${booking.activity}`,
        related_id: bookingId
      })

      // === PRO PARTNER UPGRADE LOGIC ===
      const { count } = await admin
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId)
        .eq('status', 'completed');

      const completedCount = (count || 0) + 1;

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
              read: false
          });
      }

      // === REFERRAL REWARD LOGIC ===
      // Check if this is the booker's first completed booking
      const { count: bookerBookingCount } = await admin
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', bookerId)
        .eq('status', 'completed');

      const bookerCompletedCount = bookerBookingCount || 0;

      // Process referral reward on first booking completion
      if (bookerCompletedCount === 1) {
          // Check if booker was referred
          const { data: bookerData } = await admin
            .from('users')
            .select('referred_by, name')
            .eq('id', bookerId)
            .single();

          if (bookerData?.referred_by) {
              const referrerId = bookerData.referred_by;
              const REFERRER_REWARD = 50000;
              const REFERRED_REWARD = 30000;

              // Check if reward already exists and is pending
              const { data: existingReward } = await admin
                .from('referral_rewards')
                .select('*')
                .eq('referrer_id', referrerId)
                .eq('referred_id', bookerId)
                .single();

              if (existingReward && existingReward.status === 'pending') {
                  // Get current balances
                  const { data: referrerWallet } = await admin
                    .from('users')
                    .select('wallet_balance')
                    .eq('id', referrerId)
                    .single();

                  const referrerBalance = Number(referrerWallet?.wallet_balance || 0);
                  const bookerBalance = Number(bookerWallet?.wallet_balance || 0);

                  // Add rewards
                  await admin.from('users').update({
                      wallet_balance: referrerBalance + REFERRER_REWARD
                  }).eq('id', referrerId);

                  await admin.from('users').update({
                      wallet_balance: bookerBalance + REFERRED_REWARD
                  }).eq('id', bookerId);

                  // Update reward status
                  await admin.from('referral_rewards').update({
                      status: 'completed',
                      completed_at: new Date().toISOString()
                  }).eq('id', existingReward.id);

                  // Create transactions
                  await admin.from('transactions').insert([
                      {
                          user_id: referrerId,
                          type: 'referral_bonus',
                          amount: REFERRER_REWARD,
                          status: 'completed',
                          description: `Thuong gioi thieu: ${bookerData.name || 'Thanh vien moi'}`,
                          related_id: existingReward.id,
                      },
                      {
                          user_id: bookerId,
                          type: 'referral_bonus',
                          amount: REFERRED_REWARD,
                          status: 'completed',
                          description: 'Thuong dang ky qua gioi thieu',
                          related_id: existingReward.id,
                      },
                  ]);

                  // Create notifications
                  await admin.from('notifications').insert([
                      {
                          user_id: referrerId,
                          type: 'system',
                          title: 'Thuong gioi thieu!',
                          message: `Ban nhan duoc ${REFERRER_REWARD.toLocaleString()}d vi ${bookerData.name || 'ban be'} da hoan thanh booking dau tien!`,
                          read: false,
                      },
                      {
                          user_id: bookerId,
                          type: 'system',
                          title: 'Thuong dang ky!',
                          message: `Ban nhan duoc ${REFERRED_REWARD.toLocaleString()}d tu chuong trinh gioi thieu. Cam on ban da tham gia DineDate!`,
                          read: false,
                      },
                  ]);

                  console.log(`[Referral] Processed reward for referrer: ${referrerId}, referred: ${bookerId}`);
              }
          }
      }

      return new Response(JSON.stringify({ success: true, status: 'completed', message: 'Payment released' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
  }

  return new Response(JSON.stringify({ error: 'Invalid state transition' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})