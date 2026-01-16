'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Clock } from 'lucide-react';

interface RateLimitErrorProps {
  retryAfter: number; // seconds
  onRetry?: () => void;
  message?: string;
}

/**
 * Rate Limit Error Component
 *
 * Displays a friendly error message when the user hits rate limits.
 * Shows a countdown timer and allows retry when the cooldown ends.
 */
export default function RateLimitError({
  retryAfter,
  onRetry,
  message = 'Ban da gui qua nhieu yeu cau',
}: RateLimitErrorProps) {
  const [countdown, setCountdown] = useState(retryAfter);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setCanRetry(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanRetry(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleRetry = () => {
    if (onRetry && canRetry) {
      setCanRetry(false);
      setCountdown(retryAfter);
      onRetry();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-800">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/50 mb-4">
        <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
      </div>

      <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
        Qua nhieu yeu cau
      </h3>

      <p className="text-center text-orange-700 dark:text-orange-300 mb-4">
        {message}
      </p>

      {!canRetry && countdown > 0 && (
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-4">
          <Clock className="w-5 h-5" />
          <span className="font-medium">
            Vui long thu lai sau {countdown} giay
          </span>
        </div>
      )}

      {canRetry && onRetry && (
        <button
          onClick={handleRetry}
          className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
        >
          Thu lai
        </button>
      )}

      <p className="text-sm text-orange-600/70 dark:text-orange-400/70 mt-4">
        De bao ve he thong, chung toi gioi han so luong yeu cau.
      </p>
    </div>
  );
}

/**
 * Inline rate limit warning for forms
 */
export function RateLimitWarning({
  retryAfter,
}: {
  retryAfter: number;
}) {
  const [countdown, setCountdown] = useState(retryAfter);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  if (countdown <= 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-sm">
      <Clock className="w-4 h-4 flex-shrink-0" />
      <span>Vui long cho {countdown} giay truoc khi thu lai</span>
    </div>
  );
}
