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

  // 4. Validate Status
  if (booking.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Booking cannot be rejected/cancelled in current status' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const refundAmount = Number(booking.total_amount || 0);
  const bookerId = booking.user_id;

  // 5. Execute Refund Logic
  
  // A. Fetch Booker Wallet
  const { data: bookerWallet } = await admin.from('users').select('wallet_balance, wallet_escrow').eq('id', bookerId).single();
  
  if (!bookerWallet) {
      return new Response(JSON.stringify({ error: 'Booker wallet not found' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const currentBalance = Number(bookerWallet.wallet_balance || 0);
  const currentEscrow = Number(bookerWallet.wallet_escrow || 0);

  // B. Return Money (Balance + Refund, Escrow - Refund)
  await admin.from('users').update({
      wallet_balance: currentBalance + refundAmount,
      wallet_escrow: Math.max(0, currentEscrow - refundAmount)
  }).eq('id', bookerId);

  // C. Update Booking Status
  const newStatus = isPartner ? 'rejected' : 'cancelled'; // If partner acts -> rejected, if user acts -> cancelled
  
  await admin.from('bookings').update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
  }).eq('id', bookingId);

  // D. Log Transaction
  await admin.from('transactions').insert({
      user_id: bookerId,
      type: 'refund',
      amount: refundAmount,
      status: 'completed',
      description: `Hoàn tiền do ${isPartner ? 'Partner từ chối' : 'hủy'} booking: ${booking.activity}`,
      related_id: bookingId,
      payment_method: 'wallet',
      created_at: new Date().toISOString()
  });

  // E. Notify User (if Partner rejected)
  if (isPartner) {
      await admin.from('notifications').insert({
          user_id: bookerId,
          type: 'booking_rejected',
          title: 'Booking bị từ chối',
          message: 'Partner không thể nhận đơn này. Tiền đã được hoàn về ví của bạn.',
          data: { bookingId },
          is_read: false
      });
  }

  return new Response(JSON.stringify({ success: true, message: 'Refunded successfully' }), {
    status: 200, 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})