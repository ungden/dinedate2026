'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateOrderApplication, Gender } from '@/types';

// ----------------------------------------------------------------
// Mapper
// ----------------------------------------------------------------

function mapDbRowToApplication(row: any): DateOrderApplication {
  return {
    id: row.id,
    orderId: row.order_id,
    applicantId: row.applicant_id,
    applicant: row.applicant
      ? {
          id: row.applicant.id,
          name: row.applicant.name || row.applicant.username || '',
          username: row.applicant.username,
          age: row.applicant.age || 0,
          avatar: row.applicant.avatar || '',
          bio: row.applicant.bio || '',
          location: row.applicant.location || '',
          wallet: row.applicant.wallet || { balance: 0, escrowBalance: 0, currency: 'VND' },
          vipStatus: row.applicant.vip_status || { tier: 'free', benefits: [] },
          gender: row.applicant.gender as Gender | undefined,
          rating: row.applicant.rating != null ? Number(row.applicant.rating) : undefined,
          reviewCount: row.applicant.review_count != null ? Number(row.applicant.review_count) : undefined,
          zodiac: row.applicant.zodiac,
          personalityTags: row.applicant.personality_tags,
          foodPreferences: row.applicant.food_preferences,
          occupation: row.applicant.occupation,
        } as any
      : undefined,
    message: row.message || '',
    status: row.status as 'pending' | 'accepted' | 'rejected',
    createdAt: row.created_at,
  };
}

const APPLICATION_SELECT = `
  *,
  applicant:users!date_order_applications_applicant_id_fkey(*)
`;

// ----------------------------------------------------------------
// Hooks
// ----------------------------------------------------------------

export function useApplicationsForOrder(orderId: string) {
  const [applications, setApplications] = useState<DateOrderApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!orderId) {
      setApplications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('date_order_applications')
        .select(APPLICATION_SELECT)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Error fetching applications:', JSON.stringify(dbError, null, 2));
        setError(dbError.message);
        return;
      }

      setApplications((data || []).map(mapDbRowToApplication));
    } catch (err: any) {
      console.error('Exception fetching applications:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchApplications();

    const channel = supabase
      .channel(`applications:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'date_order_applications',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchApplications, orderId]);

  return { applications, loading, error, refetch: fetchApplications };
}

export function useMyApplications(userId: string) {
  const [applications, setApplications] = useState<DateOrderApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyApplications = useCallback(async () => {
    if (!userId) {
      setApplications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('date_order_applications')
        .select(APPLICATION_SELECT)
        .eq('applicant_id', userId)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Error fetching my applications:', JSON.stringify(dbError, null, 2));
        setError(dbError.message);
        return;
      }

      setApplications((data || []).map(mapDbRowToApplication));
    } catch (err: any) {
      console.error('Exception fetching my applications:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMyApplications();
  }, [fetchMyApplications]);

  return { applications, loading, error, refetch: fetchMyApplications };
}

export function useApplyToOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyToOrder = useCallback(
    async (params: {
      orderId: string;
      applicantId: string;
      message: string;
    }): Promise<DateOrderApplication | null> => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: dbError } = await supabase
          .from('date_order_applications')
          .insert({
            order_id: params.orderId,
            applicant_id: params.applicantId,
            message: params.message,
            status: 'pending',
          })
          .select()
          .single();

        if (dbError) {
          console.error('Error applying to order:', JSON.stringify(dbError, null, 2));
          setError(dbError.message);
          return null;
        }

        // Increment applicant count on the date order
        await supabase.rpc('increment_applicant_count', {
          order_id: params.orderId,
        }).then(({ error: rpcError }) => {
          if (rpcError) {
            console.error('Error incrementing applicant count:', rpcError.message);
          }
        });

        return data ? mapDbRowToApplication(data) : null;
      } catch (err: any) {
        console.error('Exception applying to order:', err);
        setError(err.message || 'Unknown error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { applyToOrder, loading, error };
}

export function useAcceptApplication() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptApplication = useCallback(
    async (params: {
      applicationId: string;
      orderId: string;
      applicantId: string;
      restaurantId: string;
      dateTime: string;
    }): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        // 1. Update the accepted application status
        const { error: appError } = await supabase
          .from('date_order_applications')
          .update({ status: 'accepted' })
          .eq('id', params.applicationId);

        if (appError) {
          console.error('Error accepting application:', JSON.stringify(appError, null, 2));
          setError(appError.message);
          return false;
        }

        // 2. Reject all other pending applications for this order
        await supabase
          .from('date_order_applications')
          .update({ status: 'rejected' })
          .eq('order_id', params.orderId)
          .neq('id', params.applicationId)
          .eq('status', 'pending');

        // 3. Update the date order with matched user
        const { error: orderError } = await supabase
          .from('date_orders')
          .update({
            status: 'matched',
            matched_user_id: params.applicantId,
            matched_at: new Date().toISOString(),
          })
          .eq('id', params.orderId);

        if (orderError) {
          console.error('Error updating date order:', JSON.stringify(orderError, null, 2));
          setError(orderError.message);
          return false;
        }

        // 4. Create a table booking
        const { error: bookingError } = await supabase
          .from('table_bookings')
          .insert({
            date_order_id: params.orderId,
            restaurant_id: params.restaurantId,
            date_time: params.dateTime,
            party_size: 2,
            status: 'pending',
          });

        if (bookingError) {
          console.error('Error creating table booking:', JSON.stringify(bookingError, null, 2));
          // Non-fatal: the match still happened
        }

        return true;
      } catch (err: any) {
        console.error('Exception accepting application:', err);
        setError(err.message || 'Unknown error');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { acceptApplication, loading, error };
}
