'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Restaurant, CuisineType, RestaurantStatus } from '@/types';

function mapDbRowToRestaurant(row: any): Restaurant {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    address: row.address || '',
    area: row.area || '',
    city: row.city || '',
    cuisineTypes: row.cuisine_types || [],
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    images: row.images ?? undefined,
    coordinates: row.latitude && row.longitude
      ? { latitude: row.latitude, longitude: row.longitude }
      : undefined,
    commissionRate: Number(row.commission_rate || 0),
    status: row.status as RestaurantStatus,
    averageRating: row.average_rating != null ? Number(row.average_rating) : undefined,
    reviewCount: row.review_count != null ? Number(row.review_count) : undefined,
    openingHours: row.opening_hours ?? undefined,
    maxCapacity: row.max_capacity != null ? Number(row.max_capacity) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

export function useRestaurants(city?: string) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (city) {
        query = query.eq('city', city);
      }

      const { data, error: dbError } = await query;

      if (dbError) {
        console.error('Error fetching restaurants:', JSON.stringify(dbError, null, 2));
        setError(dbError.message);
        return;
      }

      setRestaurants((data || []).map(mapDbRowToRestaurant));
    } catch (err: any) {
      console.error('Exception fetching restaurants:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return { restaurants, loading, error, refetch: fetchRestaurants };
}

export function useRestaurantById(id: string) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurant = useCallback(async () => {
    if (!id) {
      setRestaurant(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (dbError) {
        console.error('Error fetching restaurant:', JSON.stringify(dbError, null, 2));
        setError(dbError.message);
        setRestaurant(null);
        return;
      }

      setRestaurant(data ? mapDbRowToRestaurant(data) : null);
    } catch (err: any) {
      console.error('Exception fetching restaurant:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  return { restaurant, loading, error, refetch: fetchRestaurant };
}
