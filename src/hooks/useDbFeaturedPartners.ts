'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { mapDbUserToUser } from '@/lib/user-mapper';

type SlotType = 'homepage_top' | 'search_top' | 'category_top';

interface FeaturedSlot {
  id: string;
  user_id: string;
  slot_type: SlotType;
  start_date: string;
  end_date: string;
  amount_paid: number;
  status: 'active' | 'pending' | 'expired';
  created_at: string;
}

interface UseFeaturedPartnersOptions {
  slotType?: SlotType;
  limit?: number;
}

export function useDbFeaturedPartners(options: UseFeaturedPartnersOptions = {}) {
  const { slotType = 'homepage_top', limit = 10 } = options;

  const [partners, setPartners] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get active featured slots for the specified type
      const now = new Date().toISOString();

      let query = supabase
        .from('featured_slots')
        .select('*')
        .eq('status', 'active')
        .lte('start_date', now)
        .gte('end_date', now)
        .order('amount_paid', { ascending: false }) // Higher paying first
        .order('created_at', { ascending: true }) // Earlier purchase first
        .limit(limit);

      if (slotType) {
        query = query.eq('slot_type', slotType);
      }

      const { data: slots, error: slotsErr } = await query;

      if (slotsErr) throw slotsErr;

      if (!slots || slots.length === 0) {
        setPartners([]);
        setLoading(false);
        return;
      }

      // Get user IDs from active slots
      const userIds = slots.map((slot: FeaturedSlot) => slot.user_id);

      // Fetch user details
      const { data: usersData, error: usersErr } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);

      if (usersErr) throw usersErr;

      // Map to User type and preserve slot order
      const usersMap = new Map<string, User>();
      (usersData || []).forEach((row: any) => {
        usersMap.set(row.id, mapDbUserToUser(row));
      });

      // Return in slot priority order (higher paying first)
      const orderedPartners = userIds
        .map((id) => usersMap.get(id))
        .filter((u): u is User => !!u);

      setPartners(orderedPartners);
    } catch (err: any) {
      console.error('Error loading featured partners:', err);
      setError(err.message || 'Failed to load featured partners');
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }, [slotType, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { partners, loading, error, reload: load };
}

// Hook to get current user's featured slot status
export function useMyFeaturedStatus(userId?: string) {
  const [slot, setSlot] = useState<FeaturedSlot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setSlot(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('featured_slots')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('end_date', now)
        .order('end_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is fine
        throw error;
      }

      setSlot(data || null);
    } catch (err: any) {
      console.error('Error checking featured status:', err);
      setSlot(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { slot, loading, reload: load, isActive: !!slot };
}
