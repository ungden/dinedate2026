'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
    MapPin,
    Calendar,
    Zap,
    X
} from 'lucide-react';
import { CuisineType, CUISINE_LABELS, CUISINE_ICONS } from '@/types';
import { cn } from '@/lib/utils';

interface SmartFilterProps {
    selectedCuisines: CuisineType[];
    onCuisinesChange: (cuisines: CuisineType[]) => void;
    city: string;
    onCityChange: (value: string) => void;
    dateRange: { from: string; to: string };
    onDateRangeChange: (range: { from: string; to: string }) => void;
    onClear: () => void;
    className?: string;
}

const CUISINE_OPTIONS: { value: CuisineType; label: string; emoji: string }[] = (
    Object.keys(CUISINE_LABELS) as CuisineType[]
).map((key) => ({
    value: key,
    label: CUISINE_LABELS[key],
    emoji: CUISINE_ICONS[key],
}));

const CITY_OPTIONS = [
    'Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Cần Thơ',
    'Hải Phòng',
    'Nha Trang',
];

export default function SmartFilter({
    selectedCuisines,
    onCuisinesChange,
    city,
    onCityChange,
    dateRange,
    onDateRangeChange,
    onClear,
    className
}: SmartFilterProps) {
    const hasFilters = selectedCuisines.length > 0 || city !== '' || dateRange.from !== '' || dateRange.to !== '';

    const toggleCuisine = (cuisine: CuisineType) => {
        if (selectedCuisines.includes(cuisine)) {
            onCuisinesChange(selectedCuisines.filter(c => c !== cuisine));
        } else {
            onCuisinesChange([...selectedCuisines, cuisine]);
        }
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Cuisine Filters */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary-500" />
                    Ẩm thực
                </h4>
                <div className="flex flex-wrap gap-2">
                    {CUISINE_OPTIONS.map((option) => {
                        const isSelected = selectedCuisines.includes(option.value);
                        return (
                            <motion.button
                                key={option.value}
                                onClick={() => toggleCuisine(option.value)}
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

            {/* City Filter */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    Thành phố
                </h4>
                <div className="flex flex-wrap gap-2">
                    {CITY_OPTIONS.map((c) => (
                        <motion.button
                            key={c}
                            onClick={() => onCityChange(city === c ? '' : c)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                                city === c
                                    ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span>{c}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Date Range Filter */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    Khoảng thời gian
                </h4>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
                        className="px-3 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-gray-400 text-sm">đến</span>
                    <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value })}
                        className="px-3 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
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
