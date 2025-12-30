'use client';

import { motion } from '@/lib/motion';
import { ActivityType } from '@/types';
import { cn } from '@/lib/utils';

interface ActivityFilterProps {
  selected?: ActivityType;
  onSelect: (activity?: ActivityType) => void;
}

const activities = [
  { type: 'dining' as ActivityType, label: 'Ăn tối', emoji: '🍽️' },
  { type: 'drinking' as ActivityType, label: 'Cafe/Bar', emoji: '🍸' },
  { type: 'movies' as ActivityType, label: 'Xem phim', emoji: '🍿' },
  { type: 'travel' as ActivityType, label: 'Du lịch', emoji: '✈️' },
  { type: 'karaoke' as ActivityType, label: 'Karaoke', emoji: '🎤' },
];

export default function ActivityFilter({ selected, onSelect }: ActivityFilterProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar px-4 sm:px-0">
      {/* All filter */}
      <motion.button
        onClick={() => onSelect(undefined)}
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

      {activities.map((activity) => {
        const isSelected = selected === activity.type;

        return (
          <motion.button
            key={activity.type}
            onClick={() => onSelect(isSelected ? undefined : activity.type)}
            className={cn(
              'flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all duration-300 text-sm',
              isSelected
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 hover:border-gray-200'
            )}
            whileTap={{ scale: 0.95 }}
          >
            <span>{activity.emoji}</span>
            <span>{activity.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}