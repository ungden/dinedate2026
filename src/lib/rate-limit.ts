/**
 * In-memory Rate Limiter using Token Bucket Algorithm
 *
 * Simple but effective rate limiting for Next.js API routes.
 * Tokens regenerate over time, allowing burst traffic while maintaining average rate.
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetIn: number; // seconds until bucket refills
}

// In-memory storage for rate limit buckets
// Key format: `${identifier}:${endpoint}`
const buckets = new Map<string, TokenBucket>();

// Cleanup old buckets periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
const BUCKET_TTL = 10 * 60 * 1000; // 10 minutes

let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.lastRefill > BUCKET_TTL) {
        buckets.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);

  // Don't prevent Node from exiting
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

export interface RateLimitConfig {
  // Maximum tokens in the bucket (burst capacity)
  maxTokens: number;
  // Tokens to add per interval
  refillRate: number;
  // Interval in milliseconds for refilling tokens
  refillInterval: number;
}

/**
 * Check and consume a token from the rate limit bucket
 *
 * @param identifier - Unique identifier (usually IP address or user ID)
 * @param endpoint - Endpoint category for different limits
 * @param config - Rate limit configuration
 * @returns RateLimitResult with success status and headers info
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup();

  const key = `${identifier}:${endpoint}`;
  const now = Date.now();

  // Get or create bucket
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = {
      tokens: config.maxTokens,
      lastRefill: now,
    };
    buckets.set(key, bucket);
  }

  // Calculate tokens to add based on time elapsed
  const timePassed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(timePassed / config.refillInterval) * config.refillRate;

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(config.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  // Calculate reset time
  const resetIn = bucket.tokens < 1
    ? Math.ceil((config.refillInterval - (now - bucket.lastRefill)) / 1000)
    : 0;

  // Check if we have tokens available
  if (bucket.tokens < 1) {
    return {
      success: false,
      limit: config.maxTokens,
      remaining: 0,
      resetIn: Math.max(1, resetIn),
    };
  }

  // Consume a token
  bucket.tokens -= 1;

  return {
    success: true,
    limit: config.maxTokens,
    remaining: Math.floor(bucket.tokens),
    resetIn: 0,
  };
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
  };

  if (!result.success) {
    headers['Retry-After'] = result.resetIn.toString();
  }

  return headers;
}

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header (for proxies) or falls back to a default
 */
export function getClientIdentifier(request: Request): string {
  // Try X-Forwarded-For first (for proxies like Vercel)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim();
  }

  // Try X-Real-IP
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback
  return 'unknown';
}

/**
 * Create a rate limiter for edge functions (Deno)
 * Uses same algorithm but with different storage pattern
 */
export function createEdgeRateLimiter() {
  const edgeBuckets = new Map<string, TokenBucket>();

  return {
    check(identifier: string, config: RateLimitConfig): RateLimitResult {
      const now = Date.now();
      let bucket = edgeBuckets.get(identifier);

      if (!bucket) {
        bucket = { tokens: config.maxTokens, lastRefill: now };
        edgeBuckets.set(identifier, bucket);
      }

      const timePassed = now - bucket.lastRefill;
      const tokensToAdd = Math.floor(timePassed / config.refillInterval) * config.refillRate;

      if (tokensToAdd > 0) {
        bucket.tokens = Math.min(config.maxTokens, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
      }

      const resetIn = bucket.tokens < 1
        ? Math.ceil((config.refillInterval - (now - bucket.lastRefill)) / 1000)
        : 0;

      if (bucket.tokens < 1) {
        return { success: false, limit: config.maxTokens, remaining: 0, resetIn: Math.max(1, resetIn) };
      }

      bucket.tokens -= 1;
      return { success: true, limit: config.maxTokens, remaining: Math.floor(bucket.tokens), resetIn: 0 };
    },

    // Clean up old entries (call periodically)
    cleanup() {
      const now = Date.now();
      for (const [key, bucket] of edgeBuckets.entries()) {
        if (now - bucket.lastRefill > BUCKET_TTL) {
          edgeBuckets.delete(key);
        }
      }
    }
  };
}

// Re-export types for convenience
export type { RateLimitResult };
