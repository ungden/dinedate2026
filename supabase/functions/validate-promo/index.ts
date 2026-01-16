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

type ValidatePromoBody = {
  code: string;
  orderAmount: number;
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.replace('Bearer ', '');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // Get authenticated user
  const { data: userData, error: userErr } = await supabaseUserClient.auth.getUser();
  if (userErr || !userData?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userId = userData.user.id;

  // Parse request body
  const body = (await req.json()) as ValidatePromoBody;

  if (!body?.code) {
    return new Response(JSON.stringify({ error: 'Vui long nhap ma giam gia' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const code = body.code.trim().toUpperCase();
  const orderAmount = Number(body.orderAmount || 0);

  // 1) Fetch promo code
  const { data: promoCode, error: promoErr } = await supabaseAdmin
    .from('promo_codes')
    .select('*')
    .eq('code', code)
    .single();

  if (promoErr || !promoCode) {
    return new Response(JSON.stringify({ valid: false, error: 'Ma giam gia khong ton tai' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 2) Check if active
  if (!promoCode.is_active) {
    return new Response(JSON.stringify({ valid: false, error: 'Ma giam gia da het hieu luc' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 3) Check valid_from and valid_until
  const now = new Date();

  if (promoCode.valid_from && new Date(promoCode.valid_from) > now) {
    return new Response(JSON.stringify({ valid: false, error: 'Ma giam gia chua co hieu luc' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
    return new Response(JSON.stringify({ valid: false, error: 'Ma giam gia da het han' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 4) Check minimum order amount
  if (promoCode.min_order_amount && orderAmount < promoCode.min_order_amount) {
    return new Response(JSON.stringify({
      valid: false,
      error: `Don hang toi thieu ${formatVND(promoCode.min_order_amount)} de su dung ma nay`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 5) Check total usage limit
  if (promoCode.usage_limit > 0 && promoCode.used_count >= promoCode.usage_limit) {
    return new Response(JSON.stringify({ valid: false, error: 'Ma giam gia da het luot su dung' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 6) Check per-user usage limit
  if (promoCode.user_limit > 0) {
    const { count, error: usageErr } = await supabaseAdmin
      .from('promo_code_usages')
      .select('*', { count: 'exact', head: true })
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', userId);

    if (!usageErr && count !== null && count >= promoCode.user_limit) {
      return new Response(JSON.stringify({ valid: false, error: 'Ban da su dung ma giam gia nay roi' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // 7) Check first_booking_only condition
  if (promoCode.first_booking_only) {
    const { count: bookingCount, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('status', 'in', '("rejected","auto_rejected","cancelled")');

    if (!bookingErr && bookingCount !== null && bookingCount > 0) {
      return new Response(JSON.stringify({ valid: false, error: 'Ma nay chi danh cho nguoi dung moi (chua co booking nao)' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // 8) Calculate discount
  let discountAmount = 0;

  if (promoCode.discount_type === 'percentage') {
    discountAmount = Math.round((orderAmount * promoCode.discount_value) / 100);
    // Apply max discount cap if set
    if (promoCode.max_discount_amount && promoCode.max_discount_amount > 0 && discountAmount > promoCode.max_discount_amount) {
      discountAmount = promoCode.max_discount_amount;
    }
  } else {
    // Fixed discount
    discountAmount = promoCode.discount_value;
  }

  // Ensure discount doesn't exceed order amount
  if (discountAmount > orderAmount) {
    discountAmount = orderAmount;
  }

  const finalAmount = orderAmount - discountAmount;

  // Return valid response
  return new Response(JSON.stringify({
    valid: true,
    promoCodeId: promoCode.id,
    code: promoCode.code,
    description: promoCode.description,
    discountType: promoCode.discount_type,
    discountValue: promoCode.discount_value,
    discountAmount,
    finalAmount,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
