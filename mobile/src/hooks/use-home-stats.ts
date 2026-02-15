import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CuisineType } from '@/constants/types';

export interface HomeComboDeal {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  restaurantId: string;
  restaurantName: string;
  cuisineType?: CuisineType;
}

export interface HomeStats {
  onlineCount: number;
  activeOrdersCount: number;
  tonightOrdersCount: number;
  completedDatesCount: number;
  newConnectionsCount: number;
  wantToMeetAgainRate: number;
}

export interface HomeHighlightReview {
  id: string;
  reviewerName: string;
  restaurantName: string;
  rating: number;
  comment: string;
  createdAt: string;
  wantToMeetAgain: boolean;
}

const DEFAULT_STATS: HomeStats = {
  onlineCount: 0,
  activeOrdersCount: 0,
  tonightOrdersCount: 0,
  completedDatesCount: 0,
  newConnectionsCount: 0,
  wantToMeetAgainRate: 0,
};

export function useHomeStats() {
  const [stats, setStats] = useState<HomeStats>(DEFAULT_STATS);
  const [comboDeals, setComboDeals] = useState<HomeComboDeal[]>([]);
  const [highlightReviews, setHighlightReviews] = useState<HomeHighlightReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        onlineUsersRes,
        activeOrdersRes,
        tonightOrdersRes,
        completedDatesRes,
        weeklyConnectionsRes,
        allConnectionsRes,
        personReviewsRes,
        highlightReviewsRes,
        comboDealsRes,
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_online', true),
        supabase.from('date_orders').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase
          .from('date_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('date_time', startOfDay.toISOString())
          .lt('date_time', endOfDay.toISOString()),
        supabase.from('date_orders').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase
          .from('mutual_connections')
          .select('id', { count: 'exact', head: true })
          .gte('connected_at', weekAgo.toISOString()),
        supabase.from('mutual_connections').select('id', { count: 'exact', head: true }),
        supabase
          .from('person_reviews')
          .select('id, want_to_meet_again')
          .limit(500),
        supabase
          .from('person_reviews')
          .select(`
            id,
            rating,
            comment,
            want_to_meet_again,
            created_at,
            reviewer:users!person_reviews_reviewer_id_fkey(name),
            date_order:date_orders!person_reviews_date_order_id_fkey(
              restaurant:restaurants!date_orders_restaurant_id_fkey(name)
            )
          `)
          .gte('rating', 4)
          .eq('want_to_meet_again', true)
          .not('comment', 'is', null)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('combos')
          .select(`
            id,
            name,
            price,
            image_url,
            restaurant_id,
            restaurant:restaurants!combos_restaurant_id_fkey(
              id,
              name,
              cuisine_types,
              status
            )
          `)
          .eq('is_available', true)
          .limit(12),
      ]);

      const reviewRows = personReviewsRes.data || [];
      const yesCount = reviewRows.filter((r: any) => r.want_to_meet_again === true).length;
      const totalReviewCount = reviewRows.length;
      const wantToMeetAgainRate = totalReviewCount > 0
        ? Math.round((yesCount / totalReviewCount) * 100)
        : 0;

      setStats({
        onlineCount: onlineUsersRes.count || 0,
        activeOrdersCount: activeOrdersRes.count || 0,
        tonightOrdersCount: tonightOrdersRes.count || 0,
        completedDatesCount: completedDatesRes.count || 0,
        newConnectionsCount: weeklyConnectionsRes.count || 0,
        wantToMeetAgainRate,
      });

      if (!comboDealsRes.error && comboDealsRes.data) {
        const deals = (comboDealsRes.data as any[])
          .filter((row) => row.restaurant?.status === 'active')
          .sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
          .slice(0, 10)
          .map((row) => ({
            id: row.id,
            name: row.name,
            price: Number(row.price || 0),
            imageUrl: row.image_url,
            restaurantId: row.restaurant_id,
            restaurantName: row.restaurant?.name || 'Nhà hàng đối tác',
            cuisineType: row.restaurant?.cuisine_types?.[0],
          }));

        setComboDeals(deals);
      } else {
        setComboDeals([]);
      }

      if (!highlightReviewsRes.error && highlightReviewsRes.data) {
        const mappedReviews = (highlightReviewsRes.data as any[])
          .filter((row) => row.comment && String(row.comment).trim().length > 0)
          .map((row) => ({
            id: row.id,
            reviewerName: row.reviewer?.name || 'Người dùng ẩn danh',
            restaurantName: row.date_order?.restaurant?.name || 'Nhà hàng đối tác',
            rating: Number(row.rating || 0),
            comment: String(row.comment || '').trim(),
            createdAt: row.created_at,
            wantToMeetAgain: Boolean(row.want_to_meet_again),
          }));

        setHighlightReviews(mappedReviews);
      } else {
        setHighlightReviews([]);
      }

      if (allConnectionsRes.error) {
        console.warn('[useHomeStats] Lỗi tải tổng kết nối:', allConnectionsRes.error.message);
      }
    } catch (err) {
      console.warn('[useHomeStats] Lỗi:', err);
      setStats(DEFAULT_STATS);
      setComboDeals([]);
      setHighlightReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { stats, comboDeals, highlightReviews, loading, reload: fetch };
}
