'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDateStore } from '@/hooks/useDateStore';

export default function SyncAuthToDateStore() {
  const { user, isLoading } = useAuth();
  const setCurrentUserFromAuth = useDateStore((s) => s.setCurrentUserFromAuth);

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    setCurrentUserFromAuth(user);
  }, [user, isLoading, setCurrentUserFromAuth]);

  return null;
}