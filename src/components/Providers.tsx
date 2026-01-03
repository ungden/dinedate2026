'use client';

import { ReactNode, useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import SyncAuthToDateStore from '@/components/SyncAuthToDateStore';
import { toError } from '@/lib/errors';

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Prevent "improper error was thrown (promise)" from masking the real message
      event.preventDefault();
      const err = toError(event.reason, 'Promise rejected');
      console.error('Unhandled promise rejection:', event.reason);
      toast.error(err.message);
    };

    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', onUnhandledRejection);
  }, []);

  return (
    <AuthProvider>
      <SyncAuthToDateStore />
      <Toaster position="top-center" />
      {children}
    </AuthProvider>
  );
}