'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  initializeErrorTracking,
  setUser,
  addBreadcrumb,
} from '@/lib/error-tracking';

/**
 * ErrorTrackingProvider
 *
 * This component initializes global error tracking and sets up:
 * - Unhandled promise rejection handlers
 * - Global error handlers
 * - Console error tracking
 * - Fetch error tracking
 * - User context synchronization
 *
 * Include this component once in your app layout.
 */
export function ErrorTrackingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const initialized = useRef(false);

  // Initialize error tracking on mount
  useEffect(() => {
    if (!initialized.current) {
      initializeErrorTracking();
      initialized.current = true;

      // Add initial breadcrumb
      addBreadcrumb('app', 'Error tracking initialized');
    }
  }, []);

  // Sync user context when user changes
  useEffect(() => {
    if (user) {
      setUser({
        id: user.id,
        email: user.email || undefined,
        name: user.name,
      });
      addBreadcrumb('auth', 'User context updated', { userId: user.id });
    } else {
      setUser(null);
    }
  }, [user]);

  // Track visibility changes (useful for debugging session issues)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      addBreadcrumb('app', `Page visibility: ${document.visibilityState}`);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Track online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      addBreadcrumb('network', 'Connection restored');
    };

    const handleOffline = () => {
      addBreadcrumb('network', 'Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return <>{children}</>;
}

export default ErrorTrackingProvider;
