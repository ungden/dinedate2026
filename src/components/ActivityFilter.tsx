'use client';

import { memo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { CuisineType, CUISINE_LABELS, CUISINE_ICONS } from '@/types';
import { cn } from '@/lib/utils';

interface CuisineFilterProps {
  selected?: CuisineType;
  onSelect: (cuisine?: CuisineType) => void;
}

const cuisines: { type: CuisineType; label: string; emoji: string }[] = [
  { type: 'vietnamese', label: CUISINE_LABELS.vietnamese, emoji: CUISINE_ICONS.vietnamese },
  { type: 'japanese', label: CUISINE_LABELS.japanese, emoji: CUISINE_ICONS.japanese },
  { type: 'korean', label: CUISINE_LABELS.korean, emoji: CUISINE_ICONS.korean },
  { type: 'bbq', label: CUISINE_LABELS.bbq, emoji: CUISINE_ICONS.bbq },
  { type: 'hotpot', label: CUISINE_LABELS.hotpot, emoji: CUISINE_ICONS.hotpot },
  { type: 'seafood', label: CUISINE_LABELS.seafood, emoji: CUISINE_ICONS.seafood },
  { type: 'italian', label: CUISINE_LABELS.italian, emoji: CUISINE_ICONS.italian },
];

function CuisineFilter({ selected, onSelect }: CuisineFilterProps) {
  const handleAllClick = useCallback(() => onSelect(undefined), [onSelect]);
  const handleCuisineClick = useCallback((type: CuisineType, isSelected: boolean) => {
    onSelect(isSelected ? undefined : type);
  }, [onSelect]);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar px-4 sm:px-0">
      {/* All filter */}
      <motion.button
        onClick={handleAllClick}
        className={cn(
          'flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all duration-300 text-sm',
          !selected
            ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-105'
            : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 hover:border-gray-200'
        )}
        whileTap={{ scale: 0.95 }}
      >
        <span>🌟</span>
        <span>Tất cả</span>
      </motion.button>

      {cuisines.map((cuisine) => {
        const isSelected = selected === cuisine.type;

        return (
          <motion.button
            key={cuisine.type}
            onClick={() => handleCuisineClick(cuisine.type, isSelected)}
            className={cn(
              'flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all duration-300 text-sm',
              isSelected
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 hover:border-gray-200'
            )}
            whileTap={{ scale: 0.95 }}
          >
            <span>{cuisine.emoji}</span>
            <span>{cuisine.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export default memo(CuisineFilter);
