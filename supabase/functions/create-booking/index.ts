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

const PLATFORM_FEE_RATE = 0.3
const DEFAULT_SESSION_HOURS = 3;
const DEFAULT_DAY_HOURS = 8;

type CreateBookingBody = {
  providerId: string
  serviceId: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  location: string
  message?: string
  durationHours?: number
}

function toIso(date: string, time: string) {
  // interpret as local time; store as ISO
  const [y, m, d] = date.split('-').map((x) => Number(x))
  const [hh, mm] = time.split(':').map((x) => Number(x))
  const dt = new Date(y, (m - 1), d, hh, mm, 0, 0)
  return dt.toISOString()
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

  const body = (await req.json()) as CreateBookingBody

  if (!body?.providerId || !body?.serviceId || !body?.date || !body?.time || !body?.location) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 1) Fetch service
  const { data: serviceRow, error: serviceErr } = await supabaseAdmin
    .from('services')
    .select('id, user_id, activity, title, price, available, duration')
    .eq('id', body.serviceId)
    .single()

  if (serviceErr || !serviceRow) {
    return new Response(JSON.stringify({ error: 'Service not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (!serviceRow.available) {
    return new Response(JSON.stringify({ error: 'Service not available' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (serviceRow.user_id !== body.providerId) {
    return new Response(JSON.stringify({ error: 'Service does not belong to provider' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Determine duration
  let durationHours = Number(body.durationHours || 0);
  
  if (serviceRow.duration === 'day') {
      // If service is per day, default to 8 hours if not specified
      if (durationHours <= 0) durationHours = DEFAULT_DAY_HOURS;
  } else {
      // If service is per session, enforce 3 hours (or allow override if logic changes later)
      durationHours = DEFAULT_SESSION_HOURS;
  }

  // Price Calculation
  // service.price is the unit price (per session or per day)
  const unitPrice = Number(serviceRow.price || 0)
  if (unitPrice <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid service price' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // For now, 1 booking = 1 unit (1 session or 1 day). 
  // If we want to support multiple days/sessions later, we'd multiply here.
  const subTotal = Math.round(unitPrice)
  const platformFee = Math.round(subTotal * PLATFORM_FEE_RATE)
  const partnerEarning = Math.round(subTotal - platformFee)
  const totalCharge = subTotal 

  // 2) Fetch booker wallet
  const { data: bookerRow, error: bookerErr } = await supabaseAdmin
    .from('users')
    .select('id, wallet_balance, wallet_escrow')
    .eq('id', userId)
    .single()

  if (bookerErr || !bookerRow) {
    return new Response(JSON.stringify({ error: 'Booker not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const walletBalance = Number(bookerRow.wallet_balance || 0)
  const walletEscrow = Number(bookerRow.wallet_escrow || 0)

  if (walletBalance < totalCharge) {
    return new Response(JSON.stringify({ error: 'INSUFFICIENT_FUNDS' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 3) Insert booking
  const startTimeIso = toIso(body.date, body.time)

  const { data: bookingRow, error: bookingErr } = await supabaseAdmin
    .from('bookings')
    .insert({
      user_id: userId,
      partner_id: body.providerId,
      activity: serviceRow.activity,
      duration_hours: durationHours,
      start_time: startTimeIso,
      meeting_location: body.location,
      meeting_lat: null,
      meeting_lng: null,
      hourly_rate: null, 
      total_amount: subTotal,
      platform_fee: platformFee,
      partner_earning: partnerEarning,
      status: 'pending',
    })
    .select('*')
    .single()

  if (bookingErr || !bookingRow) {
    return new Response(JSON.stringify({ error: 'Failed to create booking: ' + bookingErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 4) Update wallets (hold escrow)
  const { error: walletUpdateErr } = await supabaseAdmin
    .from('users')
    .update({
      wallet_balance: walletBalance - totalCharge,
      wallet_escrow: walletEscrow + totalCharge,
    })
    .eq('id', userId)

  if (walletUpdateErr) {
    return new Response(JSON.stringify({ error: 'Wallet update failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 5) Insert transaction for booker
  const { error: txErr } = await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'escrow_hold',
      amount: totalCharge,
      status: 'completed',
      description: `Giữ tiền (escrow) cho booking: ${serviceRow.title}`,
      related_id: bookingRow.id,
      payment_method: 'wallet',
    })

  if (txErr) {
    // Log only, don't fail the request since money is already moved
    console.error("Tx log failed", txErr);
  }

  return new Response(JSON.stringify({ bookingId: bookingRow.id }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})