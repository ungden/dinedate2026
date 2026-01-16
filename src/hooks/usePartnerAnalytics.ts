'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AnalyticsPeriod = '7d' | '30d' | 'all';

export interface DailyEarning {
  date: string;
  amount: number;
  bookings: number;
}

export interface EarningsData {
  total: number;
  daily: DailyEarning[];
  completedBookings: number;
  averagePerBooking: number;
}

export interface BookingStatsData {
  received: number;
  accepted: number;
  completed: number;
  acceptanceRate: number;
  completionRate: number;
}

export interface ProfileViewsData {
  current: number;
  previous: number;
  trendPercentage: number;
  isUp: boolean;
}

export interface TopService {
  serviceId: string;
  title: string;
  bookings: number;
  percentage: number;
  earnings: number;
}

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  reviewerAvatar: string;
  createdAt: string;
}

export interface PartnerAnalytics {
  earnings: EarningsData | null;
  bookingStats: BookingStatsData | null;
  profileViews: ProfileViewsData | null;
  topServices: TopService[];
  recentReviews: ReviewItem[];
  averageRating: number;
  loading: boolean;
  error: string | null;
  period: AnalyticsPeriod;
  setPeriod: (period: AnalyticsPeriod) => void;
  refresh: () => Promise<void>;
}

function getPeriodDays(period: AnalyticsPeriod): number | null {
  switch (period) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case 'all':
      return null;
  }
}

function getDateRangeFilter(period: AnalyticsPeriod): string | null {
  const days = getPeriodDays(period);
  if (!days) return null;

  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export function usePartnerAnalytics(): PartnerAnalytics {
  const { user } = useAuth();
  const userId = user?.id;

  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [bookingStats, setBookingStats] = useState<BookingStatsData | null>(null);
  const [profileViews, setProfileViews] = useState<ProfileViewsData | null>(null);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [recentReviews, setRecentReviews] = useState<ReviewItem[]>([]);
  const [averageRating, setAverageRating] = useState(0);

  const fetchEarnings = useCallback(async (): Promise<EarningsData | null> => {
    if (!userId) return null;

    try {
      const dateFilter = getDateRangeFilter(period);
      const days = getPeriodDays(period) || 365; // Default to 1 year for "all"

      // Fetch completed bookings with earnings
      let query = supabase
        .from('bookings')
        .select('id, total_amount, created_at, completed_at')
        .eq('partner_id', userId)
        .eq('status', 'completed');

      if (dateFilter) {
        query = query.gte('completed_at', dateFilter);
      }

      const { data: bookings, error: bookingsError } = await query;

      if (bookingsError) throw bookingsError;

      const total = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const completedBookings = bookings?.length || 0;
      const averagePerBooking = completedBookings > 0 ? total / completedBookings : 0;

      // Group by date for daily earnings
      const dailyMap = new Map<string, { amount: number; bookings: number }>();

      // Initialize all days in the period
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyMap.set(dateStr, { amount: 0, bookings: 0 });
      }

      // Populate with actual data
      bookings?.forEach((b) => {
        if (b.completed_at) {
          const dateStr = new Date(b.completed_at).toISOString().split('T')[0];
          const existing = dailyMap.get(dateStr) || { amount: 0, bookings: 0 };
          dailyMap.set(dateStr, {
            amount: existing.amount + (b.total_amount || 0),
            bookings: existing.bookings + 1,
          });
        }
      });

      // Convert to array and sort by date
      const daily: DailyEarning[] = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          amount: data.amount,
          bookings: data.bookings,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-Math.min(days, 30)); // Limit to last 30 days for chart

      return { total, daily, completedBookings, averagePerBooking };
    } catch (err) {
      console.error('Error fetching earnings:', err);
      return null;
    }
  }, [userId, period]);

  const fetchBookingStats = useCallback(async (): Promise<BookingStatsData | null> => {
    if (!userId) return null;

    try {
      const dateFilter = getDateRangeFilter(period);

      // Fetch all bookings for this partner
      let query = supabase
        .from('bookings')
        .select('id, status, created_at')
        .eq('partner_id', userId);

      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { data: bookings, error: bookingsError } = await query;

      if (bookingsError) throw bookingsError;

      const received = bookings?.length || 0;
      const accepted = bookings?.filter((b) => ['accepted', 'completed'].includes(b.status)).length || 0;
      const completed = bookings?.filter((b) => b.status === 'completed').length || 0;

      const acceptanceRate = received > 0 ? (accepted / received) * 100 : 0;
      const completionRate = accepted > 0 ? (completed / accepted) * 100 : 0;

      return { received, accepted, completed, acceptanceRate, completionRate };
    } catch (err) {
      console.error('Error fetching booking stats:', err);
      return null;
    }
  }, [userId, period]);

  const fetchProfileViews = useCallback(async (): Promise<ProfileViewsData | null> => {
    if (!userId) return null;

    try {
      const days = getPeriodDays(period) || 30;
      const now = new Date();
      const currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - days);
      const previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - days);

      // Get current period views
      const { count: currentCount, error: currentError } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('viewed_id', userId)
        .gte('viewed_at', currentStart.toISOString());

      if (currentError) throw currentError;

      // Get previous period views
      const { count: previousCount, error: previousError } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('viewed_id', userId)
        .gte('viewed_at', previousStart.toISOString())
        .lt('viewed_at', currentStart.toISOString());

      if (previousError) throw previousError;

      const current = currentCount || 0;
      const previous = previousCount || 0;
      const trendPercentage = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

      return {
        current,
        previous,
        trendPercentage: Math.round(trendPercentage * 10) / 10,
        isUp: trendPercentage >= 0,
      };
    } catch (err) {
      console.error('Error fetching profile views:', err);
      // Return fallback data if table doesn't exist yet
      return { current: 0, previous: 0, trendPercentage: 0, isUp: true };
    }
  }, [userId, period]);

  const fetchTopServices = useCallback(async (): Promise<TopService[]> => {
    if (!userId) return [];

    try {
      const dateFilter = getDateRangeFilter(period);

      // Fetch bookings with service info
      let query = supabase
        .from('bookings')
        .select('service_id, total_amount, services!bookings_service_id_fkey(id, title)')
        .eq('partner_id', userId)
        .in('status', ['accepted', 'completed']);

      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { data: bookings, error: bookingsError } = await query;

      if (bookingsError) throw bookingsError;

      // Group by service
      const serviceMap = new Map<string, { title: string; bookings: number; earnings: number }>();

      bookings?.forEach((b: any) => {
        const serviceId = b.service_id;
        const title = b.services?.title || 'Dịch vụ không xác định';
        const existing = serviceMap.get(serviceId) || { title, bookings: 0, earnings: 0 };
        serviceMap.set(serviceId, {
          title,
          bookings: existing.bookings + 1,
          earnings: existing.earnings + (b.total_amount || 0),
        });
      });

      const totalBookings = bookings?.length || 1;

      return Array.from(serviceMap.entries())
        .map(([serviceId, data]) => ({
          serviceId,
          title: data.title,
          bookings: data.bookings,
          percentage: Math.round((data.bookings / totalBookings) * 100),
          earnings: data.earnings,
        }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);
    } catch (err) {
      console.error('Error fetching top services:', err);
      return [];
    }
  }, [userId, period]);

  const fetchRecentReviews = useCallback(async (): Promise<{ reviews: ReviewItem[]; avgRating: number }> => {
    if (!userId) return { reviews: [], avgRating: 0 };

    try {
      // Fetch recent reviews for this partner
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer:users!reviews_reviewer_id_fkey(id, name, avatar)')
        .eq('reviewed_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (reviewsError) throw reviewsError;

      // Fetch average rating
      const { data: allReviews, error: avgError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_id', userId);

      if (avgError) throw avgError;

      const avgRating =
        allReviews && allReviews.length > 0
          ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
          : 0;

      return {
        reviews:
          reviews?.map((r: any) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment || '',
            reviewerName: r.reviewer?.name || 'Ẩn danh',
            reviewerAvatar: r.reviewer?.avatar || '/default-avatar.jpg',
            createdAt: r.created_at,
          })) || [],
        avgRating: Math.round(avgRating * 10) / 10,
      };
    } catch (err) {
      console.error('Error fetching reviews:', err);
      return { reviews: [], avgRating: 0 };
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [earningsData, statsData, viewsData, servicesData, reviewsData] = await Promise.all([
        fetchEarnings(),
        fetchBookingStats(),
        fetchProfileViews(),
        fetchTopServices(),
        fetchRecentReviews(),
      ]);

      setEarnings(earningsData);
      setBookingStats(statsData);
      setProfileViews(viewsData);
      setTopServices(servicesData);
      setRecentReviews(reviewsData.reviews);
      setAverageRating(reviewsData.avgRating);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchEarnings, fetchBookingStats, fetchProfileViews, fetchTopServices, fetchRecentReviews]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    earnings,
    bookingStats,
    profileViews,
    topServices,
    recentReviews,
    averageRating,
    loading,
    error,
    period,
    setPeriod,
    refresh,
  };
}
