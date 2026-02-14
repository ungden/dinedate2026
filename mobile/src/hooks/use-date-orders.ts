import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DateOrder } from '@/constants/types';
import { getDiceBearAvatar } from '@/lib/dicebear';

function mapOrder(row: any): DateOrder {
  return {
    id: row.id,
    creatorId: row.creator_id,
    creator: row.creator ? {
      id: row.creator.id, name: row.creator.name || 'Ẩn danh', age: 0,
      avatar: row.creator.avatar || getDiceBearAvatar(row.creator.id),
      bio: '', location: '',
      wallet: { balance: 0, escrowBalance: 0, currency: 'VND' },
      vipStatus: { tier: 'free', benefits: [] },
    } : undefined,
    restaurantId: row.restaurant_id,
    restaurant: row.restaurant ? {
      id: row.restaurant.id, name: row.restaurant.name, description: row.restaurant.description || '',
      address: row.restaurant.address || '', area: row.restaurant.area || '', city: row.restaurant.city || '',
      cuisineTypes: row.restaurant.cuisine_types || [], commissionRate: 0.15, status: 'active',
      logoUrl: row.restaurant.logo_url, coverImageUrl: row.restaurant.cover_image_url,
      createdAt: row.restaurant.created_at,
    } : undefined,
    comboId: row.combo_id,
    combo: row.combo ? {
      id: row.combo.id, restaurantId: row.combo.restaurant_id, name: row.combo.name,
      description: row.combo.description || '', items: row.combo.items || [],
      price: row.combo.price, imageUrl: row.combo.image_url, isAvailable: true,
      createdAt: row.combo.created_at,
    } : undefined,
    dateTime: row.date_time,
    description: row.description || '',
    preferredGender: row.preferred_gender,
    paymentSplit: row.payment_split || 'split',
    comboPrice: row.combo_price || 0,
    platformFee: row.platform_fee || 100000,
    creatorTotal: row.creator_total || 0,
    applicantTotal: row.applicant_total || 0,
    status: row.status,
    matchedUserId: row.matched_user_id,
    applicantCount: row.applicant_count || 0,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export function useDateOrders() {
  const [orders, setOrders] = useState<DateOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('date_orders')
        .select(`
          *,
          creator:users!date_orders_creator_id_fkey(id, name, avatar),
          restaurant:restaurants!date_orders_restaurant_id_fkey(id, name, description, address, area, city, cuisine_types, logo_url, cover_image_url, created_at),
          combo:combos!date_orders_combo_id_fkey(id, restaurant_id, name, description, items, price, image_url, created_at)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.warn('[useDateOrders] Lỗi tải đơn hẹn:', error.message);
        setOrders([]);
      } else {
        setOrders((data || []).map(mapOrder));
      }
    } catch (err) {
      console.warn('[useDateOrders] Lỗi:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { orders, loading, reload: fetch };
}

export function useMyDateOrders(userId?: string) {
  const [created, setCreated] = useState<DateOrder[]>([]);
  const [matched, setMatched] = useState<DateOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [createdRes, matchedRes] = await Promise.all([
        supabase.from('date_orders').select(`
          *,
          restaurant:restaurants!date_orders_restaurant_id_fkey(id, name, logo_url, cover_image_url, area, city, cuisine_types, created_at, description, address),
          combo:combos!date_orders_combo_id_fkey(id, restaurant_id, name, description, items, price, image_url, created_at)
        `).eq('creator_id', userId).order('created_at', { ascending: false }).limit(30),
        supabase.from('date_orders').select(`
          *,
          creator:users!date_orders_creator_id_fkey(id, name, avatar),
          restaurant:restaurants!date_orders_restaurant_id_fkey(id, name, logo_url, cover_image_url, area, city, cuisine_types, created_at, description, address),
          combo:combos!date_orders_combo_id_fkey(id, restaurant_id, name, description, items, price, image_url, created_at)
        `).eq('matched_user_id', userId).order('created_at', { ascending: false }).limit(30),
      ]);

      if (createdRes.error) {
        console.warn('[useMyDateOrders] Lỗi tải đơn tạo:', createdRes.error.message);
        setCreated([]);
      } else {
        setCreated((createdRes.data || []).map(mapOrder));
      }

      if (matchedRes.error) {
        console.warn('[useMyDateOrders] Lỗi tải đơn matched:', matchedRes.error.message);
        setMatched([]);
      } else {
        setMatched((matchedRes.data || []).map(mapOrder));
      }
    } catch (err) {
      console.warn('[useMyDateOrders] Lỗi:', err);
      setCreated([]);
      setMatched([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { created, matched, loading, reload: fetch };
}
