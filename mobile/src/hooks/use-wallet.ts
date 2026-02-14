import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface WalletTransaction {
  id: string;
  type: 'topup' | 'payment' | 'escrow' | 'refund' | 'withdraw';
  amount: number;
  description: string;
  createdAt: string;
}

export function useWallet(userId?: string) {
  const [balance, setBalance] = useState(0);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Fetch user wallet balances
      const { data, error } = await supabase
        .from('users')
        .select('wallet_balance, wallet_escrow')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setBalance(Number(data.wallet_balance || 0));
        setEscrowBalance(Number(data.wallet_escrow || 0));
      } else {
        console.warn('[useWallet] Lỗi tải số dư:', error?.message);
      }

      // Fetch transactions from wallet_transactions table
      const { data: txData, error: txError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!txError && txData) {
        setTransactions(txData.map((t: any) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          createdAt: t.created_at,
        })));
      } else {
        // Table may not exist yet — show empty, not mock
        console.warn('[useWallet] Lỗi tải giao dịch:', txError?.message);
        setTransactions([]);
      }
    } catch (err) {
      console.warn('[useWallet] Lỗi:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { balance, escrowBalance, transactions, loading, reload: fetch };
}
