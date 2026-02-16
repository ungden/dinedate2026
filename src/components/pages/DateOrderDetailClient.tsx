'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Loader2,
  Send,
  XCircle,
  CheckCircle,
  Users,
  CreditCard,
  UtensilsCrossed,
  Star,
  AlertCircle,
  Heart,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  cn,
  formatCurrency,
  getCuisineIcon,
  formatDateTime,
  getDateOrderStatusLabel,
  getDateOrderStatusColor,
} from '@/lib/utils';
import { PLATFORM_FEE_PER_PERSON } from '@/lib/platform';
import { useAuth } from '@/contexts/AuthContext';
import { useDateOrderById, useCancelDateOrder } from '@/hooks/useDateOrders';
import {
  useApplicationsForOrder,
  useApplyToOrder,
  useAcceptApplication,
  useMyApplicationForOrder,
} from '@/hooks/useDateOrderApplications';
import DiceBearAvatar from '@/components/DiceBearAvatar';
import MutualMatchBanner from '@/components/MutualMatchBanner';
import toast from 'react-hot-toast';

export default function DateOrderDetailClient() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { user } = useAuth();

  // Data fetching
  const { dateOrder, loading: orderLoading, error: orderError, refetch } = useDateOrderById(orderId);
  const isCreator = user?.id === dateOrder?.creatorId;
  const { applications, loading: appsLoading } = useApplicationsForOrder(
    isCreator ? orderId : ''
  );
  const {
    hasApplied: hasAppliedByMe,
    status: myApplicationStatus,
    loading: myApplicationLoading,
    refetch: refetchMyApplication,
  } = useMyApplicationForOrder(!isCreator ? orderId : '', user?.id || '');
  const { applyToOrder, loading: applying } = useApplyToOrder();
  const { acceptApplication, loading: accepting } = useAcceptApplication();
  const { cancelDateOrder, loading: cancelling } = useCancelDateOrder();

  // Local state
  const [applyMessage, setApplyMessage] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);

  // Derived state
  const isMatched = dateOrder?.status === 'matched' || dateOrder?.status === 'confirmed';
  const isActive = dateOrder?.status === 'active';
  const isCompleted = dateOrder?.status === 'completed';
  const isMatchedUser = user?.id === dateOrder?.matchedUserId;
  const isInvolved = isCreator || isMatchedUser;

  // Handle apply
  const handleApply = async () => {
    if (!user || !applyMessage.trim()) {
      if (!user) {
        toast.error('Vui lòng đăng nhập');
        router.push('/login');
      }
      return;
    }

    const result = await applyToOrder({
      orderId,
      applicantId: user.id,
      message: applyMessage.trim(),
    });

    if (result) {
      toast.success('Đã gửi ứng tuyển thành công!');
      setApplyMessage('');
      setShowApplyForm(false);
      refetch();
      refetchMyApplication();
    } else {
      toast.error('Có lỗi xảy ra khi ứng tuyển');
    }
  };

  // Handle accept application
  const handleAccept = async (applicationId: string, applicantId: string) => {
    if (!dateOrder) return;
    setProcessingAppId(applicationId);

    const success = await acceptApplication({
      applicationId,
      orderId,
      applicantId,
      restaurantId: dateOrder.restaurantId,
      dateTime: dateOrder.dateTime,
    });

    if (success) {
      toast.success('Đã chấp nhận! Buổi hẹn đã được ghép đôi.');
      refetch();
    } else {
      toast.error('Có lỗi xảy ra');
    }
    setProcessingAppId(null);
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!confirm('Bạn có chắc muốn hủy Date Order này?')) return;

    const success = await cancelDateOrder(orderId);
    if (success) {
      toast.success('Đã hủy Date Order');
      refetch();
    } else {
      toast.error('Không thể hủy');
    }
  };

  // Check if current user already applied
  const hasApplied = useMemo(() => {
    if (!user || isCreator) return false;
    return hasAppliedByMe;
  }, [hasAppliedByMe, isCreator, user]);

  // Loading state
  if (orderLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        <p className="text-gray-500 mt-3 text-sm">Đang tải...</p>
      </div>
    );
  }

  // Error / not found
  if (orderError || !dateOrder) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Không tìm thấy Date Order
        </h3>
        <p className="text-gray-500 mb-4 text-sm">
          {orderError || 'Date Order không tồn tại hoặc đã bị xóa.'}
        </p>
        <Link
          href="/discover"
          className="text-pink-600 hover:underline text-sm font-medium"
        >
          Quay lại trang Khám phá
        </Link>
      </div>
    );
  }

  const { restaurant, combo, creator, matchedUser } = dateOrder;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Chi tiết Date Order</h1>
            <span
              className={cn(
                'inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1',
                getDateOrderStatusColor(dateOrder.status)
              )}
            >
              {getDateOrderStatusLabel(dateOrder.status)}
            </span>
          </div>
        </div>

        {/* Cancel button for creator */}
        {isCreator && isActive && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleCancel}
            disabled={cancelling}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-600 bg-red-50 rounded-xl font-medium hover:bg-red-100 transition"
          >
            {cancelling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            Hủy
          </motion.button>
        )}
      </div>

      {/* Matched Banner */}
      {isMatched && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg"
        >
          <div className="absolute top-2 right-4 opacity-20">
            <Sparkles className="w-16 h-16" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-6 h-6 fill-white text-white" />
              <h3 className="text-lg font-black">Đã ghép đôi!</h3>
            </div>
            <p className="text-sm text-white/90">
              Buổi hẹn đã được ghép đôi thành công. Hãy đến nhà hàng đúng giờ nhé!
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Card — 2-column on desktop */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card lg:grid lg:grid-cols-[1fr_380px]">
      <div>
        {/* Creator info */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <DiceBearAvatar
              userId={dateOrder.creatorId}
              size="lg"
              showVipBadge={
                !!creator?.vipStatus?.tier && creator.vipStatus.tier !== 'free'
              }
              vipTier={creator?.vipStatus?.tier}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-base">
                {creator?.name || 'Ẩn danh'}
              </p>
              {creator?.occupation && (
                <p className="text-sm text-gray-500">{creator.occupation}</p>
              )}
              {creator?.rating != null && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs text-gray-500">
                    {creator.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
            {isCreator && (
              <span className="px-3 py-1 text-xs font-semibold text-pink-600 bg-pink-50 rounded-full">
                Đơn của bạn
              </span>
            )}
          </div>
        </div>

        {/* Restaurant info */}
        {restaurant && (
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">
                {getCuisineIcon(restaurant.cuisineTypes[0] || '')}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{restaurant.name}</p>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{restaurant.address}</span>
                </div>
              </div>
            </div>

            {/* Combo details */}
            {combo && (
              <div className="bg-gray-50 rounded-xl p-4 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-800 text-sm">
                      {combo.name}
                    </span>
                  </div>
                  <span className="font-bold text-pink-600 text-sm">
                    {formatCurrency(dateOrder.comboPrice)}
                  </span>
                </div>
                {combo.items.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {combo.items.map((item, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white rounded text-xs text-gray-600 border border-gray-100"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Date/Time + Description */}
        <div className="p-6 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Calendar className="w-5 h-5 text-pink-500" />
              <div>
                <p className="text-xs text-gray-500">Ngày & giờ</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {formatDateTime(dateOrder.dateTime)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Users className="w-5 h-5 text-pink-500" />
              <div>
                <p className="text-xs text-gray-500">Ứng viên</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {dateOrder.applicantCount} người
                </p>
              </div>
            </div>
          </div>

          {dateOrder.description && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-700 italic">
                &quot;{dateOrder.description}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Pricing Breakdown */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-pink-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Chi tiết chi phí</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Combo</span>
              <span className="font-medium">{formatCurrency(dateOrder.comboPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Phí nền tảng (mỗi người)</span>
              <span className="font-medium">{formatCurrency(PLATFORM_FEE_PER_PERSON)}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-900">Người tạo trả</span>
              <span className="font-bold text-pink-600">
                {formatCurrency(dateOrder.creatorTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Đối phương trả</span>
              <span className="font-medium">
                {formatCurrency(dateOrder.applicantTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Matched User Section */}
        {isMatched && matchedUser && (
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">
              Đối phương đã được ghép
            </h3>
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
              <DiceBearAvatar
                userId={matchedUser.id}
                size="lg"
                showVipBadge={
                  !!matchedUser?.vipStatus?.tier &&
                  matchedUser.vipStatus.tier !== 'free'
                }
                vipTier={matchedUser?.vipStatus?.tier}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">
                  {matchedUser.name || 'Ẩn danh'}
                </p>
                {matchedUser.occupation && (
                  <p className="text-sm text-gray-500">{matchedUser.occupation}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center italic">
              Đây là buổi hẹn hò ẩn danh - không có chat trước khi gặp mặt!
            </p>
          </div>
        )}

        {/* Completed: Review Section */}
        {isCompleted && isInvolved && (
          <div className="p-6 border-b border-gray-100">
            <Link
              href={`/date/${orderId}/review`}
              className="block w-full py-3 bg-pink-500 text-white rounded-xl font-semibold text-center text-sm hover:bg-pink-600 transition"
            >
              Đánh giá buổi hẹn
            </Link>
          </div>
        )}

        </div>{/* End left column of 2-col grid */}

        {/* Right Column (desktop sidebar for actions/applicants) */}
        <div className="lg:border-l lg:border-gray-100">

        {/* Creator View: Applicants List */}
        {isCreator && isActive && (
          <div className="p-6 bg-gray-50 lg:bg-white">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
              <Users className="w-5 h-5 text-gray-600" />
              Danh sách ứng tuyển ({applications.length})
            </h3>

            {appsLoading ? (
              <div className="py-6 text-center text-gray-500 text-sm">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Đang tải ứng viên...
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 italic">
                  Chưa có ai ứng tuyển. Chia sẻ đơn của bạn để có người tham gia!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {applications.map((app) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <DiceBearAvatar
                          userId={app.applicantId}
                          size="md"
                          showVipBadge={
                            !!app.applicant?.vipStatus?.tier &&
                            app.applicant.vipStatus.tier !== 'free'
                          }
                          vipTier={app.applicant?.vipStatus?.tier}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-gray-900 text-sm">
                              {app.applicant?.name || 'Ẩn danh'}
                            </p>
                            {app.status === 'pending' && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                                Chờ duyệt
                              </span>
                            )}
                            {app.status === 'accepted' && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                Đã chấp nhận
                              </span>
                            )}
                            {app.status === 'rejected' && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                                Đã từ chối
                              </span>
                            )}
                          </div>

                          {app.message && (
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg italic mb-2">
                              &quot;{app.message}&quot;
                            </p>
                          )}

                          {app.status === 'pending' && (
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.97 }}
                              onClick={() =>
                                handleAccept(app.id, app.applicantId)
                              }
                              disabled={
                                accepting || processingAppId === app.id
                              }
                              className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition flex items-center justify-center gap-1.5"
                            >
                              {processingAppId === app.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              Chấp nhận
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* Non-creator View: Apply Form */}
        {!isCreator && isActive && !myApplicationLoading && !hasApplied && user && (
          <div className="p-6">
            <AnimatePresence mode="wait">
              {showApplyForm ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <textarea
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    placeholder="Giới thiệu bản thân ngắn gọn..."
                    rows={3}
                    maxLength={200}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none resize-none text-sm"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowApplyForm(false)}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition text-sm"
                    >
                      Hủy
                    </button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={handleApply}
                      disabled={!applyMessage.trim() || applying}
                      className={cn(
                        'flex-1 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 text-sm',
                        applyMessage.trim() && !applying
                          ? 'bg-pink-500 text-white hover:bg-pink-600'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      {applying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Ứng tuyển
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="cta"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowApplyForm(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-bold hover:opacity-90 transition shadow-lg text-sm"
                >
                  Ứng tuyển đi date
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Non-creator: Already applied */}
        {!isCreator && hasApplied && (
          <div className="p-6 bg-green-50">
            <p className="text-center text-green-600 font-medium flex items-center justify-center gap-2 text-sm">
              <CheckCircle className="w-5 h-5" />
              {myApplicationStatus === 'accepted'
                ? 'Bạn đã được chấp nhận cho buổi hẹn này'
                : myApplicationStatus === 'rejected'
                  ? 'Đơn ứng tuyển của bạn chưa được chọn'
                  : 'Bạn đã ứng tuyển Date Order này'}
            </p>
          </div>
        )}

        {/* Not logged in CTA */}
        {!user && isActive && (
          <div className="p-6">
            <Link
              href="/login"
              className="block w-full py-3.5 bg-pink-500 text-white rounded-xl font-bold text-center text-sm hover:bg-pink-600 transition"
            >
              Đăng nhập để ứng tuyển
            </Link>
          </div>
        )}

        </div>{/* End right column */}
      </div>{/* End 2-col grid */}
    </div>
  );
}
