import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface PersonReview {
  id: string;
  dateOrderId: string;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  comment: string;
  wantToMeetAgain: boolean;
  restaurantName?: string;
  reviewerName?: string;
  reviewedName?: string;
  createdAt: string;
}

export interface RestaurantReview {
  id: string;
  dateOrderId: string;
  reviewerId: string;
  restaurantId: string;
  restaurantName?: string;
  foodRating: number;
  ambianceRating: number;
  serviceRating: number;
  overallRating: number;
  comment: string;
  createdAt: string;
}

export function useSubmitReview() {
  const [loading, setLoading] = useState(false);

  const submitPersonReview = useCallback(async (
    dateOrderId: string,
    reviewedId: string,
    rating: number,
    comment: string,
    wantToMeetAgain: boolean,
  ) => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Chưa đăng nhập');

      const { error } = await supabase.from('person_reviews').insert({
        date_order_id: dateOrderId,
        reviewer_id: authUser.id,
        reviewed_id: reviewedId,
        rating,
        comment,
        want_to_meet_again: wantToMeetAgain,
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[submitPersonReview] Lỗi:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitRestaurantReview = useCallback(async (
    dateOrderId: string,
    restaurantId: string,
    foodRating: number,
    ambianceRating: number,
    serviceRating: number,
    overallRating: number,
    comment: string,
  ) => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Chưa đăng nhập');

      const { error } = await supabase.from('restaurant_reviews').insert({
        date_order_id: dateOrderId,
        reviewer_id: authUser.id,
        restaurant_id: restaurantId,
        food_rating: foodRating,
        ambiance_rating: ambianceRating,
        service_rating: serviceRating,
        overall_rating: overallRating,
        comment,
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[submitRestaurantReview] Lỗi:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submitPersonReview, submitRestaurantReview, loading };
}

export function useMyReviews(userId?: string) {
  const [sentReviews, setSentReviews] = useState<PersonReview[]>([]);
  const [receivedReviews, setReceivedReviews] = useState<PersonReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [sentRes, receivedRes] = await Promise.all([
        supabase
          .from('person_reviews')
          .select('*, date_order:date_orders(restaurant_id, restaurant:restaurants(name)), reviewed:users!person_reviews_reviewed_id_fkey(name)')
          .eq('reviewer_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('person_reviews')
          .select('*, reviewer:users!person_reviews_reviewer_id_fkey(name)')
          .eq('reviewed_id', userId)
          .order('created_at', { ascending: false }),
      ]);

      if (sentRes.error) {
        console.warn('[useMyReviews] Lỗi tải đánh giá đã gửi:', sentRes.error.message);
        setSentReviews([]);
      } else {
        setSentReviews((sentRes.data || []).map((r: any) => ({
          id: r.id,
          dateOrderId: r.date_order_id,
          reviewerId: r.reviewer_id,
          reviewedId: r.reviewed_id,
          rating: r.rating,
          comment: r.comment,
          wantToMeetAgain: r.want_to_meet_again,
          createdAt: r.created_at,
          restaurantName: r.date_order?.restaurant?.name,
          reviewedName: r.reviewed?.name,
        })));
      }

      if (receivedRes.error) {
        console.warn('[useMyReviews] Lỗi tải đánh giá nhận được:', receivedRes.error.message);
        setReceivedReviews([]);
      } else {
        setReceivedReviews((receivedRes.data || []).map((r: any) => ({
          id: r.id,
          dateOrderId: r.date_order_id,
          reviewerId: r.reviewer_id,
          reviewedId: r.reviewed_id,
          rating: r.rating,
          comment: r.comment,
          wantToMeetAgain: r.want_to_meet_again,
          createdAt: r.created_at,
          reviewerName: r.reviewer?.name,
        })));
      }
    } catch (err) {
      console.warn('[useMyReviews] Lỗi:', err);
      setSentReviews([]);
      setReceivedReviews([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { sentReviews, receivedReviews, loading, reload: fetch };
}
