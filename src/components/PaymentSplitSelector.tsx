'use client';

import { cn, formatCurrency } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { PaymentSplit } from '@/types';
import { Handshake, Gift, Heart } from 'lucide-react';

interface PaymentSplitSelectorProps {
  value: PaymentSplit;
  onChange: (value: PaymentSplit) => void;
  comboPrice: number;
}

interface SplitOption {
  value: PaymentSplit;
  label: string;
  description: string;
  icon: React.ReactNode;
  getAmount: (price: number) => string;
}

const options: SplitOption[] = [
  {
    value: 'split',
    label: 'Chia đôi',
    description: 'Mỗi người trả một nửa combo',
    icon: <Handshake className="w-5 h-5" />,
    getAmount: (price) => `mỗi người ${formatCurrency(Math.ceil(price / 2))}`,
  },
  {
    value: 'creator_pays',
    label: 'Mình mời',
    description: 'Mình trả full combo',
    icon: <Gift className="w-5 h-5" />,
    getAmount: (price) => `bạn trả ${formatCurrency(price)}`,
  },
  {
    value: 'applicant_pays',
    label: 'Người join mời',
    description: 'Người join trả full combo',
    icon: <Heart className="w-5 h-5" />,
    getAmount: (price) => `đối phương trả ${formatCurrency(price)}`,
  },
];

export default function PaymentSplitSelector({
  value,
  onChange,
  comboPrice,
}: PaymentSplitSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <motion.button
            key={option.value}
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors',
              isSelected
                ? 'border-primary-500 bg-primary-50/50'
                : 'border-gray-100 bg-white hover:border-primary-200'
            )}
          >
            {/* Radio circle */}
            <div
              className={cn(
                'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                isSelected
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              )}
            >
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>

            {/* Icon */}
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                isSelected
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-gray-100 text-gray-400'
              )}
            >
              {option.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'font-semibold text-sm',
                  isSelected ? 'text-primary-700' : 'text-gray-800'
                )}
              >
                {option.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {option.description}
              </p>
              <p
                className={cn(
                  'text-xs font-semibold mt-1',
                  isSelected ? 'text-primary-600' : 'text-gray-400'
                )}
              >
                {option.getAmount(comboPrice)}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
