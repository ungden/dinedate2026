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
  dateOrders: number;
}

export interface TransactionBreakdown {
  type: string;
  label: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

export interface TopRestaurant {
  id: string;
  name: string;
  logoUrl: string;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
}

export interface TopUser {
  id: string;
  name: string;
  avatar: string;
  totalDateOrders: number;
  totalSpent: number;
  vipTier: string;
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

      // Fetch completed date orders (GMV)
      let ordersQuery = supabase
        .from('date_orders')
        .select('combo_price, platform_fee')
        .eq('status', 'completed');

      if (dateFilter) {
        ordersQuery = ordersQuery.gte('completed_at', dateFilter);
      }

      const { data: orders, error: ordersErr } = await ordersQuery;
      if (ordersErr) throw new Error(ordersErr.message || 'Failed to fetch orders');

      const totalGMV = orders?.reduce((sum, o) => sum + Number(o.combo_price || 0), 0) || 0;
      const platformRevenue = orders?.reduce((sum, o) => sum + Number(o.platform_fee || 0), 0) || 0;

      // Fetch top-ups
      let topupsQuery = supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('type', 'topup')
        .eq('status', 'completed');

      if (dateFilter) {
        topupsQuery = topupsQuery.gte('created_at', dateFilter);
      }

      const { data: topups, error: topupsErr } = await topupsQuery;
      if (topupsErr) throw new Error(topupsErr.message || 'Failed to fetch topups');

      const totalTopups = topups?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

      // Fetch withdrawals
      let withdrawalsQuery = supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('type', 'withdraw')
        .eq('status', 'completed');

      if (dateFilter) {
        withdrawalsQuery = withdrawalsQuery.gte('created_at', dateFilter);
      }

      const { data: withdrawals, error: withdrawalsErr } = await withdrawalsQuery;
      if (withdrawalsErr) throw new Error(withdrawalsErr.message || 'Failed to fetch withdrawals');

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
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, []);

  const fetchRevenueData = useCallback(async (period: FinancePeriod): Promise<DailyRevenue[]> => {
    try {
      const dateFilter = getPeriodFilter(period);
      const days = getDaysInPeriod(period);

      // Fetch completed date orders
      let query = supabase
        .from('date_orders')
        .select('platform_fee, completed_at')
        .eq('status', 'completed');

      if (dateFilter) {
        query = query.gte('completed_at', dateFilter);
      }

      const { data: orders, error: ordersErr } = await query;
      if (ordersErr) throw new Error(ordersErr.message || 'Failed to fetch revenue data');

      // Group by date
      const dailyMap = new Map<string, { revenue: number; dateOrders: number }>();

      // Initialize all days
      const maxDays = Math.min(days, 30); // Limit chart to 30 days max
      for (let i = maxDays - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyMap.set(dateStr, { revenue: 0, dateOrders: 0 });
      }

      // Populate with actual data
      orders?.forEach((o) => {
        if (o.completed_at) {
          const dateStr = new Date(o.completed_at).toISOString().split('T')[0];
          const existing = dailyMap.get(dateStr);
          if (existing) {
            dailyMap.set(dateStr, {
              revenue: existing.revenue + Number(o.platform_fee || 0),
              dateOrders: existing.dateOrders + 1,
            });
          }
        }
      });

      return Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          dateOrders: data.dateOrders,
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
        .from('wallet_transactions')
        .select('type, amount, status')
        .eq('status', 'completed');

      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { data: transactions, error: txErr } = await query;
      if (txErr) throw new Error(txErr.message || 'Failed to fetch transactions');

      // Group by type — matches wallet_transactions.type CHECK constraint:
      // topup, payment, escrow, refund, withdraw
      const typeMap = new Map<string, { amount: number; count: number }>();
      const types = ['topup', 'payment', 'escrow', 'refund', 'withdraw'];

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
        topup: 'Nạp tiền',
        payment: 'Thanh toán đơn hẹn',
        escrow: 'Ký quỹ',
        refund: 'Hoàn tiền',
        withdraw: 'Rút tiền',
      };

      const typeColors: Record<string, string> = {
        topup: '#22c55e',
        payment: '#3b82f6',
        escrow: '#f97316',
        refund: '#ef4444',
        withdraw: '#8b5cf6',
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

  const fetchTopRestaurants = useCallback(async (period: FinancePeriod, limit: number = 10): Promise<TopRestaurant[]> => {
    try {
      const dateFilter = getPeriodFilter(period);

      // Get completed date orders grouped by restaurant
      let query = supabase
        .from('date_orders')
        .select(`
          restaurant_id,
          combo_price,
          restaurant_commission,
          restaurant:restaurants!date_orders_restaurant_id_fkey(id, name, logo_url)
        `)
        .eq('status', 'completed');

      if (dateFilter) {
        query = query.gte('completed_at', dateFilter);
      }

      const { data: orders, error: ordersErr } = await query;
      if (ordersErr) throw new Error(ordersErr.message || 'Failed to fetch top restaurants');

      // Group by restaurant
      const restaurantMap = new Map<string, { name: string; logoUrl: string; orders: number; revenue: number }>();

      orders?.forEach((o: any) => {
        const restaurantId = o.restaurant_id;
        const existing = restaurantMap.get(restaurantId) || {
          name: o.restaurant?.name || 'Unknown',
          logoUrl: o.restaurant?.logo_url || '/default-restaurant.jpg',
          orders: 0,
          revenue: 0,
        };
        restaurantMap.set(restaurantId, {
          ...existing,
          orders: existing.orders + 1,
          revenue: existing.revenue + Number(o.combo_price || 0),
        });
      });

      // Get ratings for top restaurants
      const restaurantIds = Array.from(restaurantMap.keys());

      const { data: reviews } = restaurantIds.length > 0
        ? await supabase
            .from('restaurant_reviews')
            .select('restaurant_id, overall_rating')
            .in('restaurant_id', restaurantIds)
        : { data: [] };

      const ratingMap = new Map<string, { total: number; count: number }>();
      reviews?.forEach((r: any) => {
        const existing = ratingMap.get(r.restaurant_id) || { total: 0, count: 0 };
        ratingMap.set(r.restaurant_id, {
          total: existing.total + r.overall_rating,
          count: existing.count + 1,
        });
      });

      return Array.from(restaurantMap.entries())
        .map(([id, data]) => {
          const ratingData = ratingMap.get(id);
          const averageRating = ratingData ? Math.round((ratingData.total / ratingData.count) * 10) / 10 : 0;
          return {
            id,
            name: data.name,
            logoUrl: data.logoUrl,
            totalOrders: data.orders,
            totalRevenue: data.revenue,
            averageRating,
            reviewCount: ratingData?.count || 0,
          };
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);
    } catch (err: any) {
      console.error('Error fetching top restaurants:', err);
      return [];
    }
  }, []);

  const fetchTopUsers = useCallback(async (period: FinancePeriod, limit: number = 10): Promise<TopUser[]> => {
    try {
      const dateFilter = getPeriodFilter(period);

      // Get completed date orders grouped by creator
      let query = supabase
        .from('date_orders')
        .select(`
          creator_id,
          creator_total,
          creator:users!date_orders_creator_id_fkey(id, name, avatar, vip_tier)
        `)
        .eq('status', 'completed');

      if (dateFilter) {
        query = query.gte('completed_at', dateFilter);
      }

      const { data: orders, error: ordersErr } = await query;
      if (ordersErr) throw new Error(ordersErr.message || 'Failed to fetch top users');

      // Group by user
      const userMap = new Map<string, { name: string; avatar: string; vipTier: string; dateOrders: number; spent: number }>();

      orders?.forEach((o: any) => {
        const userId = o.creator_id;
        const existing = userMap.get(userId) || {
          name: o.creator?.name || 'Unknown',
          avatar: o.creator?.avatar || '/default-avatar.jpg',
          vipTier: o.creator?.vip_tier || 'free',
          dateOrders: 0,
          spent: 0,
        };
        userMap.set(userId, {
          ...existing,
          dateOrders: existing.dateOrders + 1,
          spent: existing.spent + Number(o.creator_total || 0),
        });
      });

      return Array.from(userMap.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          avatar: data.avatar,
          totalDateOrders: data.dateOrders,
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

  return {
    loading,
    error,
    fetchOverviewMetrics,
    fetchRevenueData,
    fetchTransactionBreakdown,
    fetchTopRestaurants,
    fetchTopUsers,
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
