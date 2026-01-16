// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import {
  checkRateLimitDb,
  getClientIP,
  createRateLimitResponse,
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

const MAX_VERIFY_ATTEMPTS = 5;

// Normalize phone number to standard format (0xxxxxxxxx)
function normalizePhone(phone: string): string {
  let normalized = phone.replace(/\D/g, '');

  // Convert 84xxxxxxxxx to 0xxxxxxxxx
  if (normalized.startsWith('84') && normalized.length === 11) {
    normalized = '0' + normalized.slice(2);
  }

  return normalized;
}

type VerifyOtpBody = {
  phone: string;
  otpCode: string;
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ success: false, message: 'Unauthorized', verified: false }),
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

  // Rate limit check for auth endpoints (strict: 5 per minute)
  const clientIP = getClientIP(req);
  const rateLimitId = `${clientIP}:${token.substring(0, 16)}`;
  const rateLimitResult = await checkRateLimitDb(supabaseAdmin, rateLimitId, 'auth');

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

  // Verify user
  const { data: userData, error: userErr } = await supabaseUserClient.auth.getUser();
  if (userErr || !userData?.user?.id) {
    return new Response(
      JSON.stringify({ success: false, message: 'Unauthorized', verified: false }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const userId = userData.user.id;

  // Parse request body
  let body: VerifyOtpBody;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid request body', verified: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!body?.phone || !body?.otpCode) {
    return new Response(
      JSON.stringify({ success: false, message: 'Phone and OTP code are required', verified: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const phone = normalizePhone(body.phone);
  const otpCode = body.otpCode.replace(/\D/g, '');

  if (otpCode.length !== 6) {
    return new Response(
      JSON.stringify({ success: false, message: 'OTP must be 6 digits', verified: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Find the OTP record
  const { data: otpRecord, error: otpErr } = await supabaseAdmin
    .from('phone_verifications')
    .select('*')
    .eq('user_id', userId)
    .eq('phone', phone)
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (otpErr || !otpRecord) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'No OTP request found. Please request a new OTP.',
        verified: false
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if OTP is expired
  const now = new Date();
  const expiresAt = new Date(otpRecord.expires_at);

  if (now > expiresAt) {
    // Delete expired OTP
    await supabaseAdmin
      .from('phone_verifications')
      .delete()
      .eq('id', otpRecord.id);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'OTP has expired. Please request a new one.',
        verified: false
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check max attempts
  if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
    // Delete the OTP record after too many attempts
    await supabaseAdmin
      .from('phone_verifications')
      .delete()
      .eq('id', otpRecord.id);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.',
        verified: false
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify OTP
  if (otpRecord.otp_code !== otpCode) {
    // Increment attempts
    await supabaseAdmin
      .from('phone_verifications')
      .update({ attempts: otpRecord.attempts + 1 })
      .eq('id', otpRecord.id);

    const remainingAttempts = MAX_VERIFY_ATTEMPTS - otpRecord.attempts - 1;

    return new Response(
      JSON.stringify({
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
        verified: false
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // OTP is valid - Update verification record
  const { error: updateVerificationErr } = await supabaseAdmin
    .from('phone_verifications')
    .update({ verified: true })
    .eq('id', otpRecord.id);

  if (updateVerificationErr) {
    console.error('Failed to update verification record:', updateVerificationErr);
  }

  // Update user's phone and phone_verified status
  const { error: updateUserErr } = await supabaseAdmin
    .from('users')
    .update({
      phone,
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateUserErr) {
    console.error('Failed to update user phone:', updateUserErr);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to update phone verification status',
        verified: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Clean up: Delete the used OTP record
  await supabaseAdmin
    .from('phone_verifications')
    .delete()
    .eq('id', otpRecord.id);

  console.log(`[OTP] Verified successfully - User: ${userId}, Phone: ${phone}`);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Phone verified successfully',
      verified: true
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
