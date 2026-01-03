// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLATFORM_FEE_RATE = 0.3

type CreateBookingBody = {
  providerId: string
  serviceId: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  location: string
  message?: string
  durationHours: number // 3 | 5 | 10
}

function toIso(date: string, time: string) {
  // interpret as local time; store as ISO
  const [y, m, d] = date.split('-').map((x) => Number(x))
  const [hh, mm] = time.split(':').map((x) => Number(x))
  const dt = new Date(y, (m - 1), d, hh, mm, 0, 0)
  return dt.toISOString()
}

serve(async (req: Request) => {
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

  // Use service role for privileged operations (wallet updates), but validate the user token manually.
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

  if (!body?.providerId || !body?.serviceId || !body?.date || !body?.time || !body?.location || !body?.durationHours) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const durationHours = Number(body.durationHours)
  if (![3, 5, 10].includes(durationHours)) {
    return new Response(JSON.stringify({ error: 'Invalid durationHours' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // 1) Fetch service
  const { data: serviceRow, error: serviceErr } = await supabaseAdmin
    .from('services')
    .select('id, user_id, activity, title, price, available')
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

  const hourlyRate = Number(serviceRow.price || 0)
  if (hourlyRate <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid service price' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const subTotal = Math.round(hourlyRate * durationHours)
  const platformFee = Math.round(subTotal * PLATFORM_FEE_RATE)
  const partnerEarning = Math.round(subTotal - platformFee)
  const totalCharge = subTotal // escrow holds subtotal; fee is internal accounting (simple MVP)

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
      hourly_rate: hourlyRate,
      total_amount: subTotal,
      platform_fee: platformFee,
      partner_earning: partnerEarning,
      status: 'pending',
    })
    .select('*')
    .single()

  if (bookingErr || !bookingRow) {
    return new Response(JSON.stringify({ error: 'Failed to create booking' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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
    return new Response(JSON.stringify({ error: 'Transaction create failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ bookingId: bookingRow.id }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})