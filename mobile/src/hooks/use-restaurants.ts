import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Restaurant, Combo } from '@/constants/types';

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: dbErr } = await supabase
        .from('restaurants')
        .select('*')
        .eq('status', 'active')
        .order('average_rating', { ascending: false })
        .limit(20);

      if (dbErr) {
        console.warn('[useRestaurants] Lỗi tải nhà hàng:', dbErr.message);
        setRestaurants([]);
      } else {
        setRestaurants((data || []).map((r: any) => ({
          id: r.id, name: r.name, description: r.description || '',
          address: r.address || '', area: r.area || '', city: r.city || '',
          cuisineTypes: r.cuisine_types || [], commissionRate: r.commission_rate || 0.15,
          status: r.status, averageRating: r.average_rating, reviewCount: r.review_count,
          openingHours: r.opening_hours, logoUrl: r.logo_url, coverImageUrl: r.cover_image_url,
          createdAt: r.created_at,
        })));
      }
    } catch (err) {
      console.warn('[useRestaurants] Lỗi:', err);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { restaurants, loading, reload: fetch };
}

export function useCombos(restaurantId?: string) {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!restaurantId) { setCombos([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error: dbErr } = await supabase
        .from('combos')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true);

      if (dbErr) {
        console.warn('[useCombos] Lỗi tải combo:', dbErr.message);
        setCombos([]);
      } else {
        setCombos((data || []).map((c: any) => ({
          id: c.id, restaurantId: c.restaurant_id, name: c.name,
          description: c.description || '', items: c.items || [],
          price: c.price, imageUrl: c.image_url, isAvailable: c.is_available,
          createdAt: c.created_at,
        })));
      }
    } catch (err) {
      console.warn('[useCombos] Lỗi:', err);
      setCombos([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { combos, loading, reload: fetch };
}
