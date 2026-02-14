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

export async function createDateOrderViaEdge(params: {
  restaurantId: string;
  comboId: string;
  dateTime: string;
  description: string;
  preferredGender?: string;
  paymentSplit: string;
}): Promise<{ dateOrderId: string }> {
  addBreadcrumb('date-order', 'Creating date order', {
    restaurantId: params.restaurantId,
    comboId: params.comboId,
  });

  const { data, error } = await supabase.functions.invoke('create-date-order', {
    body: params,
  });

  if (error) {
    const err = toError(error, 'Không thể tạo đơn hẹn');
    await captureException(err, {
      component: 'date-order',
      action: 'createDateOrderViaEdge',
      extra: { restaurantId: params.restaurantId, comboId: params.comboId },
    });
    throw err;
  }

  if (!data?.dateOrderId) {
    const err = new Error('Missing dateOrderId from edge function');
    await captureException(err, {
      component: 'date-order',
      action: 'createDateOrderViaEdge',
      extra: { restaurantId: params.restaurantId, response: data },
    });
    throw err;
  }

  addBreadcrumb('date-order', 'Date order created', { dateOrderId: data.dateOrderId });

  return {
    dateOrderId: data.dateOrderId as string,
  };
}

export async function completeDateOrderViaEdge(dateOrderId: string): Promise<boolean> {
  addBreadcrumb('date-order', 'Completing date order', { dateOrderId });

  const { error } = await supabase.functions.invoke('complete-date-order', {
    body: { dateOrderId },
  });

  if (error) {
    const err = toError(error, 'Không thể hoàn thành đơn hẹn');
    await captureException(err, {
      component: 'date-order',
      action: 'completeDateOrderViaEdge',
      extra: { dateOrderId },
    });
    throw err;
  }

  addBreadcrumb('date-order', 'Date order completed', { dateOrderId });
  return true;
}

export async function cancelDateOrderViaEdge(dateOrderId: string): Promise<boolean> {
  addBreadcrumb('date-order', 'Cancelling date order', { dateOrderId });

  const { error } = await supabase.functions.invoke('cancel-date-order', {
    body: { dateOrderId },
  });

  if (error) {
    const err = toError(error, 'Không thể hủy đơn hẹn');
    await captureException(err, {
      component: 'date-order',
      action: 'cancelDateOrderViaEdge',
      extra: { dateOrderId },
    });
    throw err;
  }

  addBreadcrumb('date-order', 'Date order cancelled', { dateOrderId });
  return true;
}

export async function createDisputeViaEdge(params: {
  dateOrderId: string;
  reason: string;
  description: string;
  evidenceUrls?: string[];
}): Promise<{ disputeId: string }> {
  addBreadcrumb('date-order', 'Creating dispute', { dateOrderId: params.dateOrderId, reason: params.reason });

  const { data, error } = await supabase.functions.invoke('create-dispute', {
    body: params,
  });

  if (error) {
    const err = toError(error, 'Không thể tạo khiếu nại');
    await captureException(err, {
      component: 'date-order',
      action: 'createDisputeViaEdge',
      extra: { dateOrderId: params.dateOrderId, reason: params.reason },
    });
    throw err;
  }

  if (!data?.disputeId) {
    const err = new Error('Missing disputeId from edge function');
    await captureException(err, {
      component: 'date-order',
      action: 'createDisputeViaEdge',
      extra: { dateOrderId: params.dateOrderId, response: data },
    });
    throw err;
  }

  addBreadcrumb('date-order', 'Dispute created', { disputeId: data.disputeId });
  return { disputeId: data.disputeId as string };
}
