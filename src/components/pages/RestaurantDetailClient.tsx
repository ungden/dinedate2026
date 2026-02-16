'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Phone,
  Mail,
  UtensilsCrossed,
  Loader2,
  Plus,
  ChevronRight,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import {
  cn,
  formatCurrency,
  getCuisineIcon,
  getCuisineLabel,
  formatRelativeTime,
} from '@/lib/utils';
import { useRestaurantById } from '@/hooks/useRestaurants';
import { useCombos } from '@/hooks/useCombos';
import { useRestaurantReviewsFor } from '@/hooks/useReviews';
import DiceBearAvatar from '@/components/DiceBearAvatar';

// ----------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------

function RatingStars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            sizeClass,
            i < Math.round(rating)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-200 fill-gray-200'
          )}
        />
      ))}
    </div>
  );
}

function RatingBar({ label, rating }: { label: string; rating: number }) {
  const pct = (rating / 5) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full bg-yellow-400"
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// ----------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------

type TabId = 'combos' | 'reviews';

export default function RestaurantDetailClient() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params?.id as string;

  const [activeTab, setActiveTab] = useState<TabId>('combos');

  // Data
  const { restaurant, loading, error } = useRestaurantById(restaurantId);
  const { combos, loading: combosLoading } = useCombos(restaurantId);
  const { reviews, loading: reviewsLoading } =
    useRestaurantReviewsFor(restaurantId);

  // Compute average ratings from reviews
  const avgRatings = (() => {
    if (!reviews.length) return null;
    const sum = reviews.reduce(
      (acc, r) => ({
        food: acc.food + r.foodRating,
        ambiance: acc.ambiance + r.ambianceRating,
        service: acc.service + r.serviceRating,
        overall: acc.overall + r.overallRating,
      }),
      { food: 0, ambiance: 0, service: 0, overall: 0 }
    );
    const n = reviews.length;
    return {
      food: sum.food / n,
      ambiance: sum.ambiance / n,
      service: sum.service / n,
      overall: sum.overall / n,
    };
  })();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pb-24">
        {/* Cover skeleton */}
        <div className="relative -mx-4 aspect-[16/9] max-h-[280px] bg-gray-200 animate-pulse" />
        <div className="space-y-4 mt-4">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24">
        <div className="text-center max-w-sm mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-black text-gray-900 mb-2">
            Không tìm thấy nhà hàng
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {error || 'Nhà hàng không tồn tại hoặc đã bị xóa.'}
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const TABS: { id: TabId; label: string; count?: number }[] = [
    { id: 'combos', label: 'Combo', count: combos.length },
    { id: 'reviews', label: 'Đánh giá', count: reviews.length },
  ];

  return (
    <div className="max-w-6xl mx-auto min-h-screen pb-28 md:pb-8">
      {/* ============================================================ */}
      {/* Cover Image Hero */}
      {/* ============================================================ */}
      <div className="relative -mx-4 sm:-mx-6 lg:mx-0 overflow-hidden lg:rounded-2xl">
        <div className="aspect-[16/9] md:aspect-[21/9] max-h-[400px] w-full overflow-hidden bg-gray-100">
          {restaurant.coverImageUrl ? (
            <img
              src={restaurant.coverImageUrl}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-100 via-pink-50 to-pink-200 flex items-center justify-center">
              <span className="text-6xl">
                {restaurant.cuisineTypes[0]
                  ? getCuisineIcon(restaurant.cuisineTypes[0])
                  : '🍽️'}
              </span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Logo overlay */}
        {restaurant.logoUrl && (
          <div className="absolute bottom-4 left-4 w-16 h-16 rounded-2xl bg-white shadow-lg overflow-hidden border-2 border-white">
            <img
              src={restaurant.logoUrl}
              alt={`${restaurant.name} logo`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* Desktop 2-column layout */}
      {/* ============================================================ */}
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">

      {/* Left Column */}
      <div>

      {/* ============================================================ */}
      {/* Restaurant Info */}
      {/* ============================================================ */}
      <section className="mt-4 space-y-4">
        {/* Name + Rating */}
        <div>
          <h1 className="text-2xl font-black text-gray-900 leading-tight">
            {restaurant.name}
          </h1>

          {restaurant.averageRating != null && (
            <div className="flex items-center gap-2 mt-1.5">
              <RatingStars rating={restaurant.averageRating} size="md" />
              <span className="text-sm font-bold text-gray-700">
                {restaurant.averageRating.toFixed(1)}
              </span>
              {restaurant.reviewCount != null && (
                <span className="text-sm text-gray-400">
                  ({restaurant.reviewCount} đánh giá)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Cuisine tags */}
        <div className="flex flex-wrap gap-2">
          {restaurant.cuisineTypes.map((cuisine) => (
            <span
              key={cuisine}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-sm font-medium border border-pink-100"
            >
              <span>{getCuisineIcon(cuisine)}</span>
              {getCuisineLabel(cuisine)}
            </span>
          ))}
        </div>

        {/* Info rows */}
        <div className="space-y-2.5">
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span>
              {restaurant.address}
              {restaurant.area && `, ${restaurant.area}`}
              {restaurant.city && ` - ${restaurant.city}`}
            </span>
          </div>

          {restaurant.openingHours && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{restaurant.openingHours}</span>
            </div>
          )}

          {restaurant.phone && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <a
                href={`tel:${restaurant.phone}`}
                className="text-pink-600 font-medium hover:underline"
              >
                {restaurant.phone}
              </a>
            </div>
          )}

          {restaurant.email && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <a
                href={`mailto:${restaurant.email}`}
                className="text-pink-600 font-medium hover:underline"
              >
                {restaurant.email}
              </a>
            </div>
          )}
        </div>

        {/* Description */}
        {restaurant.description && (
          <p className="text-sm text-gray-600 leading-relaxed">
            {restaurant.description}
          </p>
        )}
      </section>

      {/* ============================================================ */}
      {/* Tabs */}
      {/* ============================================================ */}
      <div className="mt-6 border-b border-gray-200">
        <div className="flex max-w-xs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              )}
            >
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span
                  className={cn(
                    'ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold',
                    activeTab === tab.id
                      ? 'bg-pink-100 text-pink-600'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* Tab Content */}
      {/* ============================================================ */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'combos' && (
            <motion.div
              key="combos"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {combosLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse"
                    >
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-xl bg-gray-200 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                          <div className="h-3 w-48 bg-gray-100 rounded mb-2" />
                          <div className="flex gap-1">
                            <div className="h-4 w-12 bg-gray-100 rounded" />
                            <div className="h-4 w-12 bg-gray-100 rounded" />
                          </div>
                          <div className="h-4 w-24 bg-gray-200 rounded mt-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : combos.length > 0 ? (
                <div className="space-y-3">
                  {combos.map((combo, idx) => (
                    <motion.div
                      key={combo.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        'bg-white rounded-2xl border-2 p-4',
                        combo.isAvailable
                          ? 'border-gray-100'
                          : 'border-gray-100 opacity-50'
                      )}
                    >
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
                          <div className="w-20 h-20 rounded-xl flex-shrink-0 bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center">
                            <UtensilsCrossed className="w-8 h-8 text-pink-400" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
                            {combo.name}
                          </h4>
                          {combo.description && (
                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                              {combo.description}
                            </p>
                          )}

                          {/* Items list */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {combo.items.slice(0, 5).map((item, i) => (
                              <span
                                key={i}
                                className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-600 font-medium"
                              >
                                {item}
                              </span>
                            ))}
                            {combo.items.length > 5 && (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-400 font-medium">
                                +{combo.items.length - 5}
                              </span>
                            )}
                          </div>

                          {/* Price */}
                          <p className="text-sm font-bold text-pink-600">
                            {formatCurrency(combo.price)}
                            <span className="text-xs font-normal text-gray-400 ml-1">
                              / 2 người
                            </span>
                          </p>
                        </div>
                      </div>

                      {!combo.isAvailable && (
                        <div className="mt-2 text-center">
                          <span className="text-xs font-semibold text-gray-400">
                            Tạm hết
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-500">
                    Chưa có combo nào
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Nhà hàng đang cập nhật menu combo
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {reviewsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200" />
                        <div>
                          <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                          <div className="h-3 w-16 bg-gray-100 rounded" />
                        </div>
                      </div>
                      <div className="h-3 w-full bg-gray-100 rounded mb-1" />
                      <div className="h-3 w-2/3 bg-gray-100 rounded" />
                    </div>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {/* Rating summary */}
                  {avgRatings && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-3xl font-black text-gray-900">
                            {avgRatings.overall.toFixed(1)}
                          </p>
                          <RatingStars
                            rating={avgRatings.overall}
                            size="sm"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            {reviews.length} đánh giá
                          </p>
                        </div>
                        <div className="flex-1 space-y-2">
                          <RatingBar
                            label="Đồ ăn"
                            rating={avgRatings.food}
                          />
                          <RatingBar
                            label="Không gian"
                            rating={avgRatings.ambiance}
                          />
                          <RatingBar
                            label="Phục vụ"
                            rating={avgRatings.service}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reviews list */}
                  {reviews.map((review, idx) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl border border-gray-100 p-4"
                    >
                      {/* Reviewer */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          {review.reviewer ? (
                            <DiceBearAvatar
                              userId={review.reviewerId}
                              size="sm"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200" />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {review.reviewer?.name || 'Ẩn danh'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatRelativeTime(review.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-bold text-gray-700">
                            {review.overallRating.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Detailed ratings */}
                      <div className="flex gap-4 mb-3 text-xs text-gray-500">
                        <span>
                          Đồ ăn:{' '}
                          <span className="font-semibold text-gray-700">
                            {review.foodRating}
                          </span>
                        </span>
                        <span>
                          Không gian:{' '}
                          <span className="font-semibold text-gray-700">
                            {review.ambianceRating}
                          </span>
                        </span>
                        <span>
                          Phục vụ:{' '}
                          <span className="font-semibold text-gray-700">
                            {review.serviceRating}
                          </span>
                        </span>
                      </div>

                      {/* Comment */}
                      {review.comment && (
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {review.comment}
                        </p>
                      )}

                      {/* Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto">
                          {review.images.map((img, i) => (
                            <div
                              key={i}
                              className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100"
                            >
                              <img
                                src={img}
                                alt={`Review ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-500">
                    Chưa có đánh giá nào
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Hãy là người đầu tiên đánh giá nhà hàng này sau một buổi
                    date!
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      </div>{/* End Left Column */}

      {/* Right Column — Sidebar (desktop only, shows CTA + quick info) */}
      <aside className="hidden lg:block">
        <div className="sticky top-[90px] space-y-4">
          <div className="bg-white rounded-2xl shadow-card border border-gray-100/60 p-6">
            <h3 className="font-bold text-gray-900 mb-3">Đặt lịch hẹn hò</h3>
            <p className="text-sm text-gray-500 mb-4">
              Chọn combo và tạo Date Order để tìm bạn ăn tối cùng tại {restaurant.name}.
            </p>
            <Link
              href={`/create-request?restaurantId=${restaurantId}`}
              className="block"
            >
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold shadow-primary hover:shadow-primary-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Tạo Date Order
              </motion.button>
            </Link>
          </div>

          {/* Quick stats */}
          {avgRatings && (
            <div className="bg-white rounded-2xl shadow-card border border-gray-100/60 p-6">
              <div className="text-center mb-3">
                <p className="text-3xl font-black text-gray-900">{avgRatings.overall.toFixed(1)}</p>
                <RatingStars rating={avgRatings.overall} size="md" />
                <p className="text-xs text-gray-400 mt-1">{reviews.length} đánh giá</p>
              </div>
              <div className="space-y-2">
                <RatingBar label="Đồ ăn" rating={avgRatings.food} />
                <RatingBar label="Không gian" rating={avgRatings.ambiance} />
                <RatingBar label="Phục vụ" rating={avgRatings.service} />
              </div>
            </div>
          )}
        </div>
      </aside>

      </div>{/* End 2-column grid */}

      {/* ============================================================ */}
      {/* Fixed CTA (mobile only) */}
      {/* ============================================================ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-gray-200 px-4 py-3 safe-area-bottom lg:hidden">
        <Link
          href={`/create-request?restaurantId=${restaurantId}`}
          className="block max-w-lg mx-auto"
        >
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold shadow-primary hover:shadow-primary-lg transition-all text-base"
          >
            <Plus className="w-5 h-5" />
            Tạo Date Order tại đây
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </Link>
      </div>
    </div>
  );
}
