/**
 * Rate Limit Configuration for DineDate APIs
 *
 * Each endpoint category has its own rate limit settings.
 * Uses token bucket algorithm: maxTokens is burst capacity,
 * refillRate tokens are added every refillInterval milliseconds.
 */

import type { RateLimitConfig } from './rate-limit';

// One minute in milliseconds
const ONE_MINUTE = 60 * 1000;

/**
 * Rate limit configurations by endpoint category
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  /**
   * Auth endpoints (login, register, OTP)
   * Strict limit: 5 requests per minute
   * Prevents brute force attacks
   */
  auth: {
    maxTokens: 5,
    refillRate: 5,
    refillInterval: ONE_MINUTE,
  },

  /**
   * Booking creation
   * Moderate limit: 10 requests per minute
   * Prevents spam bookings
   */
  booking: {
    maxTokens: 10,
    refillRate: 10,
    refillInterval: ONE_MINUTE,
  },

  /**
   * Message sending (chat)
   * Higher limit: 30 requests per minute
   * Allows normal conversation flow
   */
  message: {
    maxTokens: 30,
    refillRate: 30,
    refillInterval: ONE_MINUTE,
  },

  /**
   * Profile updates
   * Moderate limit: 10 requests per minute
   * Prevents excessive profile changes
   */
  profile: {
    maxTokens: 10,
    refillRate: 10,
    refillInterval: ONE_MINUTE,
  },

  /**
   * Wallet/Payment operations
   * Strict limit: 10 requests per minute
   * Protects financial operations
   */
  wallet: {
    maxTokens: 10,
    refillRate: 10,
    refillInterval: ONE_MINUTE,
  },

  /**
   * General API endpoints
   * Higher limit: 60 requests per minute
   * For read operations and misc endpoints
   */
  general: {
    maxTokens: 60,
    refillRate: 60,
    refillInterval: ONE_MINUTE,
  },

  /**
   * Report/Block user actions
   * Very strict: 5 requests per minute
   * Prevents abuse of moderation features
   */
  moderation: {
    maxTokens: 5,
    refillRate: 5,
    refillInterval: ONE_MINUTE,
  },

  /**
   * Search operations
   * Moderate limit: 30 requests per minute
   * Allows normal browsing behavior
   */
  search: {
    maxTokens: 30,
    refillRate: 30,
    refillInterval: ONE_MINUTE,
  },
};

/**
 * Map API routes to their rate limit category
 */
export function getEndpointCategory(pathname: string): string {
  // Auth endpoints
  if (
    pathname.includes('/auth') ||
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/send-otp') ||
    pathname.includes('/verify-otp')
  ) {
    return 'auth';
  }

  // Booking endpoints
  if (
    pathname.includes('/booking') ||
    pathname.includes('/create-booking') ||
    pathname.includes('/complete-booking') ||
    pathname.includes('/reject-booking')
  ) {
    return 'booking';
  }

  // Message/Chat endpoints
  if (pathname.includes('/message') || pathname.includes('/chat')) {
    return 'message';
  }

  // Profile endpoints
  if (pathname.includes('/profile') || pathname.includes('/user')) {
    return 'profile';
  }

  // Wallet/Payment endpoints
  if (
    pathname.includes('/wallet') ||
    pathname.includes('/payment') ||
    pathname.includes('/topup') ||
    pathname.includes('/withdraw') ||
    pathname.includes('/sepay')
  ) {
    return 'wallet';
  }

  // Moderation endpoints
  if (
    pathname.includes('/report') ||
    pathname.includes('/block') ||
    pathname.includes('/dispute')
  ) {
    return 'moderation';
  }

  // Search endpoints
  if (pathname.includes('/search') || pathname.includes('/discover')) {
    return 'search';
  }

  // Default to general
  return 'general';
}

/**
 * Get rate limit config for a given pathname
 */
export function getRateLimitConfig(pathname: string): RateLimitConfig {
  const category = getEndpointCategory(pathname);
  return RATE_LIMIT_CONFIGS[category] || RATE_LIMIT_CONFIGS.general;
}

/**
 * Paths that should skip rate limiting
 * (internal endpoints, health checks, static files)
 */
export const RATE_LIMIT_SKIP_PATHS = [
  '/_next',
  '/favicon',
  '/static',
  '/api/health',
  '/api/cron', // Cron jobs have their own auth
];

/**
 * Check if a path should skip rate limiting
 */
export function shouldSkipRateLimit(pathname: string): boolean {
  return RATE_LIMIT_SKIP_PATHS.some((skip) => pathname.startsWith(skip));
}
