'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useDbWalletBalance() {
  const { user } = useAuth();
  const userId = user?.id;

  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[useDbWalletBalance] Error fetching balance:', error);
        setBalance(0);
      } else {
        setBalance(Number(data?.wallet_balance ?? 0));
      }
    } catch (err) {
      console.error('[useDbWalletBalance] Unexpected error:', err);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setBalance(null);
      setLoading(false);
      return;
    }
    reload();
  }, [userId, reload]);

  return { balance, loading, reload };
}
