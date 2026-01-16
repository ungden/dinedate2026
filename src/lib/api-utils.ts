/**
 * API Utilities with Rate Limit Handling
 *
 * Provides utilities for handling API responses including rate limit errors.
 */

import toast from 'react-hot-toast';

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  retryAfter: number;

  constructor(retryAfter: number, message?: string) {
    super(message || 'Qua nhieu yeu cau. Vui long thu lai sau.');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  if (error instanceof RateLimitError) return true;

  const anyErr = error as any;
  return (
    anyErr?.status === 429 ||
    anyErr?.code === 429 ||
    anyErr?.message?.includes('Too Many Requests') ||
    anyErr?.message?.includes('rate limit')
  );
}

/**
 * Get retry after seconds from error
 */
export function getRetryAfter(error: unknown): number {
  if (error instanceof RateLimitError) {
    return error.retryAfter;
  }

  const anyErr = error as any;
  return anyErr?.retryAfter || anyErr?.context?.body?.retryAfter || 60;
}

/**
 * Handle rate limit error with toast notification
 */
export function handleRateLimitError(error: unknown): void {
  const retryAfter = getRetryAfter(error);

  toast.error(`Qua nhieu yeu cau. Vui long thu lai sau ${retryAfter} giay.`, {
    duration: Math.min(retryAfter * 1000, 10000),
    icon: '\u23F1\uFE0F',
  });
}

/**
 * Parse API response and throw appropriate errors
 */
export async function parseApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    // Check for rate limit
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      throw new RateLimitError(retryAfter, data.message);
    }

    throw new Error(data.error || data.message || 'Yeu cau that bai');
  }

  return data as T;
}

/**
 * Fetch with rate limit handling and optional auto-retry
 */
export async function fetchWithRateLimit<T>(
  url: string,
  options?: RequestInit & { autoRetry?: boolean }
): Promise<T> {
  const { autoRetry = false, ...fetchOptions } = options || {};

  const response = await fetch(url, fetchOptions);

  // Handle rate limit
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
    const data = await response.json().catch(() => ({}));

    // Show toast
    handleRateLimitError({ retryAfter });

    // Auto-retry if enabled
    if (autoRetry && retryAfter <= 30) {
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return fetchWithRateLimit(url, { ...fetchOptions, autoRetry: false });
    }

    throw new RateLimitError(retryAfter, data.message);
  }

  return parseApiResponse<T>(response);
}

/**
 * Check if Supabase function error is rate limit error
 */
export function isSupabaseRateLimitError(error: unknown): boolean {
  const anyErr = error as any;

  // Check error message
  if (anyErr?.message?.includes('Too Many Requests')) return true;
  if (anyErr?.message?.includes('rate limit')) return true;

  // Check context body
  if (anyErr?.context?.body?.error === 'Too Many Requests') return true;
  if (anyErr?.context?.body?.retryAfter) return true;

  return false;
}

/**
 * Handle Supabase function error with rate limit check
 */
export function handleSupabaseError(error: unknown, fallbackMessage = 'Da xay ra loi'): never {
  if (isSupabaseRateLimitError(error)) {
    const anyErr = error as any;
    const retryAfter = anyErr?.context?.body?.retryAfter || 60;
    handleRateLimitError({ retryAfter });
    throw new RateLimitError(retryAfter);
  }

  const anyErr = error as any;
  const message =
    anyErr?.context?.body?.message ||
    anyErr?.message ||
    anyErr?.error_description ||
    anyErr?.error ||
    fallbackMessage;

  throw new Error(String(message));
}
