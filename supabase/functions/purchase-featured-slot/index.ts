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

// Pricing in VND
const PRICING: Record<number, number> = {
  1: 50000,   // 1 day
  3: 120000,  // 3 days
  7: 250000,  // 7 days
};

type SlotType = 'homepage_top' | 'search_top' | 'category_top';

type PurchaseBody = {
  slotType: SlotType;
  durationDays: number;
};

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const token = authHeader.replace('Bearer ', '');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Use service role for privileged operations
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

  // Verify user
  const { data: userData, error: userErr } = await supabaseUserClient.auth.getUser();
  if (userErr || !userData?.user?.id) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const userId = userData.user.id;

  // Parse body
  const body = (await req.json()) as PurchaseBody;

  if (!body?.slotType || !body?.durationDays) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: slotType, durationDays' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const validSlotTypes: SlotType[] = ['homepage_top', 'search_top', 'category_top'];
  if (!validSlotTypes.includes(body.slotType)) {
    return new Response(
      JSON.stringify({ error: 'Invalid slot type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const price = PRICING[body.durationDays];
  if (!price) {
    return new Response(
      JSON.stringify({ error: 'Invalid duration. Choose 1, 3, or 7 days.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Fetch user wallet
  const { data: userRow, error: userFetchErr } = await supabaseAdmin
    .from('users')
    .select('id, wallet_balance, role, is_partner_verified')
    .eq('id', userId)
    .single();

  if (userFetchErr || !userRow) {
    return new Response(
      JSON.stringify({ error: 'User not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify user is a partner
  const isPartner = userRow.role === 'partner' || userRow.is_partner_verified;
  if (!isPartner) {
    return new Response(
      JSON.stringify({ error: 'Only partners can purchase featured slots' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const walletBalance = Number(userRow.wallet_balance || 0);

  if (walletBalance < price) {
    return new Response(
      JSON.stringify({ error: 'INSUFFICIENT_FUNDS' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if user already has an active slot of the same type
  const now = new Date().toISOString();
  const { data: existingSlot } = await supabaseAdmin
    .from('featured_slots')
    .select('id, end_date')
    .eq('user_id', userId)
    .eq('slot_type', body.slotType)
    .eq('status', 'active')
    .gte('end_date', now)
    .limit(1)
    .single();

  // Calculate start and end dates
  let startDate: Date;
  if (existingSlot) {
    // Extend from current end date
    startDate = new Date(existingSlot.end_date);
  } else {
    // Start from now
    startDate = new Date();
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + body.durationDays);

  // Create or update featured slot
  if (existingSlot) {
    // Update existing slot end date (extension)
    const { error: updateErr } = await supabaseAdmin
      .from('featured_slots')
      .update({
        end_date: endDate.toISOString(),
        amount_paid: Number(existingSlot.amount_paid || 0) + price,
      })
      .eq('id', existingSlot.id);

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: 'Failed to extend featured slot: ' + updateErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } else {
    // Create new slot
    const { error: insertErr } = await supabaseAdmin
      .from('featured_slots')
      .insert({
        user_id: userId,
        slot_type: body.slotType,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        amount_paid: price,
        status: 'active',
      });

    if (insertErr) {
      return new Response(
        JSON.stringify({ error: 'Failed to create featured slot: ' + insertErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Deduct from wallet
  const newBalance = walletBalance - price;
  const { error: walletUpdateErr } = await supabaseAdmin
    .from('users')
    .update({ wallet_balance: newBalance })
    .eq('id', userId);

  if (walletUpdateErr) {
    return new Response(
      JSON.stringify({ error: 'Wallet update failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create transaction record
  const { error: txErr } = await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'featured_slot_payment',
      amount: price,
      status: 'completed',
      description: `Mua goi noi bat ${body.durationDays} ngay (${body.slotType})`,
      payment_method: 'wallet',
    });

  if (txErr) {
    // Log only, don't fail the request
    console.error('Transaction log failed:', txErr);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Featured slot purchased successfully',
      endDate: endDate.toISOString(),
      newBalance,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
