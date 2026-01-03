'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type DbBookingRow = Record<string, any>;

export function useDbBookings() {
  const { user } = useAuth();
  const userId = user?.id;

  const [sent, setSent] = useState<DbBookingRow[]>([]);
  const [received, setReceived] = useState<DbBookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!userId) return;

    setLoading(true);

    const { data: sentData, error: sentErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (sentErr) throw sentErr;

    const { data: receivedData, error: receivedErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('partner_id', userId)
      .order('created_at', { ascending: false });

    if (receivedErr) throw receivedErr;

    setSent(sentData || []);
    setReceived(receivedData || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) {
      setSent([]);
      setReceived([]);
      setLoading(false);
      return;
    }
    reload();
  }, [userId]);

  const accept = async (bookingId: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', bookingId);

    if (error) throw error;

    await reload();
  };

  const reject = async (bookingId: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'rejected' })
      .eq('id', bookingId);

    if (error) throw error;

    await reload();
  };

  return { sent, received, loading, reload, accept, reject };
}