'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PhoneVerificationStatus, SendOtpResponse, VerifyOtpResponse } from '@/types';
import toast from 'react-hot-toast';

interface UsePhoneVerificationReturn {
  status: PhoneVerificationStatus;
  isVerified: boolean;
  error: string | null;
  sendOtp: (phone: string) => Promise<SendOtpResponse>;
  verifyOtp: (phone: string, otpCode: string) => Promise<VerifyOtpResponse>;
  reset: () => void;
}

// Validate Vietnamese phone number
function isValidVnPhone(phone: string): boolean {
  const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
  return phoneRegex.test(phone);
}

// Normalize phone number to standard format (0xxxxxxxxx)
function normalizePhone(phone: string): string {
  let normalized = phone.replace(/\D/g, '');

  // Convert 84xxxxxxxxx to 0xxxxxxxxx
  if (normalized.startsWith('84') && normalized.length === 11) {
    normalized = '0' + normalized.slice(2);
  }

  return normalized;
}

export function usePhoneVerification(): UsePhoneVerificationReturn {
  const { session, refreshProfile } = useAuth();
  const [status, setStatus] = useState<PhoneVerificationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setIsVerified(false);
  }, []);

  const sendOtp = useCallback(async (phone: string): Promise<SendOtpResponse> => {
    const normalizedPhone = normalizePhone(phone);

    if (!isValidVnPhone(normalizedPhone)) {
      const errorMsg = 'So dien thoai khong hop le (VD: 0912345678)';
      setError(errorMsg);
      setStatus('error');
      return { success: false, message: errorMsg };
    }

    if (!session?.access_token) {
      const errorMsg = 'Vui long dang nhap';
      setError(errorMsg);
      setStatus('error');
      return { success: false, message: errorMsg };
    }

    setStatus('sending');
    setError(null);

    try {
      const response = await supabase.functions.invoke('send-otp', {
        body: { phone: normalizedPhone },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Khong gui duoc OTP');
      }

      const data = response.data as SendOtpResponse;

      if (data.success) {
        setStatus('sent');
        return data;
      } else {
        throw new Error(data.message || 'Khong gui duoc OTP');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Khong gui duoc OTP';
      setStatus('error');
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }
  }, [session?.access_token]);

  const verifyOtp = useCallback(async (phone: string, otpCode: string): Promise<VerifyOtpResponse> => {
    const normalizedPhone = normalizePhone(phone);

    if (otpCode.length !== 6) {
      const errorMsg = 'Vui long nhap day du 6 so';
      setError(errorMsg);
      setStatus('error');
      return { success: false, message: errorMsg, verified: false };
    }

    if (!session?.access_token) {
      const errorMsg = 'Vui long dang nhap';
      setError(errorMsg);
      setStatus('error');
      return { success: false, message: errorMsg, verified: false };
    }

    setStatus('verifying');
    setError(null);

    try {
      const response = await supabase.functions.invoke('verify-otp', {
        body: { phone: normalizedPhone, otpCode },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Xac minh that bai');
      }

      const data = response.data as VerifyOtpResponse;

      if (data.success && data.verified) {
        setStatus('verified');
        setIsVerified(true);

        // Refresh user profile to get updated phone_verified status
        await refreshProfile();

        return data;
      } else {
        throw new Error(data.message || 'Ma OTP khong dung');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Xac minh that bai';
      setStatus('error');
      setError(errorMsg);
      return { success: false, message: errorMsg, verified: false };
    }
  }, [session?.access_token, refreshProfile]);

  return {
    status,
    isVerified,
    error,
    sendOtp,
    verifyOtp,
    reset,
  };
}

// Utility hook to check if user's phone is verified
export function usePhoneVerifiedStatus() {
  const { user } = useAuth();

  // Check if user has a verified phone
  const phone = user?.phone;
  const isPhoneVerified = !!user?.phoneVerified;

  return {
    phone,
    isPhoneVerified,
    needsVerification: !!phone && !isPhoneVerified,
    hasNoPhone: !phone,
  };
}
