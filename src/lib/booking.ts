'use client';

import { supabase } from '@/integrations/supabase/client';

export async function createBookingViaEdge(params: {
  providerId: string;
  serviceId: string;
  date: string;
  time: string;
  location: string;
  message?: string;
  durationHours: number;
}): Promise<{ bookingId: string }> {
  const { data, error } = await supabase.functions.invoke('create-booking', {
    body: params,
  });

  if (error) {
    // Pass through; app will show UI error
    throw error;
  }

  if (!data?.bookingId) {
    throw new Error('Missing bookingId from edge function');
  }

  return { bookingId: data.bookingId as string };
}