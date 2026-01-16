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

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS_PER_HOUR = 5;

// Generate 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Validate Vietnamese phone number
function isValidVnPhone(phone: string): boolean {
  const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
  return phoneRegex.test(phone);
}

// Normalize phone number to standard format (0xxxxxxxxx)
function normalizePhone(phone: string): string {
  let normalized = phone.replace(/\D/g, '');

  // Convert 84xxxxxxxxx to 0xxxxxxxxx
  if (normalized.startsWith('84') && normalized.length === 11) {
    normalized = '0' + normalized.slice(2);
  }

  return normalized;
}

type SendOtpBody = {
  phone: string;
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ success: false, message: 'Unauthorized' }),
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
      JSON.stringify({ success: false, message: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const userId = userData.user.id;

  // Parse request body
  let body: SendOtpBody;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!body?.phone) {
    return new Response(
      JSON.stringify({ success: false, message: 'Phone number is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const phone = normalizePhone(body.phone);

  if (!isValidVnPhone(phone)) {
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid Vietnamese phone number' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if phone is already verified by another user
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('phone', phone)
    .eq('phone_verified', true)
    .neq('id', userId)
    .maybeSingle();

  if (existingUser) {
    return new Response(
      JSON.stringify({ success: false, message: 'This phone number is already verified by another account' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Rate limiting: check attempts in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count: recentAttempts } = await supabaseAdmin
    .from('phone_verifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo);

  if (recentAttempts && recentAttempts >= MAX_ATTEMPTS_PER_HOUR) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Too many OTP requests. Please try again in an hour.'
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Delete any existing OTP for this user
  await supabaseAdmin
    .from('phone_verifications')
    .delete()
    .eq('user_id', userId)
    .eq('verified', false);

  // Generate new OTP
  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // Store OTP in database
  const { error: insertErr } = await supabaseAdmin
    .from('phone_verifications')
    .insert({
      user_id: userId,
      phone,
      otp_code: otpCode,
      expires_at: expiresAt,
      verified: false,
      attempts: 0,
    });

  if (insertErr) {
    console.error('Failed to store OTP:', insertErr);
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to generate OTP' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // TODO: Integrate with real SMS provider (Twilio, AWS SNS, etc.)
  // For now, log the OTP for testing
  console.log(`[OTP] User: ${userId}, Phone: ${phone}, OTP: ${otpCode}, Expires: ${expiresAt}`);

  // In development, you might want to return the OTP for testing
  // Remove this in production!
  const isDev = Deno.env.get('ENVIRONMENT') === 'development';

  return new Response(
    JSON.stringify({
      success: true,
      message: `OTP has been sent to ${phone}`,
      expiresAt,
      ...(isDev ? { _devOtp: otpCode } : {}), // Only include in dev mode
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
