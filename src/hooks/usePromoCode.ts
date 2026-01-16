'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PromoValidationResult {
  valid: boolean;
  error?: string;
  promoCodeId?: string;
  code?: string;
  description?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount?: number; // Calculated discount for the order
  finalAmount?: number; // Amount after discount
}

export function usePromoCode() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoValidationResult | null>(null);

  /**
   * Validate a promo code for the current user and order amount
   */
  const validatePromoCode = useCallback(async (
    code: string,
    orderAmount: number
  ): Promise<PromoValidationResult> => {
    if (!user) {
      return { valid: false, error: 'Vui long dang nhap de su dung ma giam gia' };
    }

    if (!code || code.trim() === '') {
      return { valid: false, error: 'Vui long nhap ma giam gia' };
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-promo', {
        body: {
          code: code.trim().toUpperCase(),
          orderAmount
        },
      });

      if (error) {
        console.error('Promo validation error:', error);
        return { valid: false, error: 'Khong the kiem tra ma giam gia. Vui long thu lai.' };
      }

      if (data?.error) {
        return { valid: false, error: data.error };
      }

      if (data?.valid) {
        const result: PromoValidationResult = {
          valid: true,
          promoCodeId: data.promoCodeId,
          code: data.code,
          description: data.description,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountAmount: data.discountAmount,
          finalAmount: data.finalAmount,
        };
        setAppliedPromo(result);
        return result;
      }

      return { valid: false, error: 'Ma giam gia khong hop le' };
    } catch (err) {
      console.error('Promo validation error:', err);
      return { valid: false, error: 'Loi kiem tra ma giam gia' };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Calculate discount for a given promo code and order amount (local calculation)
   */
  const applyPromoCode = useCallback((
    promoCodeId: string,
    discountType: 'percentage' | 'fixed',
    discountValue: number,
    orderAmount: number,
    maxDiscountAmount?: number
  ): { discountAmount: number; finalAmount: number } => {
    let discountAmount = 0;

    if (discountType === 'percentage') {
      discountAmount = Math.round((orderAmount * discountValue) / 100);
      // Apply max discount cap if set
      if (maxDiscountAmount && maxDiscountAmount > 0 && discountAmount > maxDiscountAmount) {
        discountAmount = maxDiscountAmount;
      }
    } else {
      // Fixed discount
      discountAmount = discountValue;
    }

    // Ensure discount doesn't exceed order amount
    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }

    return {
      discountAmount,
      finalAmount: orderAmount - discountAmount,
    };
  }, []);

  /**
   * Record promo code usage (called after successful booking)
   * This is handled by the create-booking edge function, but can be called separately if needed
   */
  const recordPromoUsage = useCallback(async (
    promoCodeId: string,
    bookingId: string,
    discountAmount: number
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('promo_code_usages')
        .insert({
          promo_code_id: promoCodeId,
          user_id: user.id,
          booking_id: bookingId,
          discount_amount: discountAmount,
        });

      if (error) {
        console.error('Record promo usage error:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Record promo usage error:', err);
      return false;
    }
  }, [user]);

  /**
   * Clear applied promo code
   */
  const clearPromo = useCallback(() => {
    setAppliedPromo(null);
  }, []);

  return {
    loading,
    appliedPromo,
    validatePromoCode,
    applyPromoCode,
    recordPromoUsage,
    clearPromo,
    setAppliedPromo,
  };
}
