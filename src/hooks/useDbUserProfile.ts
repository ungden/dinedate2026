'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PersonReview, User } from '@/types';
import { mapDbUserToUser } from '@/lib/user-mapper';

function isUUID(str: string) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(str);
}

export function useDbUserProfile(slug?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<PersonReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      let userRow = null;
      let userError = null;

      // Detect if slug is UUID or Username
      if (isUUID(slug)) {
        const { data, error } = await supabase.from('users').select('*').eq('id', slug).single();
        userRow = data;
        userError = error;
      } else {
        const { data, error } = await supabase.from('users').select('*').eq('username', slug).single();
        userRow = data;
        userError = error;
      }

      if (userError) {
        console.error("User not found:", userError);
        setLoading(false);
        return;
      }

      if (!userRow) {
        setLoading(false);
        return;
      }

      const mappedUser = mapDbUserToUser(userRow as any);
      const userId = mappedUser.id;

      const { data: reviewRows, error: reviewErr } = await supabase
        .from('person_reviews')
        .select('*')
        .eq('reviewed_id', userId)
        .order('created_at', { ascending: false });

      if (reviewErr) console.error(reviewErr);

      const mappedReviews: PersonReview[] = (reviewRows || []).map((r: any) => ({
        id: r.id,
        dateOrderId: r.date_order_id,
        reviewerId: r.reviewer_id,
        reviewedId: r.reviewed_id,
        rating: r.rating,
        comment: r.comment ?? '',
        wantToMeetAgain: r.want_to_meet_again ?? false,
        createdAt: r.created_at,
      }));

      if (cancelled) return;

      setUser(mappedUser);
      setReviews(mappedReviews);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const rating = useMemo(() => {
    if (user?.rating) return user.rating;
    if (!reviews.length) return 0;
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return avg;
  }, [reviews, user?.rating]);

  return { user, reviews, rating, loading };
}
