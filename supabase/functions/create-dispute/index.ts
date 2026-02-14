// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import {
  checkRateLimitDb,
  getClientIP,
  createRateLimitResponse,
} from '../_shared/rate-limit.ts'

/**
 * Create Dispute Edge Function
 *
 * This function handles dispute creation for date orders:
 * 1. Validates that the date order belongs to the user (creator or applicant)
 * 2. Validates that date_order status is 'matched' or 'completed'
 * 3. Creates a dispute record
 * 4. Updates date_order status to 'disputed'
 * 5. Notifies admin and the other party
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

type CreateDisputeBody = {
  dateOrderId: string;
  reason: string;
  description: string;
  evidenceUrls?: string[];
};

const VALID_REASONS = ['no_show', 'inappropriate_behavior', 'restaurant_issue', 'wrong_order', 'other'];
const DISPUTABLE_STATUSES = ['matched', 'completed'];

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.replace('Bearer ', '');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Use service role for privileged operations
  const admin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // Rate limit check for moderation endpoints (strict: 5 per minute)
  const clientIP = getClientIP(req);
  const rateLimitId = `${clientIP}:${token.substring(0, 16)}`;
  const rateLimitResult = await checkRateLimitDb(admin, rateLimitId, 'moderation');

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // Verify user
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const userId = userData.user.id;

  // Parse body
  let body: CreateDisputeBody;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Validate required fields
  if (!body?.dateOrderId || !body?.reason || !body?.description) {
    return new Response(JSON.stringify({ error: 'Missing required fields: dateOrderId, reason, description' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Validate reason
  if (!VALID_REASONS.includes(body.reason)) {
    return new Response(JSON.stringify({ error: 'Invalid reason. Must be one of: ' + VALID_REASONS.join(', ') }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Fetch date_order
  const { data: dateOrder, error: dateOrderErr } = await admin
    .from('date_orders')
    .select('id, creator_id, matched_user_id, status, combo_price, creator_charge, applicant_charge')
    .eq('id', body.dateOrderId)
    .single();

  if (dateOrderErr || !dateOrder) {
    return new Response(JSON.stringify({ error: 'Date order not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Validate user is part of this date order (creator or applicant)
  const isCreator = dateOrder.creator_id === userId;
  const isApplicant = dateOrder.matched_user_id === userId;

  if (!isCreator && !isApplicant) {
    return new Response(JSON.stringify({ error: 'You are not authorized to file a dispute for this date order' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Validate date_order status
  if (!DISPUTABLE_STATUSES.includes(dateOrder.status)) {
    return new Response(JSON.stringify({
      error: `Cannot file dispute. Date order status must be one of: ${DISPUTABLE_STATUSES.join(', ')}. Current status: ${dateOrder.status}`
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Check for existing dispute
  const { data: existingDispute } = await admin
    .from('disputes')
    .select('id')
    .eq('date_order_id', body.dateOrderId)
    .maybeSingle();

  if (existingDispute) {
    return new Response(JSON.stringify({ error: 'A dispute already exists for this date order' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Determine the other party
  const otherUserId = isCreator ? dateOrder.matched_user_id : dateOrder.creator_id;

  // Create dispute record
  const { data: dispute, error: disputeErr } = await admin
    .from('disputes')
    .insert({
      date_order_id: body.dateOrderId,
      user_id: userId,
      reason: body.reason,
      description: body.description,
      evidence_urls: body.evidenceUrls || [],
      status: 'pending',
    })
    .select('id')
    .single();

  if (disputeErr) {
    console.error('Error creating dispute:', disputeErr);
    return new Response(JSON.stringify({ error: 'Failed to create dispute: ' + disputeErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Update date_order status to 'disputed'
  const { error: updateErr } = await admin
    .from('date_orders')
    .update({
      status: 'disputed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.dateOrderId);

  if (updateErr) {
    console.error('Error updating date order status:', updateErr);
    // Don't fail the request, dispute is created
  }

  // Get user info for notifications
  const { data: disputerInfo } = await admin
    .from('users')
    .select('name')
    .eq('id', userId)
    .single();

  // Notify the other party about the dispute
  if (otherUserId) {
    await admin.from('notifications').insert({
      user_id: otherUserId,
      type: 'dispute',
      title: 'Date bi khieu nai',
      message: `${disputerInfo?.name || 'Nguoi dung'} da khieu nai date cua ban. Vui long cho admin xem xet.`,
      data: { dateOrderId: body.dateOrderId, disputeId: dispute.id },
      is_read: false,
    });
  }

  // Create admin notification
  const { data: admins } = await admin
    .from('users')
    .select('id')
    .eq('role', 'admin');

  if (admins && admins.length > 0) {
    const adminNotifications = admins.map((a: any) => ({
      user_id: a.id,
      type: 'admin_dispute',
      title: 'Khieu nai moi can xu ly',
      message: `Nguoi dung ${disputerInfo?.name || 'Unknown'} khieu nai date order. Ly do: ${body.reason}`,
      data: { dateOrderId: body.dateOrderId, disputeId: dispute.id },
      is_read: false,
    }));

    await admin.from('notifications').insert(adminNotifications);
  }

  console.log(`[CREATE-DISPUTE] Dispute ${dispute.id} created for date order ${body.dateOrderId} by user ${userId}`);

  return new Response(JSON.stringify({
    success: true,
    disputeId: dispute.id,
    message: 'Dispute created successfully'
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
