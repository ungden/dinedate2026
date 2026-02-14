import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getDiceBearAvatar } from '@/lib/dicebear';

export interface Connection {
  id: string;
  myUserId: string;
  otherUser: {
    id: string;
    name: string;
    avatar: string;
    phone?: string;
    email?: string;
  };
  restaurant: {
    id: string;
    name: string;
    area: string;
    address?: string;
  };
  dateOrderId: string;
  dateTime: string;
  connectedAt: string;
}

export function useConnections(userId?: string) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      // mutual_connections has user1_id, user2_id, date_order_id, connected_at
      // Must JOIN through date_orders to get restaurant info and date_time
      const { data, error } = await supabase
        .from('mutual_connections')
        .select(`
          id,
          user1_id,
          user2_id,
          date_order_id,
          connected_at,
          date_order:date_orders!mutual_connections_date_order_id_fkey(
            id, date_time,
            restaurant:restaurants!date_orders_restaurant_id_fkey(id, name, area, address)
          ),
          user1:users!mutual_connections_user1_id_fkey(id, name, real_avatar, avatar, phone, email),
          user2:users!mutual_connections_user2_id_fkey(id, name, real_avatar, avatar, phone, email)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('connected_at', { ascending: false });

      if (error) {
        console.warn('[useConnections] Lỗi tải kết nối:', error.message);
        setConnections([]);
      } else {
        setConnections((data || []).map((row: any) => {
          // Determine which user is "the other"
          const isUser1 = row.user1_id === userId;
          const otherUserData = isUser1 ? row.user2 : row.user1;

          return {
            id: row.id,
            myUserId: userId,
            otherUser: {
              id: otherUserData?.id || '',
              name: otherUserData?.name || 'Ẩn danh',
              avatar: otherUserData?.real_avatar || otherUserData?.avatar || getDiceBearAvatar(otherUserData?.id || 'unknown'),
              phone: otherUserData?.phone,
              email: otherUserData?.email,
            },
            restaurant: {
              id: row.date_order?.restaurant?.id || '',
              name: row.date_order?.restaurant?.name || 'Nhà hàng',
              area: row.date_order?.restaurant?.area || '',
              address: row.date_order?.restaurant?.address,
            },
            dateOrderId: row.date_order_id,
            dateTime: row.date_order?.date_time || '',
            connectedAt: row.connected_at,
          };
        }));
      }
    } catch (err) {
      console.warn('[useConnections] Lỗi:', err);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { connections, loading, reload: fetch };
}
