'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type DbTxRow = Record<string, any>;

function toError(err: unknown, fallback = 'Đã xảy ra lỗi') {
  if (err instanceof Error) return err;
  const anyErr = err as any;
  const msg = anyErr?.message || anyErr?.error_description || anyErr?.hint || fallback;
  return new Error(String(msg));
}

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

    if (userErr) {
        console.error("Fetch wallet error:", userErr);
    } else {
        setBalance(Number(userRow?.wallet_balance || 0));
        setEscrow(Number(userRow?.wallet_escrow || 0));
    }

    const { data: txRows, error: txErr } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (txErr) console.error("Fetch tx error:", txErr);
    
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

    // Subscribe to Wallet Balance Changes
    const userChannel = supabase
      .channel(`wallet-balance-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setBalance(Number(newData.wallet_balance || 0));
          setEscrow(Number(newData.wallet_escrow || 0));
        }
      )
      .subscribe();

    // Subscribe to New Transactions
    const txChannel = supabase
      .channel(`wallet-tx-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
           table: 'wallet_transactions',
           filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newTx = payload.new as DbTxRow;
          setTransactions((prev) => [newTx, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
      supabase.removeChannel(txChannel);
    };
  }, [userId]);

  return { balance, escrow, transactions, loading, reload };
}
