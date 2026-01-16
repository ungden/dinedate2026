'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FinancePeriod = 'today' | '7d' | '30d' | 'month' | 'year';

export interface OverviewMetrics {
  totalGMV: number;
  platformRevenue: number;
  totalTopups: number;
  totalWithdrawals: number;
  platformFeeRate: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  bookings: number;
}

export interface TransactionBreakdown {
  type: string;
  label: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

export interface TopPartner {
  id: string;
  name: string;
  avatar: string;
  totalBookings: number;
  totalEarnings: number;
  rating: number;
  reviewCount: number;
}

export interface TopUser {
  id: string;
  name: string;
  avatar: string;
  totalBookings: number;
  totalSpent: number;
  vipTier: string;
}

export interface PendingWithdrawal {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userEmail?: string;
  userPhone?: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  note: string;
  createdAt: string;
}

function getPeriodFilter(period: FinancePeriod): string | null {
  const now = new Date();

  switch (period) {
    case 'today':
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return today.toISOString();
    case '7d':
      const week = new Date(now);
      week.setDate(week.getDate() - 7);
      return week.toISOString();
    case '30d':
      const month30 = new Date(now);
      month30.setDate(month30.getDate() - 30);
      return month30.toISOString();
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return monthStart.toISOString();
    case 'year':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return yearStart.toISOString();
    default:
      return null;
  }
}

function getDaysInPeriod(period: FinancePeriod): number {
  switch (period) {
    case 'today': return 1;
    case '7d': return 7;
    case '30d': return 30;
    case 'month':
      const now = new Date();
      return now.getDate();
    case 'year':
      const today = new Date();
      const start = new Date(today.getFullYear(), 0, 1);
      return Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    default:
      return 30;
  }
}

export function useFinancialReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviewMetrics = useCallback(async (period: FinancePeriod): Promise<OverviewMetrics | null> => {
    try {
      const dateFilter = getPeriodFilter(period);
      const platformFeeRate = 0.15; // 15% platform fee

      // Fetch completed bookings (GMV)
      let bookingsQuery = supabase
        .from('bookings')
        .select('total_amount')
        .eq('status', 'completed');

      if (dateFilter) {
        bookingsQuery = bookingsQuery.gte('completed_at', dateFilter);
      }

      const { data: bookings, error: bookingsErr } = await bookingsQuery;
      if (bookingsErr) throw bookingsErr;

      const totalGMV = bookings?.reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0;
      const platformRevenue = Math.round(totalGMV * platformFeeRate);

      // Fetch top-ups
      let topupsQuery = supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'top_up')
        .eq('status', 'completed');

      if (dateFilter) {
        topupsQuery = topupsQuery.gte('created_at', dateFilter);
      }

      const { data: topups, error: topupsErr } = await topupsQuery;
      if (topupsErr) throw topupsErr;

      const totalTopups = topups?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

      // Fetch withdrawals
      let withdrawalsQuery = supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'withdrawal')
        .eq('status', 'completed');

      if (dateFilter) {
        withdrawalsQuery = withdrawalsQuery.gte('created_at', dateFilter);
      }

      const { data: withdrawals, error: withdrawalsErr } = await withdrawalsQuery;
      if (withdrawalsErr) throw withdrawalsErr;

      const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;

      return {
        totalGMV,
        platformRevenue,
        totalTopups,
        totalWithdrawals,
        platformFeeRate,
      };
    } catch (err: any) {
      console.error('Error fetching overview metrics:', err);
      setError(err.message);
      return null;
    }
  }, []);

  const fetchRevenueData = useCallback(async (period: FinancePeriod): Promise<DailyRevenue[]> => {
    try {
      const dateFilter = getPeriodFilter(period);
      const days = getDaysInPeriod(period);
      const platformFeeRate = 0.15;

      // Fetch completed bookings
      let query = supabase
        .from('bookings')
        .select('total_amount, completed_at')
        .eq('status', 'completed');

      if (dateFilter) {
        query = query.gte('completed_at', dateFilter);
      }

      const { data: bookings, error: bookingsErr } = await query;
      if (bookingsErr) throw bookingsErr;

      // Group by date
      const dailyMap = new Map<string, { revenue: number; bookings: number }>();

      // Initialize all days
      const maxDays = Math.min(days, 30); // Limit chart to 30 days max
      for (let i = maxDays - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyMap.set(dateStr, { revenue: 0, bookings: 0 });
      }

      // Populate with actual data
      bookings?.forEach((b) => {
        if (b.completed_at) {
          const dateStr = new Date(b.completed_at).toISOString().split('T')[0];
          const existing = dailyMap.get(dateStr);
          if (existing) {
            dailyMap.set(dateStr, {
              revenue: existing.revenue + Math.round(Number(b.total_amount || 0) * platformFeeRate),
              bookings: existing.bookings + 1,
            });
          }
        }
      });

      return Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          bookings: data.bookings,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (err: any) {
      console.error('Error fetching revenue data:', err);
      return [];
    }
  }, []);

  const fetchTransactionBreakdown = useCallback(async (period: FinancePeriod): Promise<TransactionBreakdown[]> => {
    try {
      const dateFilter = getPeriodFilter(period);

      let query = supabase
        .from('transactions')
        .select('type, amount, status')
        .eq('status', 'completed');

      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { data: transactions, error: txErr } = await query;
      if (txErr) throw txErr;

      // Group by type
      const typeMap = new Map<string, { amount: number; count: number }>();
      const types = ['top_up', 'booking_payment', 'booking_earning', 'withdrawal', 'refund', 'vip_payment'];

      types.forEach(t => typeMap.set(t, { amount: 0, count: 0 }));

      transactions?.forEach((tx) => {
        const existing = typeMap.get(tx.type) || { amount: 0, count: 0 };
        typeMap.set(tx.type, {
          amount: existing.amount + Number(tx.amount || 0),
          count: existing.count + 1,
        });
      });

      const totalAmount = Array.from(typeMap.values()).reduce((sum, v) => sum + v.amount, 0) || 1;

      const typeLabels: Record<string, string> = {
        top_up: 'Nap tien',
        booking_payment: 'Thanh toan booking',
        booking_earning: 'Thu nhap Partner',
        withdrawal: 'Rut tien',
        refund: 'Hoan tien',
        vip_payment: 'Mua VIP',
      };

      const typeColors: Record<string, string> = {
        top_up: '#22c55e',
        booking_payment: '#3b82f6',
        booking_earning: '#8b5cf6',
        withdrawal: '#ef4444',
        refund: '#f97316',
        vip_payment: '#eab308',
      };

      return Array.from(typeMap.entries())
        .filter(([_, data]) => data.count > 0)
        .map(([type, data]) => ({
          type,
          label: typeLabels[type] || type,
          amount: data.amount,
          count: data.count,
          percentage: Math.round((data.amount / totalAmount) * 100),
          color: typeColors[type] || '#6b7280',
        }))
        .sort((a, b) => b.amount - a.amount);
    } catch (err: any) {
      console.error('Error fetching transaction breakdown:', err);
      return [];
    }
  }, []);

  const fetchTopPartners = useCallback(async (period: FinancePeriod, limit: number = 10): Promise<TopPartner[]> => {
    try {
      const dateFilter = getPeriodFilter(period);

      // Get completed bookings grouped by partner
      let query = supabase
        .from('bookings')
        .select(`
          partner_id,
          total_amount,
          partner:users!bookings_partner_id_fkey(id, name, avatar)
        `)
        .eq('status', 'completed');

      if (dateFilter) {
        query = query.gte('completed_at', dateFilter);
      }

      const { data: bookings, error: bookingsErr } = await query;
      if (bookingsErr) throw bookingsErr;

      // Group by partner
      const partnerMap = new Map<string, { name: string; avatar: string; bookings: number; earnings: number }>();

      bookings?.forEach((b: any) => {
        const partnerId = b.partner_id;
        const existing = partnerMap.get(partnerId) || {
          name: b.partner?.name || 'Unknown',
          avatar: b.partner?.avatar || '/default-avatar.jpg',
          bookings: 0,
          earnings: 0,
        };
        partnerMap.set(partnerId, {
          ...existing,
          bookings: existing.bookings + 1,
          earnings: existing.earnings + Number(b.total_amount || 0),
        });
      });

      // Get ratings for top partners
      const partnerIds = Array.from(partnerMap.keys());

      const { data: reviews } = await supabase
        .from('reviews')
        .select('reviewed_id, rating')
        .in('reviewed_id', partnerIds);

      const ratingMap = new Map<string, { total: number; count: number }>();
      reviews?.forEach((r) => {
        const existing = ratingMap.get(r.reviewed_id) || { total: 0, count: 0 };
        ratingMap.set(r.reviewed_id, {
          total: existing.total + r.rating,
          count: existing.count + 1,
        });
      });

      return Array.from(partnerMap.entries())
        .map(([id, data]) => {
          const ratingData = ratingMap.get(id);
          const rating = ratingData ? Math.round((ratingData.total / ratingData.count) * 10) / 10 : 0;
          return {
            id,
            name: data.name,
            avatar: data.avatar,
            totalBookings: data.bookings,
            totalEarnings: data.earnings,
            rating,
            reviewCount: ratingData?.count || 0,
          };
        })
        .sort((a, b) => b.totalEarnings - a.totalEarnings)
        .slice(0, limit);
    } catch (err: any) {
      console.error('Error fetching top partners:', err);
      return [];
    }
  }, []);

  const fetchTopUsers = useCallback(async (period: FinancePeriod, limit: number = 10): Promise<TopUser[]> => {
    try {
      const dateFilter = getPeriodFilter(period);

      // Get completed bookings grouped by user
      let query = supabase
        .from('bookings')
        .select(`
          user_id,
          total_amount,
          booker:users!bookings_user_id_fkey(id, name, avatar, vip_tier)
        `)
        .eq('status', 'completed');

      if (dateFilter) {
        query = query.gte('completed_at', dateFilter);
      }

      const { data: bookings, error: bookingsErr } = await query;
      if (bookingsErr) throw bookingsErr;

      // Group by user
      const userMap = new Map<string, { name: string; avatar: string; vipTier: string; bookings: number; spent: number }>();

      bookings?.forEach((b: any) => {
        const userId = b.user_id;
        const existing = userMap.get(userId) || {
          name: b.booker?.name || 'Unknown',
          avatar: b.booker?.avatar || '/default-avatar.jpg',
          vipTier: b.booker?.vip_tier || 'free',
          bookings: 0,
          spent: 0,
        };
        userMap.set(userId, {
          ...existing,
          bookings: existing.bookings + 1,
          spent: existing.spent + Number(b.total_amount || 0),
        });
      });

      return Array.from(userMap.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          avatar: data.avatar,
          totalBookings: data.bookings,
          totalSpent: data.spent,
          vipTier: data.vipTier,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit);
    } catch (err: any) {
      console.error('Error fetching top users:', err);
      return [];
    }
  }, []);

  const fetchPendingWithdrawals = useCallback(async (): Promise<PendingWithdrawal[]> => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          user:users(id, name, avatar, email, phone)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user?.name || 'Unknown',
        userAvatar: row.user?.avatar || '/default-avatar.jpg',
        userEmail: row.user?.email,
        userPhone: row.user?.phone,
        amount: Number(row.amount || 0),
        bankName: row.bank_name || '',
        accountNumber: row.account_number || '',
        accountName: row.account_name || '',
        note: row.note || '',
        createdAt: row.created_at,
      }));
    } catch (err: any) {
      console.error('Error fetching pending withdrawals:', err);
      return [];
    }
  }, []);

  const approveWithdrawal = useCallback(async (withdrawal: PendingWithdrawal): Promise<boolean> => {
    try {
      // 1. Check current balance
      const { data: userRow } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', withdrawal.userId)
        .single();

      const currentBalance = Number(userRow?.wallet_balance || 0);
      if (currentBalance < withdrawal.amount) {
        throw new Error('User khong du so du de rut!');
      }

      // 2. Deduct balance
      const { error: updateWalletErr } = await supabase
        .from('users')
        .update({ wallet_balance: currentBalance - withdrawal.amount })
        .eq('id', withdrawal.userId);

      if (updateWalletErr) throw updateWalletErr;

      // 3. Create Transaction Log
      await supabase.from('transactions').insert({
        user_id: withdrawal.userId,
        type: 'withdrawal',
        amount: withdrawal.amount,
        status: 'completed',
        description: 'Rut tien ve ngan hang (Admin duyet)',
        related_id: withdrawal.id,
        payment_method: 'banking',
        completed_at: new Date().toISOString(),
      });

      // 4. Update Request Status
      const { error: updateReqErr } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', withdrawal.id);

      if (updateReqErr) throw updateReqErr;

      return true;
    } catch (err: any) {
      console.error('Error approving withdrawal:', err);
      throw err;
    }
  }, []);

  const rejectWithdrawal = useCallback(async (withdrawal: PendingWithdrawal, reason: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          note: `Tu choi: ${reason}. ${withdrawal.note || ''}`,
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', withdrawal.id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error rejecting withdrawal:', err);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    fetchOverviewMetrics,
    fetchRevenueData,
    fetchTransactionBreakdown,
    fetchTopPartners,
    fetchTopUsers,
    fetchPendingWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
  };
}

// CSV Export utilities
export function exportToCSV(data: any[], filename: string, headers: { key: string; label: string }[]) {
  const csvHeaders = headers.map(h => h.label).join(',');
  const csvRows = data.map(row =>
    headers.map(h => {
      const value = row[h.key];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',')
  );

  const csvContent = [csvHeaders, ...csvRows].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}
