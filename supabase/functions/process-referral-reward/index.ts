// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

/**
 * Process Referral Reward
 *
 * Triggered on first completed date order (not booking).
 * Reward amounts: referrer 50k, referred 30k.
 */

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

// Reward amounts
const REFERRER_REWARD = 50000; // 50k VND for referrer
const REFERRED_REWARD = 30000; // 30k VND for new user

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse body
    const { referredId } = await req.json();
    if (!referredId) {
      return new Response(
        JSON.stringify({ error: 'Missing referredId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get user's referred_by
    const { data: referredUser, error: referredErr } = await admin
      .from('users')
      .select('id, referred_by, name')
      .eq('id', referredId)
      .single();

    if (referredErr || !referredUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const referrerId = referredUser.referred_by;

    if (!referrerId) {
      return new Response(
        JSON.stringify({ success: false, message: 'User was not referred' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Check if this is the user's first completed date order
    const { count: creatorCount } = await admin
      .from('date_orders')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', referredId)
      .eq('status', 'completed');

    const { count: applicantCount } = await admin
      .from('date_orders')
      .select('*', { count: 'exact', head: true })
      .eq('matched_user_id', referredId)
      .eq('status', 'completed');

    const totalCompleted = (creatorCount || 0) + (applicantCount || 0);

    if (totalCompleted < 1) {
      return new Response(
        JSON.stringify({ success: false, message: 'User has not completed any date orders yet' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Check if reward already processed
    const { data: existingReward, error: rewardErr } = await admin
      .from('referral_rewards')
      .select('*')
      .eq('referrer_id', referrerId)
      .eq('referred_id', referredId)
      .single();

    if (rewardErr && rewardErr.code !== 'PGRST116') {
      // PGRST116 = not found, which is okay
      console.error('Error checking existing reward:', rewardErr);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingReward?.status === 'completed') {
      return new Response(
        JSON.stringify({ success: false, message: 'Reward already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Get current wallet balances
    const { data: referrerData } = await admin
      .from('users')
      .select('wallet_balance, name')
      .eq('id', referrerId)
      .single();

    const { data: referredData } = await admin
      .from('users')
      .select('wallet_balance')
      .eq('id', referredId)
      .single();

    const referrerBalance = Number(referrerData?.wallet_balance || 0);
    const referredBalance = Number(referredData?.wallet_balance || 0);

    // 7. Add rewards to wallets
    await admin
      .from('users')
      .update({ wallet_balance: referrerBalance + REFERRER_REWARD })
      .eq('id', referrerId);

    await admin
      .from('users')
      .update({ wallet_balance: referredBalance + REFERRED_REWARD })
      .eq('id', referredId);

    // 8. Update or create reward record
    let rewardId = existingReward?.id;

    if (existingReward) {
      await admin
        .from('referral_rewards')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', existingReward.id);
    } else {
      const { data: newReward } = await admin
        .from('referral_rewards')
        .insert({
          referrer_id: referrerId,
          referred_id: referredId,
          referrer_reward: REFERRER_REWARD,
          referred_reward: REFERRED_REWARD,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      rewardId = newReward?.id;
    }

    // 9. Create transaction records
    await admin.from('transactions').insert([
      {
        user_id: referrerId,
        type: 'referral_bonus',
        amount: REFERRER_REWARD,
        status: 'completed',
        description: `Thuong gioi thieu: ${referredUser.name || 'Thanh vien moi'}`,
        related_id: rewardId,
      },
      {
        user_id: referredId,
        type: 'referral_bonus',
        amount: REFERRED_REWARD,
        status: 'completed',
        description: 'Thuong dang ky qua gioi thieu',
        related_id: rewardId,
      },
    ]);

    // 10. Create notifications
    await admin.from('notifications').insert([
      {
        user_id: referrerId,
        type: 'system',
        title: 'Thuong gioi thieu!',
        message: `Ban nhan duoc ${REFERRER_REWARD.toLocaleString()}d vi ${referredUser.name || 'ban be'} da hoan thanh date dau tien!`,
        is_read: false,
      },
      {
        user_id: referredId,
        type: 'system',
        title: 'Thuong dang ky!',
        message: `Ban nhan duoc ${REFERRED_REWARD.toLocaleString()}d tu chuong trinh gioi thieu. Cam on ban da tham gia DineDate!`,
        is_read: false,
      },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Referral rewards processed',
        referrer_id: referrerId,
        referred_id: referredId,
        referrer_reward: REFERRER_REWARD,
        referred_reward: REFERRED_REWARD,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing referral reward:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
