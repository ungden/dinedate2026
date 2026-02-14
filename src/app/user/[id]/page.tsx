'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Star,
  ShieldCheck,
  BadgeCheck,
  Loader2,
  Flag,
  ShieldOff,
  UtensilsCrossed,
  CalendarCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, getVIPBadgeColor, getCuisineLabel, getCuisineIcon } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { useDbUserProfile } from '@/hooks/useDbUserProfile';
import { motion, AnimatePresence } from '@/lib/motion';
import ReportUserModal from '@/components/ReportUserModal';
import BlockUserModal from '@/components/BlockUserModal';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { usePersonReviewsFor } from '@/hooks/useReviews';
import { supabase } from '@/integrations/supabase/client';
import DiceBearAvatar from '@/components/DiceBearAvatar';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { user: authUser } = useAuth();
  const { user, reviews: _reviews, rating, loading } = useDbUserProfile(userId);
  const { isBlocked, blockUser, unblockUser } = useBlockedUsers();
  const { reviews: personReviews, loading: reviewsLoading } = usePersonReviewsFor(userId);

  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; actionType: 'generic' }>({
    isOpen: false,
    actionType: 'generic',
  });

  const isCurrentUser = !!authUser && !!user && authUser.id === user.id;

  // Check if viewer can see real photo (VIP or mutual connection)
  const [canSeeRealPhoto, setCanSeeRealPhoto] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!authUser || !user) {
        setCanSeeRealPhoto(false);
        return;
      }
      if (isCurrentUser) {
        setCanSeeRealPhoto(true);
        return;
      }
      // VIP users can see real photos
      if (authUser.vipStatus.tier === 'vip' || authUser.vipStatus.tier === 'svip') {
        setCanSeeRealPhoto(true);
        return;
      }
      // Check mutual connection
      try {
        const { data } = await supabase
          .from('connections')
          .select('id')
          .or(`and(user_id.eq.${authUser.id},connected_user_id.eq.${user.id}),and(user_id.eq.${user.id},connected_user_id.eq.${authUser.id})`)
          .eq('status', 'accepted')
          .limit(1);
        setCanSeeRealPhoto(!!(data && data.length > 0));
      } catch {
        setCanSeeRealPhoto(false);
      }
    };
    checkAccess();
  }, [authUser, user, isCurrentUser]);

  // Track profile view
  useEffect(() => {
    const trackProfileView = async () => {
      if (!user?.id) return;
      if (isCurrentUser) return;
      try {
        await supabase.from('profile_views').insert({
          viewer_id: authUser?.id || null,
          viewed_id: user.id,
          source: 'direct',
        });
      } catch (error) {
        console.error('Failed to track profile view:', error);
      }
    };
    trackProfileView();
  }, [user?.id, authUser?.id, isCurrentUser]);

  const userIsBlocked = user ? isBlocked(user.id) : false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">😢</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy người dùng</h3>
        <Link href="/" className="text-primary-600 hover:underline">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-28 px-4">
      {/* Nav */}
      <div className="flex items-center justify-between mb-6 pt-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold transition">
          <ArrowLeft className="w-5 h-5" /> Quay lại
        </button>
        <div className="flex gap-2">
          <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 transition">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 transition">
            <Heart className="w-5 h-5" />
          </button>
          {authUser && !isCurrentUser && (
            <>
              <button
                onClick={() => setShowReportModal(true)}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-amber-50 hover:border-amber-200 text-gray-500 hover:text-amber-600 transition"
                title="Báo cáo"
              >
                <Flag className="w-5 h-5" />
              </button>
              <button
                onClick={() => userIsBlocked ? unblockUser(user!.id) : setShowBlockModal(true)}
                className={cn(
                  "p-2.5 border rounded-xl transition",
                  userIsBlocked
                    ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                )}
                title={userIsBlocked ? "Bỏ chặn" : "Chặn"}
              >
                <ShieldOff className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Blocked Banner */}
      {userIsBlocked && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <ShieldOff className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-red-800">Đã chặn người này</p>
              <p className="text-sm text-red-700">Bạn và người này sẽ không nhìn thấy nhau trong tìm kiếm.</p>
            </div>
            <button
              onClick={() => unblockUser(user!.id)}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition"
            >
              Bỏ chặn
            </button>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* DiceBear Avatar (always shown) */}
          <div className="flex-shrink-0">
            <DiceBearAvatar
              userId={user.id}
              size="xl"
              showVipBadge={user.vipStatus.tier !== 'free'}
              vipTier={user.vipStatus.tier}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight truncate">{user.name}</h1>
              {user.vipStatus.tier !== 'free' && (
                <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black text-white uppercase shadow-sm', getVIPBadgeColor(user.vipStatus.tier))}>
                  {user.vipStatus.tier}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>{user.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-gray-900">{rating.toFixed(1)}</span>
                <span className="text-gray-400">({user.reviewCount || 0} đánh giá)</span>
              </div>
              {user.totalDates != null && user.totalDates > 0 && (
                <div className="flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-green-500" />
                  <span className="font-bold text-gray-900">{user.totalDates}</span>
                  <span className="text-gray-400">date hoàn thành</span>
                </div>
              )}
            </div>

            {/* Zodiac */}
            {user.zodiac && (
              <span className="inline-block px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold border border-purple-100 capitalize">
                {user.zodiac}
              </span>
            )}
          </div>
        </div>

        {/* Real Photo (only for VIP / mutual connections) */}
        {canSeeRealPhoto && user.avatar && !user.avatar.includes('dicebear') && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Ảnh thật</p>
            <Image
              src={user.avatar}
              alt={user.name}
              width={160}
              height={160}
              className="rounded-2xl object-cover border-2 border-white shadow-md"
            />
          </div>
        )}
        {!canSeeRealPhoto && !isCurrentUser && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="text-sm font-bold text-amber-800">Ảnh thật bị ẩn</p>
                <p className="text-xs text-amber-700">Nâng cấp VIP hoặc kết nối để xem ảnh thật.</p>
              </div>
              <Link href="/vip-subscription" className="ml-auto px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition">
                VIP
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Bio */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 space-y-3">
        <h3 className="font-bold text-gray-900 text-lg">Giới thiệu</h3>
        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-[15px]">
          {user.bio || 'Người dùng này chưa viết giới thiệu.'}
        </p>

        {/* Personality Tags */}
        {user.personalityTags && user.personalityTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {user.personalityTags.map(tag => (
              <span key={tag} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold border border-gray-200">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Food Preferences */}
      {user.foodPreferences && user.foodPreferences.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-orange-500" />
            Sở thích ẩm thực
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.foodPreferences.map((cuisine) => (
              <span
                key={cuisine}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-xl text-xs font-bold border border-orange-100"
              >
                {getCuisineIcon(cuisine)} {getCuisineLabel(cuisine)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-600 shadow-sm border border-green-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-green-900">Hẹn hò an toàn</p>
            <p className="text-sm text-green-800/80 mt-0.5">Date tại nhà hàng đối tác được bảo vệ</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
            <BadgeCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-blue-900">Đã xác thực</p>
            <p className="text-sm text-blue-800/80 mt-0.5">SĐT và thông tin đã kiểm tra</p>
          </div>
        </div>
      </div>

      {/* Person Reviews */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          Đánh giá từ người khác ({personReviews.length})
        </h3>

        {reviewsLoading ? (
          <div className="py-8 text-center text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Đang tải đánh giá...
          </div>
        ) : personReviews.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <p className="text-4xl mb-2">⭐</p>
            <p className="font-medium">Chưa có đánh giá nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {personReviews.map((review) => (
              <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3 mb-2">
                  {review.reviewer && (
                    <DiceBearAvatar userId={review.reviewerId} size="sm" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">
                      {review.reviewer?.name || 'Người dùng ẩn danh'}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-3 h-3',
                              i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  {review.wantToMeetAgain && (
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100">
                      Muốn gặp lại
                    </span>
                  )}
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed ml-11">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        actionType={authModal.actionType}
      />

      {/* Report User Modal */}
      {user && (
        <ReportUserModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={user.id}
          reportedUserName={user.name}
        />
      )}

      {/* Block User Modal */}
      {user && (
        <BlockUserModal
          isOpen={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          userId={user.id}
          userName={user.name}
          onBlock={async () => {
            const success = await blockUser(user.id);
            return success;
          }}
        />
      )}
    </div>
  );
}
