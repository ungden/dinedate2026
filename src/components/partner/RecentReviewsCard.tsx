'use client';

import { motion } from '@/lib/motion';
import { ReviewItem } from '@/hooks/usePartnerAnalytics';
import { formatRelativeTime } from '@/lib/utils';
import { Star, MessageSquare, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface RecentReviewsCardProps {
  reviews: ReviewItem[];
  averageRating: number;
  totalReviews?: number;
  loading?: boolean;
}

export default function RecentReviewsCard({ reviews, averageRating, totalReviews = 0, loading }: RecentReviewsCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      {/* Header with Rating Summary */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Danh gia</h3>
              <p className="text-xs text-gray-500">Tu khach hang cua ban</p>
            </div>
          </div>

          {/* Average Rating */}
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900">{averageRating.toFixed(1)}</span>
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </div>
            <p className="text-xs text-gray-500">{totalReviews || reviews.length} danh gia</p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="mt-3 flex items-center gap-1">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  rating >= 4 ? 'bg-green-500' : rating >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.random() * 60 + 20}%`, // Placeholder - would need real data
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="divide-y divide-gray-100">
        {reviews.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Chua co danh gia nao</p>
          </div>
        ) : (
          reviews.map((review, index) => (
            <motion.div
              key={review.id}
              className="p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image
                    src={review.reviewerAvatar}
                    alt={review.reviewerName}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm truncate">
                      {review.reviewerName}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatRelativeTime(review.createdAt)}
                    </span>
                  </div>

                  {/* Stars */}
                  <div className="mb-1.5">{renderStars(review.rating)}</div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* View All Link */}
      {reviews.length > 0 && (
        <Link
          href="/manage-bookings?tab=reviews"
          className="flex items-center justify-center gap-1 p-3 bg-gray-50 text-sm font-medium text-primary-600 hover:bg-gray-100 transition"
        >
          <span>Xem tat ca danh gia</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </motion.div>
  );
}
