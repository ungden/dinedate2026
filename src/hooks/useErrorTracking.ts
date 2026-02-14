'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  trackAction,
  initializeErrorTracking,
  ErrorSeverity,
  ErrorContext,
} from '@/lib/error-tracking';

/**
 * Hook to easily access error tracking functionality in components
 */
export function useErrorTracking(componentName?: string) {
  const { user } = useAuth();
  const initialized = useRef(false);

  // Set user context when user changes
  useEffect(() => {
    if (user) {
      setUser({
        id: user.id,
        email: user.email || undefined,
        name: (user as any).user_metadata?.name || (user as any).user_metadata?.full_name,
      });
    } else {
      setUser(null);
    }
  }, [user]);

  // Initialize error tracking on mount (only once)
  useEffect(() => {
    if (!initialized.current) {
      initializeErrorTracking();
      initialized.current = true;
    }
  }, []);

  // Track page view when component name is provided
  useEffect(() => {
    if (componentName) {
      addBreadcrumb('navigation', `Viewed ${componentName}`);
    }
  }, [componentName]);

  /**
   * Capture an exception with component context
   */
  const captureError = useCallback(
    async (error: unknown, context?: Omit<ErrorContext, 'component'>) => {
      await captureException(error, {
        ...context,
        component: componentName || (context as any)?.component,
      });
    },
    [componentName]
  );

  /**
   * Capture a message
   */
  const logMessage = useCallback(
    async (message: string, level: ErrorSeverity = 'info') => {
      await captureMessage(message, level);
    },
    []
  );

  /**
   * Track a user action
   */
  const track = useCallback(
    (action: string, data?: Record<string, any>) => {
      trackAction(componentName || 'unknown', action, data);
    },
    [componentName]
  );

  /**
   * Add a breadcrumb
   */
  const breadcrumb = useCallback(
    (category: string, message: string, data?: Record<string, any>) => {
      addBreadcrumb(category, message, data);
    },
    []
  );

  /**
   * Wrap an async function with automatic error tracking
   */
  const wrapAsync = useCallback(
    <T extends (...args: any[]) => Promise<any>>(
      fn: T,
      actionName: string
    ): T => {
      return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        track(actionName, { status: 'started' });

        try {
          const result = await fn(...args);
          track(actionName, { status: 'completed' });
          return result;
        } catch (error) {
          track(actionName, { status: 'failed', error: String(error) });
          await captureError(error, { action: actionName });
          throw error instanceof Error ? error : new Error(String(error));
        }
      }) as T;
    },
    [track, captureError]
  );

  /**
   * Execute an async operation with error handling
   * Returns [result, error] tuple
   */
  const safeAsync = useCallback(
    async <T>(
      fn: () => Promise<T>,
      actionName: string
    ): Promise<[T | null, Error | null]> => {
      track(actionName, { status: 'started' });

      try {
        const result = await fn();
        track(actionName, { status: 'completed' });
        return [result, null];
      } catch (error) {
        track(actionName, { status: 'failed', error: String(error) });
        await captureError(error, { action: actionName });
        return [null, error instanceof Error ? error : new Error(String(error))];
      }
    },
    [track, captureError]
  );

  /**
   * Track a button click
   */
  const trackClick = useCallback(
    (buttonName: string, data?: Record<string, any>) => {
      addBreadcrumb('ui', `Clicked: ${buttonName}`, data);
    },
    []
  );

  /**
   * Track a form submission
   */
  const trackFormSubmit = useCallback(
    (formName: string, data?: Record<string, any>) => {
      addBreadcrumb('form', `Submitted: ${formName}`, data);
    },
    []
  );

  /**
   * Track an API call
   */
  const trackApiCall = useCallback(
    (endpoint: string, method: string = 'GET', data?: Record<string, any>) => {
      addBreadcrumb('api', `${method} ${endpoint}`, data);
    },
    []
  );

  return {
    captureError,
    logMessage,
    track,
    breadcrumb,
    wrapAsync,
    safeAsync,
    trackClick,
    trackFormSubmit,
    trackApiCall,
  };
}

/**
 * Higher-order function to wrap async operations with error tracking
 * Use this outside of components
 */
export function withTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: { component: string; action: string }
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    addBreadcrumb('action', `${context.component}: ${context.action}`, { status: 'started' });

    try {
      const result = await fn(...args);
      addBreadcrumb('action', `${context.component}: ${context.action}`, { status: 'completed' });
      return result;
    } catch (error) {
      addBreadcrumb('action', `${context.component}: ${context.action}`, {
        status: 'failed',
        error: String(error),
      });
      await captureException(error, context);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }) as T;
}

/**
 * Utility to safely execute a function and capture any errors
 * Returns a tuple of [result, error]
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  context: ErrorContext
): Promise<[T | null, Error | null]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    await captureException(error, context);
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}
