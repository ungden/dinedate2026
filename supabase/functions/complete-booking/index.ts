// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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
      const { data: bookerWallet } = await admin.from('users').select('wallet_escrow, total_spending, vip_tier').eq('id', bookerId).single()
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
              title: '🌟 Chúc mừng! Bạn đã lên Pro Partner',
              message: 'Bạn đã hoàn thành 5 đơn xuất sắc. Tính năng Tự đặt giá & Booking theo ngày đã được mở khóa.',
              read: false
          });
      }

      return new Response(JSON.stringify({ success: true, status: 'completed', message: 'Payment released' }), {
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
  }

  return new Response(JSON.stringify({ error: 'Invalid state transition' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})