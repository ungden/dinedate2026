'use client';

import { motion } from '@/lib/motion';
import { Utensils, Coffee, Film, Plane } from 'lucide-react';
import { ActivityType } from '@/types';
import { cn } from '@/lib/utils';

interface ActivityFilterProps {
  selected?: ActivityType;
  onSelect: (activity?: ActivityType) => void;
}

const activities = [
  { type: 'dining' as ActivityType, label: 'Ăn uống', icon: Utensils, emoji: '🍽️', color: 'bg-orange-500' },
  { type: 'drinking' as ActivityType, label: 'Cafe/Bar', icon: Coffee, emoji: '☕', color: 'bg-amber-600' },
  { type: 'movies' as ActivityType, label: 'Xem phim', icon: Film, emoji: '🎬', color: 'bg-purple-500' },
  { type: 'travel' as ActivityType, label: 'Du lịch', icon: Plane, emoji: '✈️', color: 'bg-blue-500' },
];

export default function ActivityFilter({ selected, onSelect }: ActivityFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4">
      {/* All filter */}
      <motion.button
        onClick={() => onSelect(undefined)}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-colors',
          !selected
            ? 'bg-gray-900 text-white shadow-md'
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
        )}
        whileTap={{ scale: 0.95 }}
      >
        <span>🌟</span>
        <span>Tất cả</span>
      </motion.button>

      {activities.map((activity) => {
        const isSelected = selected === activity.type;
        const Icon = activity.icon;

        return (
          <motion.button
            key={activity.type}
            onClick={() => onSelect(isSelected ? undefined : activity.type)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all',
              isSelected
                ? `${activity.color} text-white shadow-md`
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}
            whileTap={{ scale: 0.95 }}
            layout
          >
            <span>{activity.emoji}</span>
            <span>{activity.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
