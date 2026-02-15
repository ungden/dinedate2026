'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Search,
  Filter,
  X,
  Loader2,
  MapPin,
  SlidersHorizontal,
  ChevronDown,
  Star,
  UtensilsCrossed,
} from 'lucide-react';
import { CuisineType, CUISINE_LABELS, CUISINE_ICONS } from '@/types';
import { cn, getCuisineIcon, getCuisineLabel } from '@/lib/utils';
import { useRestaurants } from '@/hooks/useRestaurants';
import RestaurantCard from '@/components/RestaurantCard';

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------

const CITIES = [
  { value: '', label: 'Tất cả thành phố' },
  { value: 'Hà Nội', label: 'Hà Nội' },
  { value: 'TP.HCM', label: 'TP.HCM' },
  { value: 'Đà Nẵng', label: 'Đà Nẵng' },
];

const CUISINE_OPTIONS: CuisineType[] = [
  'vietnamese',
  'japanese',
  'korean',
  'chinese',
  'italian',
  'thai',
  'bbq',
  'hotpot',
  'seafood',
  'vegetarian',
  'fusion',
];

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

export default function DiscoverDealsClient() {
  const router = useRouter();

  // Filters
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType | ''>('');
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Data
  const { restaurants, loading, error, refetch } = useRestaurants(
    selectedCity || undefined
  );

  // Client-side filtering
  const filtered = useMemo(() => {
    let result = restaurants;

    // Cuisine filter
    if (selectedCuisine) {
      result = result.filter((r) =>
        r.cuisineTypes.includes(selectedCuisine as CuisineType)
      );
    }

    // Text search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter((r) => {
        const hay =
          `${r.name} ${r.description} ${r.area} ${r.address} ${r.cuisineTypes.map(getCuisineLabel).join(' ')}`.toLowerCase();
        return hay.includes(q);
      });
    }

    return result;
  }, [restaurants, selectedCuisine, query]);

  const activeFilterCount =
    (selectedCity ? 1 : 0) +
    (selectedCuisine ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const clearFilters = () => {
    setSelectedCity('');
    setSelectedCuisine('');
    setQuery('');
  };

  return (
    <div className="space-y-6 pb-24 min-h-screen relative">
      {/* Sticky controls */}
      <div className="sticky top-[60px] z-30 -mx-4 px-4 bg-white/80 backdrop-blur-xl border-b border-pink-100 py-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black text-gray-900">
            Khám phá nhà hàng
          </h1>
          {!loading && (
            <div className="text-xs font-semibold text-pink-600 bg-pink-50 border border-pink-100 px-3 py-1.5 rounded-full">
              {filtered.length} nhà hàng
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm nhà hàng, món ăn..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-500/10 outline-none transition-all"
            />
            {query.trim() && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
                aria-label="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* City selector */}
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:border-pink-300 focus:ring-2 focus:ring-pink-500/10 outline-none cursor-pointer"
            >
              {CITIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all relative',
              showFilters || activeFilterCount > 0
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
                : 'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100'
            )}
            aria-label="Bộ lọc"
          >
            <SlidersHorizontal className="w-[18px] h-[18px]" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-pink-600 text-[10px] font-black rounded-full border-2 border-pink-500 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Cuisine chips */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-1 pb-1">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCuisine('')}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-bold transition border',
                      !selectedCuisine
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    Tất cả
                  </button>

                  {CUISINE_OPTIONS.map((cuisine) => {
                    const active = selectedCuisine === cuisine;
                    return (
                      <button
                        key={cuisine}
                        onClick={() =>
                          setSelectedCuisine(active ? '' : cuisine)
                        }
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-bold transition border',
                          active
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        )}
                      >
                        {getCuisineIcon(cuisine)} {getCuisineLabel(cuisine)}
                      </button>
                    );
                  })}
                </div>

                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="mt-2 text-xs font-bold text-pink-600 hover:text-pink-700 transition"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-center">
          <p className="text-sm text-red-600 font-medium mb-2">
            Có lỗi xảy ra khi tải dữ liệu
          </p>
          <button
            onClick={() => refetch()}
            className="text-sm font-bold text-red-600 hover:text-red-700 underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Restaurant grid */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
              >
                <div className="aspect-[16/9] bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                  <div className="flex gap-1.5 mb-2.5">
                    <div className="h-5 w-16 bg-gray-100 rounded-full" />
                    <div className="h-5 w-14 bg-gray-100 rounded-full" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                    <div className="h-3 w-14 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((restaurant, idx) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
              >
                <RestaurantCard
                  restaurant={restaurant}
                  onClick={() =>
                    router.push(`/restaurants/${restaurant.id}`)
                  }
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white rounded-[28px] border border-dashed border-pink-200">
            <div className="text-6xl mb-4">
              <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto" />
            </div>
            <h3 className="text-lg font-black text-gray-900">
              {query.trim() || selectedCuisine || selectedCity
                ? 'Không tìm thấy nhà hàng'
                : 'Chưa có nhà hàng nào'}
            </h3>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto px-6">
              {query.trim() || selectedCuisine || selectedCity
                ? 'Thử đổi từ khóa hoặc bớt bộ lọc nhé!'
                : 'Hệ thống đang cập nhật nhà hàng mới. Quay lại sau nhé!'}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm font-bold text-pink-600 hover:text-pink-700 transition"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
