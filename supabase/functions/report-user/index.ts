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

type ReportUserBody = {
  reportedUserId: string;
  reason: string;
  description?: string;
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.replace('Bearer ', '');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Use service role for privileged operations
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // Rate limit check for moderation endpoints (strict: 5 per minute)
  const clientIP = getClientIP(req);
  const rateLimitId = `${clientIP}:${token.substring(0, 16)}`;
  const rateLimitResult = await checkRateLimitDb(supabaseAdmin, rateLimitId, 'moderation');

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // Get current user
  const { data: userData, error: userErr } = await supabaseUserClient.auth.getUser();
  if (userErr || !userData?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const reporterId = userData.user.id;

  // Parse body
  const body = (await req.json()) as ReportUserBody;

  if (!body?.reportedUserId || !body?.reason) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Cannot report yourself
  if (reporterId === body.reportedUserId) {
    return new Response(JSON.stringify({ error: 'Cannot report yourself' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Check if reported user exists
  const { data: reportedUser, error: reportedUserErr } = await supabaseAdmin
    .from('users')
    .select('id, name')
    .eq('id', body.reportedUserId)
    .single();

  if (reportedUserErr || !reportedUser) {
    return new Response(JSON.stringify({ error: 'Reported user not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get reporter info
  const { data: reporterInfo } = await supabaseAdmin
    .from('users')
    .select('name')
    .eq('id', reporterId)
    .single();

  // Insert report
  const { data: reportRow, error: reportErr } = await supabaseAdmin
    .from('reports')
    .insert({
      reporter_id: reporterId,
      reported_user_id: body.reportedUserId,
      reason: body.reason,
      description: body.description || '',
      status: 'pending',
    })
    .select('id')
    .single();

  if (reportErr) {
    console.error('Error inserting report:', reportErr);
    return new Response(JSON.stringify({ error: 'Failed to create report: ' + reportErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Notify admin by inserting into notifications table
  // Find admin users (assuming role = 'admin' or a specific admin user ID)
  const { data: admins } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', 'admin');

  const reasonLabels: Record<string, string> = {
    'inappropriate_behavior': 'Hanh vi khong phu hop',
    'fake_photos': 'Anh gia mao',
    'scam': 'Lua dao/Scam',
    'harassment': 'Quay roi',
    'other': 'Khac',
  };

  const reasonLabel = reasonLabels[body.reason] || body.reason;

  if (admins && admins.length > 0) {
    const notifications = admins.map((admin: any) => ({
      user_id: admin.id,
      type: 'report',
      title: 'Bao cao moi',
      message: `${reporterInfo?.name || 'Nguoi dung'} da bao cao ${reportedUser.name}: ${reasonLabel}`,
      data: JSON.stringify({
        reportId: reportRow.id,
        reportedUserId: body.reportedUserId,
        reporterId: reporterId
      }),
      read: false,
    }));

    const { error: notifErr } = await supabaseAdmin
      .from('notifications')
      .insert(notifications);

    if (notifErr) {
      console.error('Error creating admin notification:', notifErr);
      // Don't fail the request, just log the error
    }
  }

  return new Response(JSON.stringify({
    success: true,
    reportId: reportRow.id
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
