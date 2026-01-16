'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ReferralReward {
  id: string;
  referrerId: string;
  referredId: string;
  referrerReward: number;
  referredReward: number;
  status: 'pending' | 'completed' | 'cancelled';
  completedAt?: string;
  createdAt: string;
  // Joined data
  referredUser?: {
    id: string;
    name: string;
    avatar: string;
  };
}

export interface ReferralStats {
  totalReferred: number;
  totalEarned: number;
  pendingRewards: number;
  completedRewards: number;
}

export function useReferral() {
  const { user } = useAuth();
  const userId = user?.id;

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referredUsers, setReferredUsers] = useState<ReferralReward[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferred: 0,
    totalEarned: 0,
    pendingRewards: 0,
    completedRewards: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchReferralData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // 1. Fetch user's referral code
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('referral_code')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('[Referral] Error fetching referral code:', userError);
      } else {
        setReferralCode(userData?.referral_code || null);
      }

      // 2. Fetch referral rewards where user is the referrer
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('referral_rewards')
        .select(`
          id,
          referrer_id,
          referred_id,
          referrer_reward,
          referred_reward,
          status,
          completed_at,
          created_at,
          referred:users!referral_rewards_referred_id_fkey (
            id,
            name,
            avatar
          )
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (rewardsError) {
        console.error('[Referral] Error fetching rewards:', rewardsError);
      } else {
        const mappedRewards: ReferralReward[] = (rewardsData || []).map((r: any) => ({
          id: r.id,
          referrerId: r.referrer_id,
          referredId: r.referred_id,
          referrerReward: r.referrer_reward,
          referredReward: r.referred_reward,
          status: r.status,
          completedAt: r.completed_at,
          createdAt: r.created_at,
          referredUser: r.referred ? {
            id: r.referred.id,
            name: r.referred.name,
            avatar: r.referred.avatar,
          } : undefined,
        }));

        setReferredUsers(mappedRewards);

        // Calculate stats
        const completed = mappedRewards.filter(r => r.status === 'completed');
        const pending = mappedRewards.filter(r => r.status === 'pending');

        setStats({
          totalReferred: mappedRewards.length,
          totalEarned: completed.reduce((sum, r) => sum + r.referrerReward, 0),
          pendingRewards: pending.length,
          completedRewards: completed.length,
        });
      }
    } catch (error) {
      console.error('[Referral] Exception:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  // Real-time subscription for referral rewards
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`referral-rewards-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referral_rewards',
          filter: `referrer_id=eq.${userId}`,
        },
        () => {
          // Refetch data when changes occur
          fetchReferralData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchReferralData]);

  // Helper function to get referral link
  const getReferralLink = useCallback(() => {
    if (!referralCode) return '';
    return `https://dinedate.vn/ref/${referralCode}`;
  }, [referralCode]);

  // Copy referral code to clipboard
  const copyReferralCode = useCallback(async () => {
    if (!referralCode) return false;
    try {
      await navigator.clipboard.writeText(referralCode);
      return true;
    } catch (error) {
      console.error('[Referral] Failed to copy code:', error);
      return false;
    }
  }, [referralCode]);

  // Copy referral link to clipboard
  const copyReferralLink = useCallback(async () => {
    const link = getReferralLink();
    if (!link) return false;
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch (error) {
      console.error('[Referral] Failed to copy link:', error);
      return false;
    }
  }, [getReferralLink]);

  // Share using native share API
  const shareReferral = useCallback(async () => {
    const link = getReferralLink();
    if (!link) return false;

    const shareData = {
      title: 'DineDate - Gioi thieu ban be',
      text: `Tham gia DineDate cung toi! Dang ky qua link nay de nhan ngay 30.000d: ${link}`,
      url: link,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return true;
      } else {
        // Fallback to copy
        return await copyReferralLink();
      }
    } catch (error) {
      // User cancelled or error
      console.error('[Referral] Share failed:', error);
      return false;
    }
  }, [getReferralLink, copyReferralLink]);

  return {
    referralCode,
    referredUsers,
    stats,
    loading,
    reload: fetchReferralData,
    getReferralLink,
    copyReferralCode,
    copyReferralLink,
    shareReferral,
  };
}

// Hook to get referrer info from code (for landing page)
export function useReferrerByCode(code: string | null) {
  const [referrer, setReferrer] = useState<{
    id: string;
    name: string;
    avatar: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }

    const fetchReferrer = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('id, name, avatar')
          .eq('referral_code', code.toUpperCase())
          .single();

        if (fetchError) {
          console.error('[Referral] Error fetching referrer:', fetchError);
          setError('Ma gioi thieu khong hop le');
          setReferrer(null);
        } else {
          setReferrer(data);
        }
      } catch (err) {
        console.error('[Referral] Exception:', err);
        setError('Da xay ra loi');
        setReferrer(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrer();
  }, [code]);

  return { referrer, loading, error };
}

// Utility to store/get referral code from localStorage
export const REFERRAL_CODE_KEY = 'dinedate_referral_code';

export function storeReferralCode(code: string) {
  try {
    localStorage.setItem(REFERRAL_CODE_KEY, code.toUpperCase());
  } catch (error) {
    console.error('[Referral] Failed to store code:', error);
  }
}

export function getStoredReferralCode(): string | null {
  try {
    return localStorage.getItem(REFERRAL_CODE_KEY);
  } catch (error) {
    console.error('[Referral] Failed to get stored code:', error);
    return null;
  }
}

export function clearStoredReferralCode() {
  try {
    localStorage.removeItem(REFERRAL_CODE_KEY);
  } catch (error) {
    console.error('[Referral] Failed to clear code:', error);
  }
}
