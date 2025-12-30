'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ThumbsUp } from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { useAuth } from '@/contexts/AuthContext';
import { EmptyState } from '@/components/ErrorBoundary';

type ReviewFilter = 'all' | 'received' | 'given';

export default function ReviewsClient() {
  const { user } = useAuth();
  const { reviews, users } = useDateStore();
  const [filter, setFilter] = useState<ReviewFilter>('all');

  const myReviews = reviews.filter((review) => {
    if (filter === 'received') return review.revieweeId === user?.id;
    if (filter === 'given') return review.reviewerId === user?.id;
    return review.revieweeId === user?.id || review.reviewerId === user?.id;
  });

  const getUserById = (id: string) => users.find((u) => u.id === id);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Đánh giá</h1>
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('received')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === 'received'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Đã nhận
          </button>
          <button
            onClick={() => setFilter('given')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === 'given'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Đã gửi
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-primary-600">
            {reviews.filter((r) => r.revieweeId === user?.id).length}
          </div>
          <div className="text-sm text-gray-500">Đánh giá nhận được</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-yellow-500 flex items-center justify-center gap-1">
            <Star className="w-5 h-5 fill-yellow-500" />
            {user?.rating?.toFixed(1) || '0.0'}
          </div>
          <div className="text-sm text-gray-500">Điểm trung bình</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-green-600">
            {reviews.filter((r) => r.reviewerId === user?.id).length}
          </div>
          <div className="text-sm text-gray-500">Đánh giá đã gửi</div>
        </div>
      </div>

      {/* Reviews List */}
      {myReviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Chưa có đánh giá"
          description="Bạn chưa có đánh giá nào. Hãy tham gia các buổi hẹn để nhận đánh giá!"
        />
      ) : (
        <div className="space-y-4">
          {myReviews.map((review) => {
            const reviewer = getUserById(review.reviewerId);
            const reviewee = getUserById(review.revieweeId);
            const isReceived = review.revieweeId === user?.id;

            return (
              <div
                key={review.id}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <Link href={`/user/${isReceived ? reviewer?.id : reviewee?.id}`}>
                    <Image
                      src={(isReceived ? reviewer?.avatar : reviewee?.avatar) || '/default-avatar.png'}
                      alt={(isReceived ? reviewer?.name : reviewee?.name) || 'User'}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <Link
                          href={`/user/${isReceived ? reviewer?.id : reviewee?.id}`}
                          className="font-medium text-gray-900 hover:text-primary-600"
                        >
                          {isReceived ? reviewer?.name : reviewee?.name}
                        </Link>
                        <span className="text-gray-400 mx-2">•</span>
                        <span className="text-sm text-gray-500">
                          {isReceived ? 'đã đánh giá bạn' : 'bạn đã đánh giá'}
                        </span>
                      </div>
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-gray-700 mt-2">{review.comment}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                      <button className="flex items-center gap-1 hover:text-primary-600 transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                        Hữu ích
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
