'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MutualConnection, Gender } from '@/types';

// ----------------------------------------------------------------
// Mapper
// ----------------------------------------------------------------

function mapUserBasic(u: any) {
  if (!u) return undefined;
  return {
    id: u.id,
    name: u.name || u.username || '',
    username: u.username,
    age: u.age || 0,
    avatar: u.avatar || '',
    realAvatar: u.real_avatar ?? undefined,
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
    images: u.images ?? undefined,
  } as any;
}

function mapDbRowToConnection(row: any): MutualConnection {
  return {
    id: row.id,
    user1Id: row.user1_id,
    user1: row.user1 ? mapUserBasic(row.user1) : undefined,
    user2Id: row.user2_id,
    user2: row.user2 ? mapUserBasic(row.user2) : undefined,
    dateOrderId: row.date_order_id,
    connectedAt: row.connected_at,
  };
}

// ----------------------------------------------------------------
// Hook
// ----------------------------------------------------------------

export function useMutualConnections(userId: string) {
  const [connections, setConnections] = useState<MutualConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    if (!userId) {
      setConnections([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('mutual_connections')
        .select(`
          *,
          user1:users!mutual_connections_user1_id_fkey(*),
          user2:users!mutual_connections_user2_id_fkey(*)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('connected_at', { ascending: false });

      if (dbError) {
        console.error('Error fetching mutual connections:', JSON.stringify(dbError, null, 2));
        setError(dbError.message);
        return;
      }

      setConnections((data || []).map(mapDbRowToConnection));
    } catch (err: any) {
      console.error('Exception fetching mutual connections:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConnections();

    const channel = supabase
      .channel(`connections:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mutual_connections' },
        () => {
          fetchConnections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConnections, userId]);

  return { connections, loading, error, refetch: fetchConnections };
}
