'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type DbTxRow = Record<string, any>;

export function useDbWallet() {
  const { user } = useAuth();
  const userId = user?.id;

  const [balance, setBalance] = useState(0);
  const [escrow, setEscrow] = useState(0);
  const [transactions, setTransactions] = useState<DbTxRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!userId) return;

    setLoading(true);

    const { data: userRow, error: userErr } = await supabase
      .from('users')
      .select('wallet_balance, wallet_escrow')
      .eq('id', userId)
      .single();

    if (userErr) throw userErr;

    const { data: txRows, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (txErr) throw txErr;

    setBalance(Number(userRow?.wallet_balance || 0));
    setEscrow(Number(userRow?.wallet_escrow || 0));
    setTransactions(txRows || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) {
      setBalance(0);
      setEscrow(0);
      setTransactions([]);
      setLoading(false);
      return;
    }
    reload();
  }, [userId]);

  return { balance, escrow, transactions, loading, reload };
}