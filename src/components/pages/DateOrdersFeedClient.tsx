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
  Plus,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Heart,
  UtensilsCrossed,
} from 'lucide-react';
import { CuisineType, CUISINE_LABELS, CUISINE_ICONS } from '@/types';
import {
  cn,
  formatCurrency,
  getCuisineIcon,
  getCuisineLabel,
} from '@/lib/utils';
import { useDateOrders } from '@/hooks/useDateOrders';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useAuth } from '@/contexts/AuthContext';
import DateOrderCard from '@/components/DateOrderCard';
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

type SortOption = 'newest' | 'soonest';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'soonest', label: 'Sắp diễn ra' },
];

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

export default function DateOrdersFeedClient() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Filters
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType | ''>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Data
  const { dateOrders, loading, error, refetch } = useDateOrders({
    status: 'active',
    city: selectedCity || undefined,
    cuisineType: (selectedCuisine as CuisineType) || undefined,
  });

  const { restaurants: featuredRestaurants, loading: restaurantsLoading } =
    useRestaurants();

  // Sort client-side
  const sortedOrders = useMemo(() => {
    const orders = [...dateOrders];
    if (sortBy === 'soonest') {
      orders.sort(
        (a, b) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      );
    }
    // 'newest' is already the default order from API (created_at desc)
    return orders;
  }, [dateOrders, sortBy]);

  const activeFilterCount =
    (selectedCity ? 1 : 0) +
    (selectedCuisine ? 1 : 0) +
    (sortBy !== 'newest' ? 1 : 0);

  const clearFilters = () => {
    setSelectedCity('');
    setSelectedCuisine('');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen pb-24 md:pb-4">
      {/* ============================================================ */}
      {/* Hero Section */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-pink-500 to-pink-600 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-8 pb-10 md:pt-14 md:pb-16 md:rounded-none lg:rounded-3xl lg:mx-0 lg:mt-2">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-pink-300/20 blur-3xl" />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white/90 text-xs font-semibold mb-4">
              <Heart className="w-3.5 h-3.5" />
              Hẹn hò ẩn danh x Ẩm thực
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3">
              Hẹn hò ẩn danh
              <br />
              <span className="text-yellow-200">Khám phá ẩm thực</span>
            </h1>

            <p className="text-white/80 text-sm md:text-base max-w-md mx-auto mb-6">
              Cùng một người lạ thú vị, thưởng thức bữa ăn tuyệt vời tại nhà
              hàng được chọn sẵn. Không biết trước đối phương — chỉ biết sẽ
              rất vui!
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/create-request">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-pink-600 font-black shadow-lg shadow-pink-700/30 hover:shadow-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Tạo Date Order
                </motion.button>
              </Link>

              <Link href="/restaurants">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/20 backdrop-blur-sm text-white font-bold border border-white/30 hover:bg-white/30 transition-all"
                >
                  <UtensilsCrossed className="w-5 h-5" />
                  Khám phá nhà hàng
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Filter Bar */}
      {/* ============================================================ */}
      <div className="sticky top-[70px] z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-white/80 backdrop-blur-xl border-b border-pink-100 py-3 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
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

          {/* Sort selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:border-pink-300 focus:ring-2 focus:ring-pink-500/10 outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              'ml-auto w-10 h-10 rounded-xl flex items-center justify-center transition-all relative',
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

          {!loading && (
            <div className="hidden sm:block text-xs font-semibold text-gray-400">
              {sortedOrders.length} kết quả
            </div>
          )}
        </div>

        {/* Cuisine filter chips */}
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

      {/* ============================================================ */}
      {/* Date Orders Feed */}
      {/* ============================================================ */}
      <section className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900">
            Date Orders đang mở
          </h2>
          {!loading && (
            <span className="text-xs font-semibold text-gray-400 sm:hidden">
              {sortedOrders.length} kết quả
            </span>
          )}
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

        {/* Loading state */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                    <div className="h-3 w-16 bg-gray-100 rounded" />
                  </div>
                  <div className="h-6 w-16 bg-gray-100 rounded-full" />
                </div>
                <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                <div className="h-4 w-3/4 bg-gray-100 rounded mb-3" />
                <div className="rounded-xl bg-gray-50 p-3 mb-3">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3 w-28 bg-gray-100 rounded" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedOrders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
              >
                <DateOrderCard
                  order={order}
                  currentUserId={user?.id}
                  onViewDetail={() => router.push(`/request/${order.id}`)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="py-16 text-center bg-white rounded-[28px] border border-dashed border-pink-200">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-lg font-black text-gray-900">
              Chưa có Date Order nào
            </h3>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto px-6">
              {selectedCity || selectedCuisine
                ? 'Không tìm thấy Date Order phù hợp với bộ lọc. Hãy thử thay đổi tiêu chí tìm kiếm hoặc tạo Date Order mới!'
                : 'Hãy là người đầu tiên tạo Date Order để tìm bạn ăn tối cùng! Chọn nhà hàng, combo, và đợi ai đó join.'}
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/create-request">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-black shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Tạo Date Order ngay
                </motion.button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* Featured Restaurants */}
      {/* ============================================================ */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-900">
            Nhà hàng nổi bật
          </h2>
          <Link
            href="/restaurants"
            className="inline-flex items-center gap-1 text-sm font-bold text-pink-600 hover:text-pink-700 transition"
          >
            Xem tất cả
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {restaurantsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
              >
                <div className="aspect-[16/9] bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredRestaurants.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredRestaurants.slice(0, 8).map((restaurant, idx) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
              >
                <RestaurantCard
                  restaurant={restaurant}
                  onClick={() => router.push(`/restaurants/${restaurant.id}`)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-gray-50 rounded-2xl">
            <p className="text-sm text-gray-400">
              Chưa có nhà hàng nào trong hệ thống
            </p>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* Floating CTA */}
      {/* ============================================================ */}
      <div className="fixed right-4 bottom-28 z-40 md:hidden">
        <Link href="/create-request">
          <motion.button
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-black shadow-[0_12px_30px_rgba(236,72,153,0.35)] border border-white/30 backdrop-blur"
          >
            <Plus className="w-5 h-5" />
            Tạo
          </motion.button>
        </Link>
      </div>
    </div>
  );
}
