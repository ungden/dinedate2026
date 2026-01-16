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
 * This function handles dispute creation for bookings:
 * 1. Validates that the booking belongs to the user
 * 2. Validates that booking status is 'in_progress' or 'completed_pending'
 * 3. Creates a dispute record
 * 4. Updates booking status to 'disputed'
 * 5. Pauses auto-complete timer
 * 6. Notifies admin and partner
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
  bookingId: string;
  reason: string;
  description: string;
  evidenceUrls?: string[];
};

const VALID_REASONS = ['partner_no_show', 'poor_service', 'bad_attitude', 'other'];
const DISPUTABLE_STATUSES = ['in_progress', 'completed_pending'];

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
  if (!body?.bookingId || !body?.reason || !body?.description) {
    return new Response(JSON.stringify({ error: 'Missing required fields: bookingId, reason, description' }), {
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

  // Fetch booking
  const { data: booking, error: bookingErr } = await admin
    .from('bookings')
    .select('id, user_id, partner_id, status, activity, total_amount')
    .eq('id', body.bookingId)
    .single();

  if (bookingErr || !booking) {
    return new Response(JSON.stringify({ error: 'Booking not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Validate booking belongs to user (booker)
  if (booking.user_id !== userId) {
    return new Response(JSON.stringify({ error: 'You are not authorized to file a dispute for this booking' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Validate booking status
  if (!DISPUTABLE_STATUSES.includes(booking.status)) {
    return new Response(JSON.stringify({
      error: `Cannot file dispute. Booking status must be one of: ${DISPUTABLE_STATUSES.join(', ')}. Current status: ${booking.status}`
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Check for existing dispute
  const { data: existingDispute } = await admin
    .from('disputes')
    .select('id')
    .eq('booking_id', body.bookingId)
    .maybeSingle();

  if (existingDispute) {
    return new Response(JSON.stringify({ error: 'A dispute already exists for this booking' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Create dispute record
  const { data: dispute, error: disputeErr } = await admin
    .from('disputes')
    .insert({
      booking_id: body.bookingId,
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

  // Update booking status to 'disputed' and pause auto-complete
  const { error: updateErr } = await admin
    .from('bookings')
    .update({
      status: 'disputed',
      dispute_paused_at: new Date().toISOString(),
    })
    .eq('id', body.bookingId);

  if (updateErr) {
    console.error('Error updating booking status:', updateErr);
    // Don't fail the request, dispute is created
  }

  // Get user info for notifications
  const { data: bookerInfo } = await admin
    .from('users')
    .select('name')
    .eq('id', userId)
    .single();

  const { data: partnerInfo } = await admin
    .from('users')
    .select('name')
    .eq('id', booking.partner_id)
    .single();

  // Notify partner about the dispute
  await admin.from('notifications').insert({
    user_id: booking.partner_id,
    type: 'dispute',
    title: 'Don hang bi khieu nai',
    message: `Khach hang ${bookerInfo?.name || 'Unknown'} da khieu nai don hang "${booking.activity}". Vui long cho admin xem xet.`,
    data: { bookingId: body.bookingId, disputeId: dispute.id },
    is_read: false,
  });

  // Create admin notification (find admin users)
  const { data: admins } = await admin
    .from('users')
    .select('id')
    .eq('role', 'admin');

  if (admins && admins.length > 0) {
    const adminNotifications = admins.map((a: any) => ({
      user_id: a.id,
      type: 'admin_dispute',
      title: 'Khieu nai moi can xu ly',
      message: `Nguoi dung ${bookerInfo?.name || 'Unknown'} khieu nai don hang voi Partner ${partnerInfo?.name || 'Unknown'}. Ly do: ${body.reason}`,
      data: { bookingId: body.bookingId, disputeId: dispute.id },
      is_read: false,
    }));

    await admin.from('notifications').insert(adminNotifications);
  }

  console.log(`[CREATE-DISPUTE] Dispute ${dispute.id} created for booking ${body.bookingId} by user ${userId}`);

  return new Response(JSON.stringify({
    success: true,
    disputeId: dispute.id,
    message: 'Dispute created successfully'
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
