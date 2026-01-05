'use client';

import { supabase } from '@/integrations/supabase/client';

function toError(err: unknown, fallback = 'Đã xảy ra lỗi') {
  if (err instanceof Error) return err;
  const anyErr = err as any;
  const msg = anyErr?.context?.body?.message || anyErr?.message || fallback;
  return new Error(String(msg));
}

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
    throw toError(error, 'Không thể tạo booking');
  }

  if (!data?.bookingId) {
    throw new Error('Missing bookingId from edge function');
  }

  return { bookingId: data.bookingId as string };
}

export async function completeBookingViaEdge(bookingId: string): Promise<boolean> {
  const { error } = await supabase.functions.invoke('complete-booking', {
    body: { bookingId },
  });

  if (error) {
    throw toError(error, 'Không thể hoàn thành đơn hàng');
  }

  return true;
}

export async function rejectBookingViaEdge(bookingId: string): Promise<boolean> {
  const { error } = await supabase.functions.invoke('reject-booking', {
    body: { bookingId },
  });

  if (error) {
    throw toError(error, 'Không thể hủy đơn hàng');
  }

  return true;
}