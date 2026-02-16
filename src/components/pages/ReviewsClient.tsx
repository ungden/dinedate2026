'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ThumbsUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EmptyState } from '@/components/ErrorBoundary';
import { supabase } from '@/integrations/supabase/client';
import { PersonReview, User } from '@/types';

type ReviewFilter = 'all' | 'received' | 'given';

export default function ReviewsClient() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<PersonReview[]>([]);
  const [usersById, setUsersById] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReviewFilter>('all');

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user?.id) {
        setReviews([]);
        setUsersById({});
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('person_reviews')
        .select('id, date_order_id, reviewer_id, reviewed_id, rating, comment, want_to_meet_again, created_at')
        .or(`reviewed_id.eq.${user.id},reviewer_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reviews:', error);
        setReviews([]);
        setUsersById({});
        setLoading(false);
        return;
      }

      const mapped: PersonReview[] = (data || []).map((row: any) => ({
        id: row.id,
        dateOrderId: row.date_order_id,
        reviewerId: row.reviewer_id,
        reviewedId: row.reviewed_id,
        rating: Number(row.rating || 0),
        comment: row.comment || '',
        wantToMeetAgain: !!row.want_to_meet_again,
        createdAt: row.created_at,
      }));

      setReviews(mapped);

      const ids = Array.from(
        new Set(mapped.flatMap((r) => [r.reviewerId, r.reviewedId]).filter(Boolean))
      );

      if (ids.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .in('id', ids);

        if (usersError) {
          console.warn('Error loading review users:', usersError.message);
          setUsersById({});
        } else {
          const userMap = (usersData || []).reduce((acc: Record<string, User>, u: any) => {
            acc[u.id] = {
              id: u.id,
              name: u.name || u.username || '',
              username: u.username,
              age: u.age || 0,
              avatar: u.avatar || '',
              bio: u.bio || '',
              location: u.location || '',
              wallet: u.wallet || { balance: 0, escrowBalance: 0, currency: 'VND' },
              vipStatus: u.vip_status || { tier: 'free', benefits: [] },
              rating: u.rating != null ? Number(u.rating) : undefined,
              reviewCount: u.review_count != null ? Number(u.review_count) : undefined,
            } as User;
            return acc;
          }, {});
          setUsersById(userMap);
        }
      } else {
        setUsersById({});
      }

      setLoading(false);
    };

    fetchReviews();
  }, [user?.id]);

  const myReviews = useMemo(
    () =>
      reviews.filter((review) => {
        if (filter === 'received') return review.reviewedId === user?.id;
        if (filter === 'given') return review.reviewerId === user?.id;
        return review.reviewedId === user?.id || review.reviewerId === user?.id;
      }),
    [filter, reviews, user?.id]
  );

  const getUserById = (id: string) => usersById[id];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="py-12 text-center text-gray-500">Đang tải đánh giá...</div>
      </div>
    );
  }

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
                ? 'bg-pink-100 text-pink-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('received')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === 'received'
                ? 'bg-pink-100 text-pink-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Đã nhận
          </button>
          <button
            onClick={() => setFilter('given')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === 'given'
                ? 'bg-pink-100 text-pink-600'
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
          <div className="text-2xl font-bold text-pink-600">
            {reviews.filter((r) => r.reviewedId === user?.id).length}
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
            const reviewee = getUserById(review.reviewedId);
            const isReceived = review.reviewedId === user?.id;

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
                          className="font-medium text-gray-900 hover:text-pink-600"
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
                      <button className="flex items-center gap-1 hover:text-pink-600 transition-colors">
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
