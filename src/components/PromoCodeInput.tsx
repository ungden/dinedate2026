'use client';

import { useState } from 'react';
import { Ticket, Check, X, Loader2, Tag, Percent, Sparkles } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { PromoValidationResult } from '@/hooks/usePromoCode';

interface PromoCodeInputProps {
  orderAmount: number;
  onValidate: (code: string, amount: number) => Promise<PromoValidationResult>;
  onApply: (result: PromoValidationResult) => void;
  onClear: () => void;
  appliedPromo: PromoValidationResult | null;
  loading?: boolean;
  className?: string;
}

export default function PromoCodeInput({
  orderAmount,
  onValidate,
  onApply,
  onClear,
  appliedPromo,
  loading = false,
  className,
}: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Vui long nhap ma giam gia');
      return;
    }

    setIsValidating(true);
    setError(null);

    const result = await onValidate(code.trim().toUpperCase(), orderAmount);

    if (result.valid) {
      onApply(result);
      setCode('');
      setError(null);
    } else {
      setError(result.error || 'Ma giam gia khong hop le');
    }

    setIsValidating(false);
  };

  const handleClear = () => {
    onClear();
    setCode('');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  // Applied promo display
  if (appliedPromo && appliedPromo.valid) {
    return (
      <div className={cn('rounded-2xl overflow-hidden', className)}>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 rounded-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-green-800 bg-green-100 px-2.5 py-1 rounded-lg text-sm">
                    {appliedPromo.code}
                  </span>
                  {appliedPromo.discountType === 'percentage' ? (
                    <span className="text-xs text-green-700 flex items-center gap-1 bg-green-100/50 px-2 py-0.5 rounded-full">
                      <Percent className="w-3 h-3" />
                      -{appliedPromo.discountValue}%
                    </span>
                  ) : (
                    <span className="text-xs text-green-700 flex items-center gap-1 bg-green-100/50 px-2 py-0.5 rounded-full">
                      <Tag className="w-3 h-3" />
                      -{formatCurrency(appliedPromo.discountValue || 0)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-green-700 mt-1">{appliedPromo.description}</p>
                <p className="text-lg font-black text-green-800 mt-2">
                  Giam: -{formatCurrency(appliedPromo.discountAmount || 0)}
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="p-2 hover:bg-green-100 rounded-xl transition text-green-600"
              title="Huy ma giam gia"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
        <Sparkles className="w-4 h-4 text-primary-500" />
        Ma giam gia
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Nhap ma giam gia..."
            disabled={isValidating || loading}
            className={cn(
              'w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl outline-none transition font-medium uppercase tracking-wide',
              error
                ? 'border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
              (isValidating || loading) && 'opacity-50 cursor-not-allowed'
            )}
          />
        </div>
        <button
          onClick={handleApply}
          disabled={isValidating || loading || !code.trim()}
          className={cn(
            'px-5 py-3 rounded-xl font-bold text-sm transition flex items-center gap-2 whitespace-nowrap',
            isValidating || loading || !code.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/20'
          )}
        >
          {isValidating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Dang kiem tra...
            </>
          ) : (
            'Ap dung'
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
          <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Hint for new users */}
      <p className="text-xs text-gray-500 flex items-center gap-1.5">
        <Tag className="w-3 h-3" />
        Ban moi? Thu ma <span className="font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">NEWUSER</span> de giam 20%!
      </p>
    </div>
  );
}
