'use client';

import { cn, formatCurrency } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { Combo } from '@/types';
import { Check, UtensilsCrossed } from 'lucide-react';

interface ComboSelectorProps {
  combos: Combo[];
  selectedId?: string;
  onSelect: (combo: Combo) => void;
}

export default function ComboSelector({
  combos,
  selectedId,
  onSelect,
}: ComboSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {combos.map((combo) => {
        const isSelected = selectedId === combo.id;

        return (
          <motion.div
            key={combo.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => combo.isAvailable && onSelect(combo)}
            className={cn(
              'relative rounded-2xl border-2 p-4 cursor-pointer transition-colors',
              !combo.isAvailable && 'opacity-50 cursor-not-allowed',
              isSelected
                ? 'border-primary-500 bg-primary-50/50'
                : 'border-gray-100 bg-white hover:border-primary-200'
            )}
          >
            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            <div className="flex gap-4">
              {/* Combo Image */}
              {combo.imageUrl ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                  <img
                    src={combo.imageUrl}
                    alt={combo.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl flex-shrink-0 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                  <UtensilsCrossed className="w-8 h-8 text-primary-400" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
                  {combo.name}
                </h4>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                  {combo.description}
                </p>

                {/* Items list */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {combo.items.slice(0, 4).map((item, i) => (
                    <span
                      key={i}
                      className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-600 font-medium"
                    >
                      {item}
                    </span>
                  ))}
                  {combo.items.length > 4 && (
                    <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-400 font-medium">
                      +{combo.items.length - 4}
                    </span>
                  )}
                </div>

                {/* Price */}
                <p className="text-sm font-bold text-primary-600">
                  {formatCurrency(combo.price)}
                  <span className="text-xs font-normal text-gray-400 ml-1">
                    / 2 người
                  </span>
                </p>
              </div>
            </div>

            {!combo.isAvailable && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60">
                <span className="text-sm font-semibold text-gray-500">
                  Tạm hết
                </span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
