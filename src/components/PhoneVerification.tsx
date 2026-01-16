'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Phone, X, ShieldCheck, Loader2, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { PhoneVerificationStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PhoneVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: (phone: string) => void;
  initialPhone?: string;
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function PhoneVerification({
  isOpen,
  onClose,
  onVerified,
  initialPhone = '',
}: PhoneVerificationProps) {
  const { user, session, refreshProfile } = useAuth();
  const [phone, setPhone] = useState(initialPhone);
  const [otpCode, setOtpCode] = useState('');
  const [status, setStatus] = useState<PhoneVerificationStatus>('idle');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Phone validation (Vietnamese format)
  const isValidPhone = useCallback((phoneNumber: string): boolean => {
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    return phoneRegex.test(phoneNumber);
  }, []);

  // Format phone for display (0xxx xxx xxx)
  const formatPhoneDisplay = useCallback((phoneNumber: string): string => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    return phoneNumber;
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [countdown]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhone(initialPhone);
      setOtpCode('');
      setStatus('idle');
      setError(null);
    }
  }, [isOpen, initialPhone]);

  // Handle phone input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(value);
    setError(null);
  };

  // Handle OTP input change for individual digits
  const handleOtpDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = otpCode.split('');
    newOtp[index] = value.slice(-1); // Take only the last digit
    const newOtpString = newOtp.join('').slice(0, OTP_LENGTH);
    setOtpCode(newOtpString.padEnd(OTP_LENGTH, '').slice(0, OTP_LENGTH));

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtpCode(pastedData);

    // Focus the last filled input or the next empty one
    const focusIndex = Math.min(pastedData.length, OTP_LENGTH - 1);
    otpInputRefs.current[focusIndex]?.focus();
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (!isValidPhone(phone)) {
      setError('So dien thoai khong hop le (VD: 0912345678)');
      toast.error('So dien thoai khong hop le');
      return;
    }

    if (!session?.access_token) {
      toast.error('Vui long dang nhap');
      return;
    }

    setStatus('sending');
    setError(null);

    try {
      const response = await supabase.functions.invoke('send-otp', {
        body: { phone },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Khong gui duoc OTP');
      }

      const data = response.data;

      if (data.success) {
        setStatus('sent');
        setCountdown(RESEND_COOLDOWN);
        toast.success('Ma OTP da duoc gui!');

        // Auto focus first OTP input
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
      } else {
        throw new Error(data.message || 'Khong gui duoc OTP');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Khong gui duoc OTP');
      toast.error(err.message || 'Khong gui duoc OTP');
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (otpCode.length !== OTP_LENGTH) {
      setError('Vui long nhap day du 6 so');
      toast.error('Vui long nhap day du 6 so');
      return;
    }

    if (!session?.access_token) {
      toast.error('Vui long dang nhap');
      return;
    }

    setStatus('verifying');
    setError(null);

    try {
      const response = await supabase.functions.invoke('verify-otp', {
        body: { phone, otpCode },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Xac minh that bai');
      }

      const data = response.data;

      if (data.success && data.verified) {
        setStatus('verified');
        toast.success('Xac minh thanh cong!');

        // Refresh profile to get updated phone_verified status
        await refreshProfile();

        // Callback and close after delay
        setTimeout(() => {
          onVerified?.(phone);
          onClose();
        }, 1500);
      } else {
        throw new Error(data.message || 'Ma OTP khong dung');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Xac minh that bai');
      toast.error(err.message || 'Xac minh that bai');

      // Clear OTP on error
      setOtpCode('');
      otpInputRefs.current[0]?.focus();
    }
  };

  // Resend OTP
  const handleResend = () => {
    if (countdown > 0) return;
    setOtpCode('');
    handleSendOtp();
  };

  // Go back to phone input
  const handleBack = () => {
    setStatus('idle');
    setOtpCode('');
    setError(null);
  };

  const showOtpInput = status === 'sent' || status === 'verifying' || status === 'error';
  const showSuccess = status === 'verified';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                Xac minh so dien thoai
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {/* Success State */}
                {showSuccess && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                      className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </motion.div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Xac minh thanh cong!</h4>
                    <p className="text-sm text-gray-500">
                      So dien thoai {formatPhoneDisplay(phone)} da duoc xac minh.
                    </p>
                  </motion.div>
                )}

                {/* OTP Input State */}
                {showOtpInput && !showSuccess && (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Phone className="w-8 h-8 text-primary-600" />
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Ma OTP da duoc gui den so
                        <br />
                        <span className="font-bold text-gray-900">{formatPhoneDisplay(phone)}</span>
                      </p>
                    </div>

                    {/* OTP Input */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase text-center">
                        Nhap ma OTP
                      </label>
                      <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                        {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                          <motion.input
                            key={index}
                            ref={(el) => { otpInputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={otpCode[index] || ''}
                            onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              'w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all',
                              'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                              error
                                ? 'border-red-300 bg-red-50'
                                : otpCode[index]
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 bg-gray-50'
                            )}
                          />
                        ))}
                      </div>

                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 text-center mt-2"
                        >
                          {error}
                        </motion.p>
                      )}
                    </div>

                    {/* Resend & Timer */}
                    <div className="text-center">
                      {countdown > 0 ? (
                        <p className="text-sm text-gray-500">
                          Gui lai sau <span className="font-bold text-primary-600">{countdown}s</span>
                        </p>
                      ) : (
                        <button
                          onClick={handleResend}
                          className="text-sm text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1 mx-auto transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Gui lai ma OTP
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <button
                        onClick={handleVerifyOtp}
                        disabled={otpCode.length !== OTP_LENGTH || status === 'verifying'}
                        className={cn(
                          'w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all',
                          otpCode.length === OTP_LENGTH
                            ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/30'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        )}
                      >
                        {status === 'verifying' ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                        Xac nhan
                      </button>

                      <button
                        onClick={handleBack}
                        className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Doi so dien thoai khac
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Phone Input State */}
                {!showOtpInput && !showSuccess && (
                  <motion.div
                    key="phone"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Phone className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Xac minh so dien thoai de dam bao an toan va lien lac khi thuc hien giao dich.
                      </p>
                    </div>

                    {/* Phone Input */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase ml-1">
                        So dien thoai
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={phone}
                          onChange={handlePhoneChange}
                          placeholder="0912xxxxxx"
                          autoFocus
                          className={cn(
                            'w-full px-4 py-3.5 bg-gray-50 border-2 rounded-xl font-bold text-gray-900',
                            'focus:bg-white focus:ring-2 focus:ring-green-500/20 outline-none transition-all',
                            error ? 'border-red-300' : 'border-gray-200 focus:border-green-500'
                          )}
                        />
                        {phone && isValidPhone(phone) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          </motion.div>
                        )}
                      </div>

                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 ml-1"
                        >
                          {error}
                        </motion.p>
                      )}
                    </div>

                    {/* Send OTP Button */}
                    <button
                      onClick={handleSendOtp}
                      disabled={!isValidPhone(phone) || status === 'sending'}
                      className={cn(
                        'w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all',
                        isValidPhone(phone)
                          ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      {status === 'sending' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ArrowRight className="w-5 h-5" />
                      )}
                      Gui ma OTP
                    </button>

                    <p className="text-xs text-center text-gray-400">
                      Bang cach tiep tuc, ban dong y nhan tin nhan SMS xac minh.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
