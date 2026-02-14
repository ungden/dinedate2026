'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Star,
  Heart,
} from 'lucide-react';
import { motion } from '@/lib/motion';
import { cn, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useDateOrderById } from '@/hooks/useDateOrders';
import {
  useMyReviewsForOrder,
  useSubmitPersonReview,
  useSubmitRestaurantReview,
} from '@/hooks/useReviews';
import PostDateReview from '@/components/PostDateReview';
import DiceBearAvatar from '@/components/DiceBearAvatar';
import { PersonReview, RestaurantReview } from '@/types';
import toast from 'react-hot-toast';

export default function DateReviewClient() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { user } = useAuth();

  const { dateOrder, loading: orderLoading } = useDateOrderById(orderId);
  const {
    personReview: existingPersonReview,
    restaurantReview: existingRestaurantReview,
    hasReviewedPerson,
    hasReviewedRestaurant,
    loading: reviewsLoading,
  } = useMyReviewsForOrder(orderId, user?.id || '');

  const { submitReview: submitPersonReview, loading: submittingPerson } =
    useSubmitPersonReview();
  const { submitReview: submitRestaurantReview, loading: submittingRestaurant } =
    useSubmitRestaurantReview();

  // Determine who the "partner" is
  const partnerId = useMemo(() => {
    if (!dateOrder || !user) return null;
    if (user.id === dateOrder.creatorId) return dateOrder.matchedUserId || null;
    if (user.id === dateOrder.matchedUserId) return dateOrder.creatorId;
    return null;
  }, [dateOrder, user]);

  const partnerUser = useMemo(() => {
    if (!dateOrder || !partnerId) return null;
    if (partnerId === dateOrder.creatorId) return dateOrder.creator;
    if (partnerId === dateOrder.matchedUserId) return dateOrder.matchedUser;
    return null;
  }, [dateOrder, partnerId]);

  const isInvolved = useMemo(() => {
    if (!dateOrder || !user) return false;
    return user.id === dateOrder.creatorId || user.id === dateOrder.matchedUserId;
  }, [dateOrder, user]);

  const alreadyReviewed = hasReviewedPerson && hasReviewedRestaurant;

  // Handle submit
  const handleSubmit = async (
    personData: Omit<
      PersonReview,
      'id' | 'createdAt' | 'reviewerId' | 'reviewer' | 'reviewed'
    >,
    restaurantData: Omit<
      RestaurantReview,
      'id' | 'createdAt' | 'reviewerId' | 'reviewer' | 'restaurant'
    >
  ) => {
    if (!user || !partnerId) return;

    try {
      const [pResult, rResult] = await Promise.all([
        submitPersonReview({
          dateOrderId: orderId,
          reviewerId: user.id,
          reviewedId: partnerId,
          rating: personData.rating,
          comment: personData.comment,
          wantToMeetAgain: personData.wantToMeetAgain,
        }),
        submitRestaurantReview({
          dateOrderId: orderId,
          reviewerId: user.id,
          restaurantId: restaurantData.restaurantId,
          foodRating: restaurantData.foodRating,
          ambianceRating: restaurantData.ambianceRating,
          serviceRating: restaurantData.serviceRating,
          overallRating: restaurantData.overallRating,
          comment: restaurantData.comment,
        }),
      ]);

      if (pResult && rResult) {
        toast.success('Cam on ban da danh gia!');
        router.push('/manage-bookings');
      } else {
        toast.error('Co loi xay ra khi gui danh gia');
      }
    } catch {
      toast.error('Co loi xay ra');
    }
  };

  // Loading
  if (orderLoading || reviewsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <p className="text-gray-500 mt-3 text-sm">Dang tai...</p>
      </div>
    );
  }

  // Not found
  if (!dateOrder) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Khong tim thay Date Order
        </h3>
        <Link href="/manage-bookings" className="text-primary-600 hover:underline text-sm">
          Quay lai
        </Link>
      </div>
    );
  }

  // Not completed
  if (dateOrder.status !== 'completed') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Buoi hen chua hoan thanh
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          Ban chi co the danh gia sau khi buoi hen da hoan thanh.
        </p>
        <Link
          href={`/request/${orderId}`}
          className="text-primary-600 hover:underline text-sm"
        >
          Xem chi tiet Date Order
        </Link>
      </div>
    );
  }

  // Not involved
  if (!isInvolved) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Khong co quyen truy cap
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          Ban khong phai la thanh vien cua buoi hen nay.
        </p>
        <Link href="/discover" className="text-primary-600 hover:underline text-sm">
          Quay lai Kham pha
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Danh gia buoi hen</h1>
          <p className="text-sm text-gray-500">
            {dateOrder.restaurant?.name} - {formatDateTime(dateOrder.dateTime)}
          </p>
        </div>
      </div>

      {/* Already reviewed */}
      {alreadyReviewed ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-green-50 rounded-2xl p-6 border border-green-100 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 text-lg mb-1">
              Ban da danh gia roi!
            </h3>
            <p className="text-sm text-gray-500">
              Cam on ban da chia se cam nhan ve buoi hen.
            </p>
          </div>

          {/* Show existing person review */}
          {existingPersonReview && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">
                Danh gia doi phuong
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <DiceBearAvatar userId={existingPersonReview.reviewedId} size="md" />
                <div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < existingPersonReview.rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                  {existingPersonReview.wantToMeetAgain && (
                    <p className="text-xs text-primary-600 font-medium flex items-center gap-1 mt-1">
                      <Heart className="w-3 h-3 fill-primary-500" />
                      Muon gap lai
                    </p>
                  )}
                </div>
              </div>
              {existingPersonReview.comment && (
                <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg">
                  &quot;{existingPersonReview.comment}&quot;
                </p>
              )}
            </div>
          )}

          {/* Show existing restaurant review */}
          {existingRestaurantReview && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">
                Danh gia nha hang
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Mon an</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-3.5 h-3.5',
                          i < existingRestaurantReview.foodRating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Khong gian</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-3.5 h-3.5',
                          i < existingRestaurantReview.ambianceRating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Phuc vu</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-3.5 h-3.5',
                          i < existingRestaurantReview.serviceRating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-800 font-semibold">Tong the</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-3.5 h-3.5',
                          i < existingRestaurantReview.overallRating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {existingRestaurantReview.comment && (
                <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg">
                  &quot;{existingRestaurantReview.comment}&quot;
                </p>
              )}
            </div>
          )}

          <Link
            href="/manage-bookings"
            className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-center text-sm hover:bg-gray-200 transition"
          >
            Quay lai My Date Orders
          </Link>
        </motion.div>
      ) : (
        /* New review form */
        <PostDateReview
          dateOrderId={orderId}
          partnerId={partnerId || ''}
          partnerName={partnerUser?.name || 'Doi phuong'}
          restaurantId={dateOrder.restaurantId}
          restaurantName={dateOrder.restaurant?.name || 'Nha hang'}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
