'use client';

/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateOrder, CuisineType } from '@/types';
import { mapDbUserToUser } from '@/lib/user-mapper';

export function useDbDateOrders(cuisineType?: CuisineType) {
  const [orders, setOrders] = useState<DateOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('date_orders')
        .select(`
          *,
          creator:users!date_orders_creator_id_fkey(*),
          restaurant:restaurants!date_orders_restaurant_id_fkey(*),
          combo:combos!date_orders_combo_id_fkey(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      // Filter by cuisine type through joined restaurant
      // Note: Supabase doesn't support filtering on joined table's array field directly,
      // so we filter client-side if cuisineType is provided

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching date orders:', JSON.stringify(error, null, 2));
        return;
      }

      let mapped: DateOrder[] = (data || []).map((row: any) => ({
        id: row.id,
        creatorId: row.creator_id,
        creator: row.creator ? mapDbUserToUser(row.creator) : undefined,
        restaurantId: row.restaurant_id,
        restaurant: row.restaurant || undefined,
        comboId: row.combo_id,
        combo: row.combo || undefined,
        dateTime: row.date_time,
        description: row.description || '',
        preferredGender: row.preferred_gender,
        paymentSplit: row.payment_split || 'split',
        comboPrice: Number(row.combo_price || 0),
        platformFee: Number(row.platform_fee || 0),
        creatorTotal: Number(row.creator_total || 0),
        applicantTotal: Number(row.applicant_total || 0),
        restaurantCommission: Number(row.restaurant_commission || 0),
        status: row.status,
        matchedUserId: row.matched_user_id,
        matchedAt: row.matched_at,
        tableBookingId: row.table_booking_id,
        maxApplicants: row.max_applicants || 10,
        applicantCount: row.applicant_count || 0,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        completedAt: row.completed_at,
        cancelledAt: row.cancelled_at,
      }));

      // Client-side cuisine filter
      if (cuisineType) {
        mapped = mapped.filter((order) =>
          order.restaurant?.cuisineTypes?.includes(cuisineType)
        );
      }

      setOrders(mapped);
    } catch (err) {
      console.error('Exception fetching date orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to changes
    const channel = supabase
      .channel('public:date_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'date_orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cuisineType]);

  return { orders, loading, refresh: fetchOrders };
}

export function useDbDateOrderDetail(orderId: string) {
  const [order, setOrder] = useState<DateOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('date_orders')
        .select(`
          *,
          creator:users!date_orders_creator_id_fkey(*),
          matched_user:users!date_orders_matched_user_id_fkey(*),
          restaurant:restaurants!date_orders_restaurant_id_fkey(*),
          combo:combos!date_orders_combo_id_fkey(*)
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const mappedOrder: DateOrder = {
        id: orderData.id,
        creatorId: orderData.creator_id,
        creator: orderData.creator ? mapDbUserToUser(orderData.creator) : undefined,
        restaurantId: orderData.restaurant_id,
        restaurant: orderData.restaurant || undefined,
        comboId: orderData.combo_id,
        combo: orderData.combo || undefined,
        dateTime: orderData.date_time,
        description: orderData.description || '',
        preferredGender: orderData.preferred_gender,
        paymentSplit: orderData.payment_split || 'split',
        comboPrice: Number(orderData.combo_price || 0),
        platformFee: Number(orderData.platform_fee || 0),
        creatorTotal: Number(orderData.creator_total || 0),
        applicantTotal: Number(orderData.applicant_total || 0),
        restaurantCommission: Number(orderData.restaurant_commission || 0),
        status: orderData.status,
        matchedUserId: orderData.matched_user_id,
        matchedUser: orderData.matched_user ? mapDbUserToUser(orderData.matched_user) : undefined,
        matchedAt: orderData.matched_at,
        tableBookingId: orderData.table_booking_id,
        maxApplicants: orderData.max_applicants || 10,
        applicantCount: orderData.applicant_count || 0,
        createdAt: orderData.created_at,
        expiresAt: orderData.expires_at,
        completedAt: orderData.completed_at,
        cancelledAt: orderData.cancelled_at,
      };

      setOrder(mappedOrder);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchDetail();
  }, [orderId]);

  return { order, loading, refresh: fetchDetail };
}
