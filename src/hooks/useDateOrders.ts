'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  DateOrder,
  DateOrderStatus,
  CuisineType,
  PaymentSplit,
  Gender,
} from '@/types';

// ----------------------------------------------------------------
// Mapper
// ----------------------------------------------------------------

function mapDbRowToDateOrder(row: any): DateOrder {
  return {
    id: row.id,
    creatorId: row.creator_id,
    creator: row.creator ? mapUser(row.creator) : undefined,
    restaurantId: row.restaurant_id,
    restaurant: row.restaurant
      ? {
          id: row.restaurant.id,
          name: row.restaurant.name,
          description: row.restaurant.description || '',
          address: row.restaurant.address || '',
          area: row.restaurant.area || '',
          city: row.restaurant.city || '',
          cuisineTypes: row.restaurant.cuisine_types || [],
          commissionRate: Number(row.restaurant.commission_rate || 0),
          status: row.restaurant.status,
          averageRating: row.restaurant.average_rating != null
            ? Number(row.restaurant.average_rating)
            : undefined,
          reviewCount: row.restaurant.review_count != null
            ? Number(row.restaurant.review_count)
            : undefined,
          logoUrl: row.restaurant.logo_url ?? undefined,
          coverImageUrl: row.restaurant.cover_image_url ?? undefined,
          images: row.restaurant.images ?? undefined,
          openingHours: row.restaurant.opening_hours ?? undefined,
          createdAt: row.restaurant.created_at,
        }
      : undefined,
    comboId: row.combo_id,
    combo: row.combo
      ? {
          id: row.combo.id,
          restaurantId: row.combo.restaurant_id,
          name: row.combo.name,
          description: row.combo.description || '',
          items: row.combo.items || [],
          price: Number(row.combo.price || 0),
          imageUrl: row.combo.image_url ?? undefined,
          isAvailable: row.combo.is_available ?? true,
          createdAt: row.combo.created_at,
        }
      : undefined,
    dateTime: row.date_time,
    description: row.description || '',
    preferredGender: row.preferred_gender as Gender | undefined,
    paymentSplit: row.payment_split as PaymentSplit,
    comboPrice: Number(row.combo_price || 0),
    platformFee: Number(row.platform_fee || 0),
    creatorTotal: Number(row.creator_total || 0),
    applicantTotal: Number(row.applicant_total || 0),
    restaurantCommission: Number(row.restaurant_commission || 0),
    status: row.status as DateOrderStatus,
    matchedUserId: row.matched_user_id ?? undefined,
    matchedUser: row.matched_user ? mapUser(row.matched_user) : undefined,
    matchedAt: row.matched_at ?? undefined,
    tableBookingId: row.table_booking_id ?? undefined,
    maxApplicants: row.max_applicants || 10,
    applicantCount: row.applicant_count || 0,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    completedAt: row.completed_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
  };
}

function mapUser(u: any) {
  if (!u) return undefined;
  return {
    id: u.id,
    name: u.name || u.username || '',
    username: u.username,
    age: u.age || 0,
    avatar: u.avatar || '',
    bio: u.bio || '',
    location: u.location || '',
    wallet: u.wallet || { balance: 0, escrowBalance: 0, currency: 'VND' },
    vipStatus: u.vip_status || { tier: 'free', benefits: [] },
    gender: u.gender as Gender | undefined,
    rating: u.rating != null ? Number(u.rating) : undefined,
    reviewCount: u.review_count != null ? Number(u.review_count) : undefined,
    zodiac: u.zodiac,
    personalityTags: u.personality_tags,
    foodPreferences: u.food_preferences,
    occupation: u.occupation,
  } as any;
}

// ----------------------------------------------------------------
// Select fragments
// ----------------------------------------------------------------

const DATE_ORDER_SELECT = `
  *,
  creator:users!date_orders_creator_id_fkey(*),
  restaurant:restaurants(*),
  combo:combos(*),
  matched_user:users!date_orders_matched_user_id_fkey(*)
`;

// ----------------------------------------------------------------
// Hooks
// ----------------------------------------------------------------

interface DateOrderFilters {
  status?: DateOrderStatus;
  city?: string;
  cuisineType?: CuisineType;
}

export function useDateOrders(filters?: DateOrderFilters) {
  const [dateOrders, setDateOrders] = useState<DateOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDateOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('date_orders')
        .select(DATE_ORDER_SELECT)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      } else {
        // Default: show active orders
        query = query.eq('status', 'active');
      }

      if (filters?.city) {
        query = query.eq('restaurant.city', filters.city);
      }

      if (filters?.cuisineType) {
        query = query.contains('restaurant.cuisine_types', [filters.cuisineType]);
      }

      const { data, error: dbError } = await query;

      if (dbError) {
        console.error('Error fetching date orders:', JSON.stringify(dbError, null, 2));
        setError(dbError.message);
        return;
      }

      setDateOrders((data || []).map(mapDbRowToDateOrder));
    } catch (err: any) {
      console.error('Exception fetching date orders:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.city, filters?.cuisineType]);

  useEffect(() => {
    fetchDateOrders();

    const channel = supabase
      .channel('public:date_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'date_orders' },
        () => {
          fetchDateOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDateOrders]);

  return { dateOrders, loading, error, refetch: fetchDateOrders };
}

export function useDateOrderById(id: string) {
  const [dateOrder, setDateOrder] = useState<DateOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDateOrder = useCallback(async () => {
    if (!id) {
      setDateOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('date_orders')
        .select(DATE_ORDER_SELECT)
        .eq('id', id)
        .single();

      if (dbError) {
        console.error('Error fetching date order:', JSON.stringify(dbError, null, 2));
        setError(dbError.message);
        setDateOrder(null);
        return;
      }

      setDateOrder(data ? mapDbRowToDateOrder(data) : null);
    } catch (err: any) {
      console.error('Exception fetching date order:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDateOrder();
  }, [fetchDateOrder]);

  return { dateOrder, loading, error, refetch: fetchDateOrder };
}

export function useMyDateOrders(userId: string) {
  const [dateOrders, setDateOrders] = useState<DateOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyDateOrders = useCallback(async () => {
    if (!userId) {
      setDateOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch orders created by user OR where user was matched
      const { data, error: dbError } = await supabase
        .from('date_orders')
        .select(DATE_ORDER_SELECT)
        .or(`creator_id.eq.${userId},matched_user_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Error fetching my date orders:', JSON.stringify(dbError, null, 2));
        setError(dbError.message);
        return;
      }

      setDateOrders((data || []).map(mapDbRowToDateOrder));
    } catch (err: any) {
      console.error('Exception fetching my date orders:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMyDateOrders();
  }, [fetchMyDateOrders]);

  return { dateOrders, loading, error, refetch: fetchMyDateOrders };
}

export function useCreateDateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDateOrder = useCallback(
    async (order: {
      creatorId: string;
      restaurantId: string;
      comboId: string;
      dateTime: string;
      description: string;
      preferredGender?: Gender;
      paymentSplit: PaymentSplit;
      comboPrice: number;
      platformFee: number;
      creatorTotal: number;
      applicantTotal: number;
      restaurantCommission: number;
      maxApplicants?: number;
      expiresAt: string;
    }): Promise<DateOrder | null> => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: dbError } = await supabase
          .from('date_orders')
          .insert({
            creator_id: order.creatorId,
            restaurant_id: order.restaurantId,
            combo_id: order.comboId,
            date_time: order.dateTime,
            description: order.description,
            preferred_gender: order.preferredGender ?? null,
            payment_split: order.paymentSplit,
            combo_price: order.comboPrice,
            platform_fee: order.platformFee,
            creator_total: order.creatorTotal,
            applicant_total: order.applicantTotal,
            restaurant_commission: order.restaurantCommission,
            max_applicants: order.maxApplicants ?? 10,
            expires_at: order.expiresAt,
            status: 'active',
            applicant_count: 0,
          })
          .select()
          .single();

        if (dbError) {
          console.error('Error creating date order:', JSON.stringify(dbError, null, 2));
          setError(dbError.message);
          return null;
        }

        return data ? mapDbRowToDateOrder(data) : null;
      } catch (err: any) {
        console.error('Exception creating date order:', err);
        setError(err.message || 'Unknown error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createDateOrder, loading, error };
}

export function useCancelDateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelDateOrder = useCallback(
    async (orderId: string): Promise<boolean> => {
      if (!orderId) return false;

      setLoading(true);
      setError(null);
      try {
        const { error: dbError } = await supabase
          .from('date_orders')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .in('status', ['active']); // Can only cancel active orders

        if (dbError) {
          console.error('Error cancelling date order:', JSON.stringify(dbError, null, 2));
          setError(dbError.message);
          return false;
        }

        return true;
      } catch (err: any) {
        console.error('Exception cancelling date order:', err);
        setError(err.message || 'Unknown error');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { cancelDateOrder, loading, error };
}
