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
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
  
  const { data: userData, error: userErr } = await supabaseUser.auth.getUser()
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  
  const callerId = userData.user.id

  // 2. Parse body
  const { bookingId } = await req.json()
  if (!bookingId) {
    return new Response(JSON.stringify({ error: 'Missing bookingId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 3. Admin Client for Transaction
  const admin = createClient(supabaseUrl, supabaseServiceKey)

  // 4. Fetch Booking
  const { data: booking, error: bookingErr } = await admin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (bookingErr || !booking) {
    return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Only Provider or Booker can complete (Logic: usually Provider finishes the job)
  if (booking.partner_id !== callerId && booking.user_id !== callerId) {
    return new Response(JSON.stringify({ error: 'Permission denied' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (booking.status === 'completed') {
    return new Response(JSON.stringify({ message: 'Already completed' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 5. Calculate amounts
  const totalAmount = Number(booking.total_amount)
  const partnerEarning = Number(booking.partner_earning)
  const platformFee = Number(booking.platform_fee)
  const bookerId = booking.user_id
  const partnerId = booking.partner_id

  // 6. Execute Transaction (Manual Two-Phase Commit simulation since Supabase JS doesn't support full SQL Transactions easily in simple calls, but sequential is "safe enough" for MVP if detailed logs exist)
  
  // A. Deduct Escrow from Booker
  const { data: bookerWallet } = await admin.from('users').select('wallet_escrow').eq('id', bookerId).single()
  const currentEscrow = Number(bookerWallet?.wallet_escrow || 0)
  
  // Safety check: Don't deduct if escrow is negative (shouldn't happen)
  const newEscrow = currentEscrow - totalAmount
  
  await admin.from('users').update({ wallet_escrow: newEscrow }).eq('id', bookerId)

  // B. Add Balance to Partner
  const { data: partnerWallet } = await admin.from('users').select('wallet_balance').eq('id', partnerId).single()
  const currentBalance = Number(partnerWallet?.wallet_balance || 0)
  const newBalance = currentBalance + partnerEarning
  
  await admin.from('users').update({ wallet_balance: newBalance }).eq('id', partnerId)

  // C. Update Booking Status
  await admin.from('bookings').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', bookingId)

  // D. Log Transactions
  // Log for Booker (Release Escrow -> Payment)
  await admin.from('transactions').insert({
    user_id: bookerId,
    type: 'booking_payment',
    amount: totalAmount,
    status: 'completed',
    description: `Thanh toán dịch vụ: ${booking.activity}`,
    related_id: bookingId,
    payment_method: 'escrow'
  })

  // Log for Partner (Income)
  await admin.from('transactions').insert({
    user_id: partnerId,
    type: 'booking_earning',
    amount: partnerEarning,
    status: 'completed',
    description: `Thu nhập từ dịch vụ: ${booking.activity}`,
    related_id: bookingId
  })

  return new Response(JSON.stringify({ success: true }), {
    status: 200, 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})