'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import SyncAuthToDateStore from '@/components/SyncAuthToDateStore';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SyncAuthToDateStore />
      <Toaster position="top-center" />
      {children}
    </AuthProvider>
  );
}