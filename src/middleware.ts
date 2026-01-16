import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  checkRateLimit,
  getRateLimitHeaders,
  getClientIdentifier,
} from './lib/rate-limit';
import {
  getRateLimitConfig,
  shouldSkipRateLimit,
  getEndpointCategory,
} from './lib/rate-limit-config';

/**
 * Next.js Middleware for Rate Limiting
 *
 * Applies rate limiting to API routes based on client IP and endpoint category.
 * Adds rate limit headers to all responses for client-side handling.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply rate limiting to API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Skip certain paths
  if (shouldSkipRateLimit(pathname)) {
    return NextResponse.next();
  }

  // Get client identifier (IP address)
  const clientId = getClientIdentifier(request);

  // Get rate limit config for this endpoint
  const category = getEndpointCategory(pathname);
  const config = getRateLimitConfig(pathname);

  // Check rate limit
  const result = checkRateLimit(clientId, category, config);

  // Get rate limit headers
  const rateLimitHeaders = getRateLimitHeaders(result);

  // If rate limited, return 429
  if (!result.success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
        retryAfter: result.resetIn,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...rateLimitHeaders,
        },
      }
    );
  }

  // Add rate limit headers to successful response
  const response = NextResponse.next();

  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Configure which routes this middleware should run on
 */
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
};
