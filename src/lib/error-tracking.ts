/**
 * Simple Error Tracking System for DineDate
 * Logs errors to console and Supabase for monitoring
 */

import { supabase } from '@/integrations/supabase/client';

// Types
export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  extra?: Record<string, any>;
}

export interface Breadcrumb {
  category: string;
  message: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface UserContext {
  id: string;
  email?: string;
  name?: string;
}

// Internal state
let currentUser: UserContext | null = null;
let breadcrumbs: Breadcrumb[] = [];
let sessionId: string | null = null;

// Generate or retrieve session ID
function getSessionId(): string {
  if (sessionId) return sessionId;

  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('error_tracking_session_id');
    if (stored) {
      sessionId = stored;
      return sessionId;
    }
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('error_tracking_session_id', sessionId);
    return sessionId;
  }

  sessionId = `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return sessionId;
}

// Get browser/device info
function getDeviceInfo(): { userAgent: string; url: string } {
  if (typeof window !== 'undefined') {
    return {
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }
  return {
    userAgent: 'server',
    url: '',
  };
}

// Format stack trace
function formatStackTrace(error: Error): string {
  if (error.stack) {
    return error.stack;
  }
  return `${error.name}: ${error.message}`;
}

// Log to Supabase
async function logToSupabase(
  errorType: string,
  message: string,
  stackTrace: string | null,
  severity: ErrorSeverity,
  metadata: Record<string, any>
): Promise<void> {
  try {
    const deviceInfo = getDeviceInfo();

    const { error } = await supabase.from('error_logs').insert({
      error_type: errorType,
      message: message.substring(0, 2000), // Limit message length
      stack_trace: stackTrace?.substring(0, 5000) || null, // Limit stack trace length
      user_id: currentUser?.id || null,
      session_id: getSessionId(),
      url: deviceInfo.url.substring(0, 500),
      user_agent: deviceInfo.userAgent.substring(0, 500),
      metadata: {
        ...metadata,
        breadcrumbs: breadcrumbs.slice(-10), // Last 10 breadcrumbs
        user_context: currentUser,
      },
      severity,
    });

    if (error) {
      // Silent fail - don't throw errors from error tracking
      console.warn('[ErrorTracking] Failed to log to Supabase:', error.message);
    }
  } catch (err) {
    // Silent fail
    console.warn('[ErrorTracking] Failed to log to Supabase:', err);
  }
}

/**
 * Capture and log an exception
 */
export async function captureException(
  error: unknown,
  context?: ErrorContext
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));

  // Always log to console
  console.error('[ErrorTracking] Exception:', err, context);

  const errorType = err.name || 'Error';
  const message = err.message || 'Unknown error';
  const stackTrace = formatStackTrace(err);

  await logToSupabase(errorType, message, stackTrace, 'error', {
    component: context?.component,
    action: context?.action,
    extra: context?.extra,
  });
}

/**
 * Capture and log a message
 */
export async function captureMessage(
  message: string,
  level: ErrorSeverity = 'info'
): Promise<void> {
  console.log(`[ErrorTracking] ${level.toUpperCase()}: ${message}`);

  await logToSupabase('Message', message, null, level, {});
}

/**
 * Set the current user context
 */
export function setUser(user: UserContext | null): void {
  currentUser = user;

  if (user) {
    addBreadcrumb('auth', `User set: ${user.id}`);
  } else {
    addBreadcrumb('auth', 'User cleared');
  }
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>
): void {
  const crumb: Breadcrumb = {
    category,
    message,
    timestamp: new Date().toISOString(),
    data,
  };

  breadcrumbs.push(crumb);

  // Keep only last 50 breadcrumbs
  if (breadcrumbs.length > 50) {
    breadcrumbs = breadcrumbs.slice(-50);
  }
}

/**
 * Clear all breadcrumbs
 */
export function clearBreadcrumbs(): void {
  breadcrumbs = [];
}

/**
 * Get current breadcrumbs (for debugging)
 */
export function getBreadcrumbs(): Breadcrumb[] {
  return [...breadcrumbs];
}

/**
 * Wrap an async function with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Omit<ErrorContext, 'extra'>
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      await captureException(error, {
        ...context,
        extra: { args },
      });
      throw error;
    }
  }) as T;
}

/**
 * Track a specific action
 */
export function trackAction(category: string, action: string, data?: Record<string, any>): void {
  addBreadcrumb(category, action, data);
}

// Initialize global error handlers
export function initializeErrorTracking(): void {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    captureException(event.reason, {
      component: 'window',
      action: 'unhandledrejection',
    });
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    // Ignore ResizeObserver errors (common and usually harmless)
    if (event.message?.includes('ResizeObserver')) return;

    captureException(event.error || new Error(event.message), {
      component: 'window',
      action: 'error',
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Track console errors
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Call original first
    originalConsoleError.apply(console, args);

    // Log to tracking (but avoid recursion)
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    // Don't track our own logs
    if (!message.includes('[ErrorTracking]')) {
      addBreadcrumb('console', 'error', { message: message.substring(0, 500) });
    }
  };

  // Track page navigation
  addBreadcrumb('navigation', `Page loaded: ${window.location.pathname}`);

  // Track fetch errors
  const originalFetch = window.fetch;
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';

    try {
      const response = await originalFetch(...args);

      // Track failed HTTP responses
      if (!response.ok) {
        addBreadcrumb('http', `HTTP ${response.status}: ${url}`, {
          status: response.status,
          statusText: response.statusText,
        });

        // Log 5xx errors as exceptions
        if (response.status >= 500) {
          await captureMessage(
            `Server error ${response.status} on ${url}`,
            'error'
          );
        }
      }

      return response;
    } catch (error) {
      addBreadcrumb('http', `Network error: ${url}`, { error: String(error) });

      await captureException(error, {
        component: 'fetch',
        action: url.substring(0, 200),
      });

      throw error;
    }
  };

  console.log('[ErrorTracking] Initialized');
}
