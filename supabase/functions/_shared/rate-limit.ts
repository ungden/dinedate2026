/**
 * Rate Limiting Helper for Supabase Edge Functions
 *
 * Uses database-backed rate limiting with token bucket algorithm.
 * Falls back to in-memory tracking if database is unavailable.
 */

// In-memory fallback storage
const memoryBuckets = new Map<string, { tokens: number; lastRefill: number }>();

// Rate limit configurations by endpoint type
export const RATE_LIMITS = {
  auth: { maxTokens: 5, refillRate: 5, refillIntervalSeconds: 60 },
  booking: { maxTokens: 10, refillRate: 10, refillIntervalSeconds: 60 },
  message: { maxTokens: 30, refillRate: 30, refillIntervalSeconds: 60 },
  wallet: { maxTokens: 10, refillRate: 10, refillIntervalSeconds: 60 },
  moderation: { maxTokens: 5, refillRate: 5, refillIntervalSeconds: 60 },
  general: { maxTokens: 60, refillRate: 60, refillIntervalSeconds: 60 },
};

export type RateLimitType = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

/**
 * Get client IP from request headers
 */
export function getClientIP(req: Request): string {
  // Check various headers used by proxies
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to a generic identifier
  return 'unknown-client';
}

/**
 * Check rate limit using database function
 */
export async function checkRateLimitDb(
  supabaseAdmin: any,
  identifier: string,
  endpoint: RateLimitType
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.general;

  try {
    const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_tokens: config.maxTokens,
      p_refill_rate: config.refillRate,
      p_refill_interval_seconds: config.refillIntervalSeconds,
    });

    if (error) {
      console.error('Rate limit DB error:', error);
      // Fall back to in-memory
      return checkRateLimitMemory(identifier, endpoint);
    }

    const result = data?.[0];
    return {
      allowed: result?.allowed ?? true,
      remaining: Math.max(0, Math.floor(result?.tokens_remaining ?? 0)),
      retryAfter: result?.retry_after_seconds ?? 0,
    };
  } catch (err) {
    console.error('Rate limit check failed:', err);
    return checkRateLimitMemory(identifier, endpoint);
  }
}

/**
 * Check rate limit using in-memory storage (fallback)
 */
export function checkRateLimitMemory(
  identifier: string,
  endpoint: RateLimitType
): RateLimitResult {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.general;
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();

  let bucket = memoryBuckets.get(key);

  if (!bucket) {
    bucket = { tokens: config.maxTokens, lastRefill: now };
    memoryBuckets.set(key, bucket);
  }

  // Refill tokens based on elapsed time
  const timePassed = now - bucket.lastRefill;
  const intervalMs = config.refillIntervalSeconds * 1000;
  const tokensToAdd = Math.floor(timePassed / intervalMs) * config.refillRate;

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(config.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  // Check if we have tokens
  if (bucket.tokens < 1) {
    const retryAfter = Math.ceil((intervalMs - (now - bucket.lastRefill)) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, retryAfter),
    };
  }

  // Consume a token
  bucket.tokens -= 1;

  return {
    allowed: true,
    remaining: Math.floor(bucket.tokens),
    retryAfter: 0,
  };
}

/**
 * Create rate limit response with proper headers
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Ban da gui qua nhieu yeu cau. Vui long thu lai sau.',
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(RATE_LIMITS.general.maxTokens),
        'X-RateLimit-Remaining': String(result.remaining),
        'Retry-After': String(result.retryAfter),
      },
    }
  );
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  headers: Record<string, string>,
  result: RateLimitResult,
  limitType: RateLimitType = 'general'
): Record<string, string> {
  const config = RATE_LIMITS[limitType];
  return {
    ...headers,
    'X-RateLimit-Limit': String(config.maxTokens),
    'X-RateLimit-Remaining': String(result.remaining),
  };
}

// Cleanup old in-memory buckets periodically
setInterval(() => {
  const now = Date.now();
  const ttl = 10 * 60 * 1000; // 10 minutes

  for (const [key, bucket] of memoryBuckets.entries()) {
    if (now - bucket.lastRefill > ttl) {
      memoryBuckets.delete(key);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes
