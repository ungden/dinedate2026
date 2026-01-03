'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Toaster position="top-center" />
      {children}
    </AuthProvider>
  );
}