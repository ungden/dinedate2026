'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Combo } from '@/types';

function mapDbRowToCombo(row: any): Combo {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    name: row.name,
    description: row.description || '',
    items: row.items || [],
    price: Number(row.price || 0),
    imageUrl: row.image_url ?? undefined,
    isAvailable: row.is_available ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

export function useCombos(restaurantId: string) {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCombos = useCallback(async () => {
    if (!restaurantId) {
      setCombos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('combos')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('price', { ascending: true });

      if (dbError) {
        console.error('Error fetching combos:', JSON.stringify(dbError, null, 2));
        setError(dbError.message);
        return;
      }

      setCombos((data || []).map(mapDbRowToCombo));
    } catch (err: any) {
      console.error('Exception fetching combos:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchCombos();
  }, [fetchCombos]);

  return { combos, loading, error };
}
