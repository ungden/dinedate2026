'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
    Coffee,
    Film,
    Wine,
    Mic2,
    Plane,
    Utensils,
    Clock,
    Zap,
    Moon,
    X
} from 'lucide-react';
import { ActivityType } from '@/types';
import { cn } from '@/lib/utils';

interface SmartFilterProps {
    selectedActivities: ActivityType[];
    onActivitiesChange: (activities: ActivityType[]) => void;
    availableNow: boolean;
    onAvailableNowChange: (value: boolean) => void;
    availableTonight: boolean;
    onAvailableTonightChange: (value: boolean) => void;
    onClear: () => void;
    className?: string;
}

const ACTIVITY_OPTIONS: { value: ActivityType; label: string; icon: React.ElementType; emoji: string }[] = [
    { value: 'cafe', label: 'Cafe', icon: Coffee, emoji: '☕' },
    { value: 'movies', label: 'Xem phim', icon: Film, emoji: '🎬' },
    { value: 'drinking', label: 'Nhậu/Ăn uống', icon: Wine, emoji: '🍻' },
    { value: 'karaoke', label: 'Karaoke', icon: Mic2, emoji: '🎤' },
    { value: 'tour_guide', label: 'Tour guide', icon: Plane, emoji: '✈️' },
    { value: 'dining', label: 'Ăn tối', icon: Utensils, emoji: '🍽️' },
];

export default function SmartFilter({
    selectedActivities,
    onActivitiesChange,
    availableNow,
    onAvailableNowChange,
    availableTonight,
    onAvailableTonightChange,
    onClear,
    className
}: SmartFilterProps) {
    const hasFilters = selectedActivities.length > 0 || availableNow || availableTonight;

    const toggleActivity = (activity: ActivityType) => {
        if (selectedActivities.includes(activity)) {
            onActivitiesChange(selectedActivities.filter(a => a !== activity));
        } else {
            onActivitiesChange([...selectedActivities, activity]);
        }
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Activity Filters */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary-500" />
                    Hoạt động
                </h4>
                <div className="flex flex-wrap gap-2">
                    {ACTIVITY_OPTIONS.map((option) => {
                        const isSelected = selectedActivities.includes(option.value);
                        return (
                            <motion.button
                                key={option.value}
                                onClick={() => toggleActivity(option.value)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                                    isSelected
                                        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                )}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="text-base">{option.emoji}</span>
                                <span>{option.label}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Time Filters */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-500" />
                    Thời gian
                </h4>
                <div className="flex flex-wrap gap-2">
                    <motion.button
                        onClick={() => onAvailableNowChange(!availableNow)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                            availableNow
                                ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                        <span>Rảnh ngay bây giờ</span>
                    </motion.button>

                    <motion.button
                        onClick={() => onAvailableTonightChange(!availableTonight)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                            availableTonight
                                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Moon className="w-4 h-4" />
                        <span>Rảnh tối nay</span>
                    </motion.button>
                </div>
            </div>

            {/* Clear Button */}
            <AnimatePresence>
                {hasFilters && (
                    <motion.button
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onClick={onClear}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
                    >
                        <X className="w-4 h-4" />
                        <span>Xóa tất cả bộ lọc</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
