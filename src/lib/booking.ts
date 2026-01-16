'use client';

import { supabase } from '@/integrations/supabase/client';
import {
  isSupabaseRateLimitError,
  handleRateLimitError,
  RateLimitError,
} from './api-utils';
import { captureException, addBreadcrumb } from './error-tracking';

function toError(err: unknown, fallback = 'Da xay ra loi') {
  // Check for rate limit error first
  if (isSupabaseRateLimitError(err)) {
    const anyErr = err as any;
    const retryAfter = anyErr?.context?.body?.retryAfter || 60;
    handleRateLimitError({ retryAfter });
    return new RateLimitError(retryAfter);
  }

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
  promoCodeId?: string;
}): Promise<{ bookingId: string; promoDiscount?: number }> {
  addBreadcrumb('booking', 'Creating booking', {
    providerId: params.providerId,
    serviceId: params.serviceId,
  });

  const { data, error } = await supabase.functions.invoke('create-booking', {
    body: params,
  });

  if (error) {
    const err = toError(error, 'Không thể tạo booking');
    await captureException(err, {
      component: 'booking',
      action: 'createBookingViaEdge',
      extra: { providerId: params.providerId, serviceId: params.serviceId },
    });
    throw err;
  }

  if (!data?.bookingId) {
    const err = new Error('Missing bookingId from edge function');
    await captureException(err, {
      component: 'booking',
      action: 'createBookingViaEdge',
      extra: { providerId: params.providerId, response: data },
    });
    throw err;
  }

  addBreadcrumb('booking', 'Booking created', { bookingId: data.bookingId });

  return {
    bookingId: data.bookingId as string,
    promoDiscount: data.promoDiscount as number | undefined
  };
}

export async function completeBookingViaEdge(bookingId: string): Promise<boolean> {
  addBreadcrumb('booking', 'Completing booking', { bookingId });

  const { error } = await supabase.functions.invoke('complete-booking', {
    body: { bookingId },
  });

  if (error) {
    const err = toError(error, 'Không thể hoàn thành đơn hàng');
    await captureException(err, {
      component: 'booking',
      action: 'completeBookingViaEdge',
      extra: { bookingId },
    });
    throw err;
  }

  addBreadcrumb('booking', 'Booking completed', { bookingId });
  return true;
}

export async function rejectBookingViaEdge(bookingId: string): Promise<boolean> {
  addBreadcrumb('booking', 'Rejecting booking', { bookingId });

  const { error } = await supabase.functions.invoke('reject-booking', {
    body: { bookingId },
  });

  if (error) {
    const err = toError(error, 'Không thể hủy đơn hàng');
    await captureException(err, {
      component: 'booking',
      action: 'rejectBookingViaEdge',
      extra: { bookingId },
    });
    throw err;
  }

  addBreadcrumb('booking', 'Booking rejected', { bookingId });
  return true;
}

export async function createDisputeViaEdge(params: {
  bookingId: string;
  reason: string;
  description: string;
  evidenceUrls?: string[];
}): Promise<{ disputeId: string }> {
  addBreadcrumb('booking', 'Creating dispute', { bookingId: params.bookingId, reason: params.reason });

  const { data, error } = await supabase.functions.invoke('create-dispute', {
    body: params,
  });

  if (error) {
    const err = toError(error, 'Không thể tạo khiếu nại');
    await captureException(err, {
      component: 'booking',
      action: 'createDisputeViaEdge',
      extra: { bookingId: params.bookingId, reason: params.reason },
    });
    throw err;
  }

  if (!data?.disputeId) {
    const err = new Error('Missing disputeId from edge function');
    await captureException(err, {
      component: 'booking',
      action: 'createDisputeViaEdge',
      extra: { bookingId: params.bookingId, response: data },
    });
    throw err;
  }

  addBreadcrumb('booking', 'Dispute created', { disputeId: data.disputeId });
  return { disputeId: data.disputeId as string };
}