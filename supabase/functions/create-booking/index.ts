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

const BASE_PLATFORM_FEE_RATE = 0.3
const DEFAULT_SESSION_HOURS = 3;
const DEFAULT_DAY_HOURS = 8;

// VIP Discount Rates (Percentage off the fee)
// E.g. Bronze gets 5% off the 30% fee.
const VIP_DISCOUNTS = {
    free: 0,
    bronze: 0.05,
    silver: 0.10,
    gold: 0.20,
    platinum: 0.30
};

type CreateBookingBody = {
  providerId: string
  serviceId: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  location: string
  message?: string
  durationHours?: number
  promoCodeId?: string // Optional promo code ID (pre-validated)
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

  // Rate limit check - use IP + user token hash as identifier
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

  // 1.5) Fetch Provider Info to check VIP status
  const { data: providerRow } = await supabaseAdmin
    .from('users')
    .select('vip_tier')
    .eq('id', body.providerId)
    .single();
  
  const providerTier = providerRow?.vip_tier || 'free';
  const discountRate = VIP_DISCOUNTS[providerTier] || 0;
  
  // Calculate effective fee rate: 30% * (1 - discount)
  // E.g. Gold (20% off) -> 0.30 * 0.8 = 0.24 (24% fee)
  const effectiveFeeRate = BASE_PLATFORM_FEE_RATE * (1 - discountRate);

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

  // Handle promo code discount
  let promoDiscount = 0
  let promoCodeData = null

  if (body.promoCodeId) {
    // Fetch and validate promo code
    const { data: promoCode, error: promoErr } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('id', body.promoCodeId)
      .single()

    if (!promoErr && promoCode && promoCode.is_active) {
      // Verify the promo code is still valid
      const now = new Date()
      const validFrom = promoCode.valid_from ? new Date(promoCode.valid_from) : null
      const validUntil = promoCode.valid_until ? new Date(promoCode.valid_until) : null

      const isDateValid = (!validFrom || validFrom <= now) && (!validUntil || validUntil >= now)
      const isUsageLimitValid = promoCode.usage_limit === 0 || promoCode.used_count < promoCode.usage_limit
      const isMinOrderValid = promoCode.min_order_amount === 0 || subTotal >= promoCode.min_order_amount

      // Check per-user limit
      let userUsageValid = true
      if (promoCode.user_limit > 0) {
        const { count } = await supabaseAdmin
          .from('promo_code_usages')
          .select('*', { count: 'exact', head: true })
          .eq('promo_code_id', promoCode.id)
          .eq('user_id', userId)

        if (count !== null && count >= promoCode.user_limit) {
          userUsageValid = false
        }
      }

      // Check first_booking_only
      let firstBookingValid = true
      if (promoCode.first_booking_only) {
        const { count: bookingCount } = await supabaseAdmin
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('status', 'in', '("rejected","auto_rejected","cancelled")')

        if (bookingCount !== null && bookingCount > 0) {
          firstBookingValid = false
        }
      }

      if (isDateValid && isUsageLimitValid && isMinOrderValid && userUsageValid && firstBookingValid) {
        promoCodeData = promoCode

        // Calculate discount
        if (promoCode.discount_type === 'percentage') {
          promoDiscount = Math.round((subTotal * promoCode.discount_value) / 100)
          if (promoCode.max_discount_amount > 0 && promoDiscount > promoCode.max_discount_amount) {
            promoDiscount = promoCode.max_discount_amount
          }
        } else {
          promoDiscount = promoCode.discount_value
        }

        // Ensure discount doesn't exceed order amount
        if (promoDiscount > subTotal) {
          promoDiscount = subTotal
        }
      }
    }
  }

  // Calculate final amounts after discount
  const discountedSubTotal = subTotal - promoDiscount

  // Apply fee logic (fee calculated on discounted amount)
  const platformFee = Math.round(discountedSubTotal * effectiveFeeRate)
  const partnerEarning = Math.round(discountedSubTotal - platformFee)
  const totalCharge = discountedSubTotal 

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
      original_amount: subTotal, // Original price before discount
      promo_code_id: promoCodeData?.id || null,
      promo_discount: promoDiscount,
      total_amount: discountedSubTotal, // Amount after discount
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

  // 6) Record promo code usage if applicable
  if (promoCodeData && promoDiscount > 0) {
    // Insert usage record
    const { error: usageErr } = await supabaseAdmin
      .from('promo_code_usages')
      .insert({
        promo_code_id: promoCodeData.id,
        user_id: userId,
        booking_id: bookingRow.id,
        discount_amount: promoDiscount,
      })

    if (usageErr) {
      console.error("Promo usage log failed", usageErr);
    }

    // Increment used_count on promo_codes
    const { error: updatePromoErr } = await supabaseAdmin
      .from('promo_codes')
      .update({
        used_count: promoCodeData.used_count + 1,
      })
      .eq('id', promoCodeData.id)

    if (updatePromoErr) {
      console.error("Promo count update failed", updatePromoErr);
    }
  }

  return new Response(JSON.stringify({ bookingId: bookingRow.id, promoDiscount }), {
    status: 200,
    headers: addRateLimitHeaders({ ...corsHeaders, 'Content-Type': 'application/json' }, rateLimitResult, 'booking'),
  })
})