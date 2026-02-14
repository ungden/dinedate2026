'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cancelDateOrderViaEdge } from '@/lib/booking';
import toast from 'react-hot-toast';

type DbDateOrderRow = Record<string, any>;

function toError(err: unknown, fallback = 'Da xay ra loi'): Error {
  if (err instanceof Error) return err;
  const anyErr = err as any;
  const msg = anyErr?.message || anyErr?.error_description || anyErr?.hint || fallback;
  return new Error(String(msg));
}

export function useDbBookings() {
  const { user } = useAuth();
  const userId = user?.id;

  const [created, setCreated] = useState<DbDateOrderRow[]>([]);
  const [applied, setApplied] = useState<DbDateOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!userId) return;

    setLoading(true);

    try {
      // Orders I created
      const { data: createdData, error: createdErr } = await supabase
        .from('date_orders')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (createdErr) {
        console.error('[useDbBookings] Error fetching created orders:', createdErr);
        setCreated([]);
      } else {
        setCreated(createdData || []);
      }

      // Orders where I was matched
      const { data: matchedData, error: matchedErr } = await supabase
        .from('date_orders')
        .select('*')
        .eq('matched_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (matchedErr) {
        console.error('[useDbBookings] Error fetching matched orders:', matchedErr);
        setApplied([]);
      } else {
        setApplied(matchedData || []);
      }
    } catch (err) {
      console.error('[useDbBookings] Unexpected error:', err);
      setCreated([]);
      setApplied([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      setCreated([]);
      setApplied([]);
      setLoading(false);
      return;
    }
    reload();
  }, [userId]);

  // Cancel a date order (only creator can cancel)
  const cancel = async (dateOrderId: string) => {
    if (!userId) return;

    try {
      await cancelDateOrderViaEdge(dateOrderId);
      await reload();
    } catch (err: unknown) {
      console.error("Cancel error:", err);
      throw toError(err, 'Khong the huy don hen');
    }
  };

  return { created, applied, loading, reload, cancel };
}
