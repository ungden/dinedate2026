'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Review, ServiceOffering, User } from '@/types';
import { mapDbUserToUser } from '@/lib/user-mapper';

type DbServiceRow = {
  id: string;
  user_id: string;
  activity: string;
  title: string;
  description: string;
  price: number;
  available: boolean;
  duration?: string;
};

function mapDbServiceToService(row: DbServiceRow): ServiceOffering {
  return {
    id: row.id,
    activity: row.activity as any,
    title: row.title,
    description: row.description ?? '',
    price: Number(row.price ?? 0),
    available: !!row.available,
    duration: (row.duration as any) === 'day' ? 'day' : 'session',
  };
}

function isUUID(str: string) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(str);
}

export function useDbUserProfile(slug?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
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
      const userId = mappedUser.id; // Get actual UUID for subsequent queries

      const { data: servicesRows, error: servicesErr } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (servicesErr) console.error(servicesErr);

      const mappedServices = (servicesRows || []).map((r: any) => mapDbServiceToService(r as DbServiceRow));

      const { data: reviewRows, error: reviewErr } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false });

      if (reviewErr) console.error(reviewErr);

      // For now: reviewer object isn't joined; keep minimal mapping
      const mappedReviews: Review[] = (reviewRows || []).map((r: any) => ({
        id: r.id,
        userId: r.reviewee_id,
        reviewerId: r.reviewer_id,
        revieweeId: r.reviewee_id,
        reviewer: {
          id: r.reviewer_id,
          name: 'Người dùng',
          age: 25,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.reviewer_id}`,
          bio: '',
          location: 'Việt Nam',
          wallet: { balance: 0, escrowBalance: 0, currency: 'VND' },
          vipStatus: { tier: 'free', benefits: [] },
        },
        rating: r.rating,
        comment: r.comment ?? '',
        createdAt: r.created_at,
      }));

      if (cancelled) return;

      setUser({ ...mappedUser, services: mappedServices });
      setServices(mappedServices);
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

  return { user, services, reviews, rating, loading };
}