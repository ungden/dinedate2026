'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PersonReview, RestaurantReview, Gender } from '@/types';

// ----------------------------------------------------------------
// Mappers
// ----------------------------------------------------------------

function mapUserBasic(u: any) {
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
  } as any;
}

function mapDbRowToPersonReview(row: any): PersonReview {
  return {
    id: row.id,
    dateOrderId: row.date_order_id,
    reviewerId: row.reviewer_id,
    reviewer: row.reviewer ? mapUserBasic(row.reviewer) : undefined,
    reviewedId: row.reviewed_id,
    reviewed: row.reviewed ? mapUserBasic(row.reviewed) : undefined,
    rating: Number(row.rating),
    comment: row.comment || '',
    wantToMeetAgain: row.want_to_meet_again ?? false,
    createdAt: row.created_at,
  };
}

function mapDbRowToRestaurantReview(row: any): RestaurantReview {
  return {
    id: row.id,
    dateOrderId: row.date_order_id,
    reviewerId: row.reviewer_id,
    reviewer: row.reviewer ? mapUserBasic(row.reviewer) : undefined,
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
          logoUrl: row.restaurant.logo_url ?? undefined,
          coverImageUrl: row.restaurant.cover_image_url ?? undefined,
          createdAt: row.restaurant.created_at,
        } as any
      : undefined,
    foodRating: Number(row.food_rating),
    ambianceRating: Number(row.ambiance_rating),
    serviceRating: Number(row.service_rating),
    overallRating: Number(row.overall_rating),
    comment: row.comment || '',
    images: row.images ?? undefined,
    createdAt: row.created_at,
  };
}

// ----------------------------------------------------------------
// Hooks
// ----------------------------------------------------------------

export function usePersonReviewsFor(userId: string) {
  const [reviews, setReviews] = useState<PersonReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!userId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('person_reviews')
        .select(`
          *,
          reviewer:users!person_reviews_reviewer_id_fkey(*),
          reviewed:users!person_reviews_reviewed_id_fkey(*)
        `)
        .eq('reviewed_id', userId)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Error fetching person reviews:', JSON.stringify(dbError, null, 2));
        setError(dbError.message);
        return;
      }

      setReviews((data || []).map(mapDbRowToPersonReview));
    } catch (err: any) {
      console.error('Exception fetching person reviews:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, loading, error, refetch: fetchReviews };
}

export function useRestaurantReviewsFor(restaurantId: string) {
  const [reviews, setReviews] = useState<RestaurantReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!restaurantId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('restaurant_reviews')
        .select(`
          *,
          reviewer:users!restaurant_reviews_reviewer_id_fkey(*),
          restaurant:restaurants(*)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Error fetching restaurant reviews:', JSON.stringify(dbError, null, 2));
        setError(dbError.message);
        return;
      }

      setReviews((data || []).map(mapDbRowToRestaurantReview));
    } catch (err: any) {
      console.error('Exception fetching restaurant reviews:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, loading, error, refetch: fetchReviews };
}

export function useSubmitPersonReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReview = useCallback(
    async (review: {
      dateOrderId: string;
      reviewerId: string;
      reviewedId: string;
      rating: number;
      comment: string;
      wantToMeetAgain: boolean;
    }): Promise<PersonReview | null> => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: dbError } = await supabase
          .from('person_reviews')
          .insert({
            date_order_id: review.dateOrderId,
            reviewer_id: review.reviewerId,
            reviewed_id: review.reviewedId,
            rating: review.rating,
            comment: review.comment,
            want_to_meet_again: review.wantToMeetAgain,
          })
          .select()
          .single();

        if (dbError) {
          console.error('Error submitting person review:', JSON.stringify(dbError, null, 2));
          setError(dbError.message);
          return null;
        }

        return data ? mapDbRowToPersonReview(data) : null;
      } catch (err: any) {
        console.error('Exception submitting person review:', err);
        setError(err.message || 'Unknown error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { submitReview, loading, error };
}

export function useSubmitRestaurantReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReview = useCallback(
    async (review: {
      dateOrderId: string;
      reviewerId: string;
      restaurantId: string;
      foodRating: number;
      ambianceRating: number;
      serviceRating: number;
      overallRating: number;
      comment: string;
      images?: string[];
    }): Promise<RestaurantReview | null> => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: dbError } = await supabase
          .from('restaurant_reviews')
          .insert({
            date_order_id: review.dateOrderId,
            reviewer_id: review.reviewerId,
            restaurant_id: review.restaurantId,
            food_rating: review.foodRating,
            ambiance_rating: review.ambianceRating,
            service_rating: review.serviceRating,
            overall_rating: review.overallRating,
            comment: review.comment,
            images: review.images ?? null,
          })
          .select()
          .single();

        if (dbError) {
          console.error('Error submitting restaurant review:', JSON.stringify(dbError, null, 2));
          setError(dbError.message);
          return null;
        }

        return data ? mapDbRowToRestaurantReview(data) : null;
      } catch (err: any) {
        console.error('Exception submitting restaurant review:', err);
        setError(err.message || 'Unknown error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { submitReview, loading, error };
}

export function useMyReviewsForOrder(orderId: string, userId: string) {
  const [personReview, setPersonReview] = useState<PersonReview | null>(null);
  const [restaurantReview, setRestaurantReview] = useState<RestaurantReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasReviewedPerson = personReview !== null;
  const hasReviewedRestaurant = restaurantReview !== null;

  const fetchReviews = useCallback(async () => {
    if (!orderId || !userId) {
      setPersonReview(null);
      setRestaurantReview(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch both in parallel
      const [personResult, restaurantResult] = await Promise.all([
        supabase
          .from('person_reviews')
          .select('*')
          .eq('date_order_id', orderId)
          .eq('reviewer_id', userId)
          .maybeSingle(),
        supabase
          .from('restaurant_reviews')
          .select('*')
          .eq('date_order_id', orderId)
          .eq('reviewer_id', userId)
          .maybeSingle(),
      ]);

      if (personResult.error) {
        console.error('Error fetching person review:', personResult.error.message);
      } else {
        setPersonReview(personResult.data ? mapDbRowToPersonReview(personResult.data) : null);
      }

      if (restaurantResult.error) {
        console.error('Error fetching restaurant review:', restaurantResult.error.message);
      } else {
        setRestaurantReview(
          restaurantResult.data ? mapDbRowToRestaurantReview(restaurantResult.data) : null
        );
      }

      if (personResult.error || restaurantResult.error) {
        setError('Error checking review status');
      }
    } catch (err: any) {
      console.error('Exception checking reviews:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [orderId, userId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    personReview,
    restaurantReview,
    hasReviewedPerson,
    hasReviewedRestaurant,
    loading,
    error,
    refetch: fetchReviews,
  };
}
