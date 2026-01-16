'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Power,
  DollarSign,
  Clock,
  Calendar,
  TrendingUp,
  Bell,
  CheckCircle,
  XCircle,
  MapPin,
  Star,
  ChevronRight,
  Zap,
  Timer,
  Loader2,
  Sparkles,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { formatCurrency, cn } from '@/lib/utils';
import { ServiceBooking } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useDbBookings } from '@/hooks/useDbBookings';
import { useMyFeaturedStatus } from '@/hooks/useDbFeaturedPartners';
import { mapDbUserToUser } from '@/lib/user-mapper';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePartnerAnalytics, AnalyticsPeriod } from '@/hooks/usePartnerAnalytics';

// Analytics Components
import EarningsChart from '@/components/partner/EarningsChart';
import BookingStats from '@/components/partner/BookingStats';
import ProfileViewsCard from '@/components/partner/ProfileViewsCard';
import TopServicesCard from '@/components/partner/TopServicesCard';
import RecentReviewsCard from '@/components/partner/RecentReviewsCard';

const periodLabels: Record<AnalyticsPeriod, string> = {
  '7d': '7 ngay',
  '30d': '30 ngay',
  'all': 'Tat ca',
};

export default function PartnerDashboardClient() {
  const { user: authUser, updateUser, refreshProfile } = useAuth();

  const [isOnline, setIsOnline] = useState(true);
  const [incomingRequest, setIncomingRequest] = useState<ServiceBooking | null>(null);
  const [countdown, setCountdown] = useState(300);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  const { currentUser } = useDateStore();
  const { reload: reloadBookings, accept: acceptBooking, reject: rejectBooking } = useDbBookings();
  const { slot: featuredSlot, isActive: isFeatured } = useMyFeaturedStatus(authUser?.id);

  // Analytics hook
  const analytics = usePartnerAnalytics();

  useEffect(() => {
    // Sync local toggle from auth user / store
    const online = authUser?.onlineStatus?.isOnline ?? currentUser?.onlineStatus?.isOnline ?? true;
    setIsOnline(online);
  }, [authUser?.onlineStatus?.isOnline, currentUser?.onlineStatus?.isOnline]);

  const setPartnerOnline = async (next: boolean) => {
    if (!authUser?.id) return;

    setIsOnline(next);

    // update DB so partner list will hide/show immediately
    await updateUser({
      onlineStatus: { isOnline: next },
      availableNow: next, // simple MVP: online == available_now
    } as any);

    await refreshProfile();

    toast.success(next ? 'Ban dang hien thi tren danh sach Partner' : 'Ban da an khoi danh sach Partner');
  };

  // Realtime Subscription
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel('partner-dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `partner_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          if (!isOnline) return;

          const newBooking = payload.new;
          if (newBooking.status !== 'pending') return;

          setLoadingRequest(true);
          const { data: fullBooking, error } = await supabase
            .from('bookings')
            .select(
              `
                            *,
                            booker:users!bookings_user_id_fkey(*),
                            service:services!bookings_service_id_fkey(*)
                        `
            )
            .eq('id', newBooking.id)
            .single();

          setLoadingRequest(false);

          if (!error && fullBooking) {
            const mappedBooking: any = {
              id: fullBooking.id,
              serviceId: fullBooking.service_id,
              providerId: fullBooking.partner_id,
              bookerId: fullBooking.user_id,
              booker: mapDbUserToUser(fullBooking.booker),
              service: fullBooking.service,
              date: fullBooking.start_time?.split('T')[0],
              time: fullBooking.start_time
                ? new Date(fullBooking.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                : '',
              location: fullBooking.meeting_location,
              message: '',
              status: fullBooking.status,
              isPaid: true,
              escrowAmount: fullBooking.total_amount,
              createdAt: fullBooking.created_at,
              updatedAt: fullBooking.updated_at,
            };

            setIncomingRequest(mappedBooking);
            setCountdown(300);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, isOnline]);

  // Countdown timer
  useEffect(() => {
    if (incomingRequest && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (countdown === 0 && incomingRequest) {
      setIncomingRequest(null);
    }
  }, [incomingRequest, countdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    if (!incomingRequest) return;
    setProcessingAction(true);
    try {
        await acceptBooking(incomingRequest.id);
        setIncomingRequest(null);
        toast.success('Da chap nhan yeu cau!');
        reloadBookings();
        analytics.refresh();
    } catch (e: any) {
        toast.error('Loi: ' + e.message);
    } finally {
        setProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!incomingRequest) return;
    setProcessingAction(true);
    try {
        await rejectBooking(incomingRequest.id);
        setIncomingRequest(null);
        toast.success('Da tu choi yeu cau. Tien da duoc hoan lai cho khach.');
        reloadBookings();
        analytics.refresh();
    } catch (e: any) {
        toast.error('Loi: ' + e.message);
    } finally {
        setProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Toggle */}
      <motion.div
        className="bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 rounded-3xl p-6 text-white relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-300 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Partner Dashboard</h1>
              <p className="text-white/80">Xin chao, {currentUser?.name || authUser?.name}!</p>
            </div>

            {/* Status Toggle */}
            <motion.button
              onClick={() => setPartnerOnline(!isOnline)}
              className={cn(
                'flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold transition-all',
                isOnline ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-gray-700/70 shadow-lg shadow-gray-900/20'
              )}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Power className="w-5 h-5" />
              <span>{isOnline ? 'Dang hien thi' : 'Dang an'}</span>
              <motion.div className={cn('w-3 h-3 rounded-full', isOnline ? 'bg-white animate-pulse' : 'bg-gray-300')} />
            </motion.button>
          </div>

          {/* Key Metrics Cards in Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-yellow-300" />
                <span className="text-white/80 text-xs">Tong thu nhap</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(analytics.earnings?.total || 0)}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span className="text-white/80 text-xs">Don hoan thanh</span>
              </div>
              <p className="text-xl font-bold">{analytics.earnings?.completedBookings || 0}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-300" />
                <span className="text-white/80 text-xs">Ti le chap nhan</span>
              </div>
              <p className="text-xl font-bold">{analytics.bookingStats?.acceptanceRate?.toFixed(0) || 0}%</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <span className="text-white/80 text-xs">Diem danh gia</span>
              </div>
              <p className="text-xl font-bold">{analytics.averageRating?.toFixed(1) || '0.0'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOnline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-800">Ban dang hien thi tren danh sach Partner</p>
              <p className="text-sm text-green-600">Ban co the tat de an minh khoi danh sach.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Section */}
      <motion.div
        className="bg-white rounded-2xl border border-gray-100 p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Thong ke chi tiet</h2>
              <p className="text-xs text-gray-500">Phan tich hoat dong cua ban</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Period Selector */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              {(['7d', '30d', 'all'] as AnalyticsPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => analytics.setPeriod(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    analytics.period === p
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <motion.button
              onClick={() => analytics.refresh()}
              disabled={analytics.loading}
              className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={cn('w-5 h-5', analytics.loading && 'animate-spin')} />
            </motion.button>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Earnings Chart - Full width on mobile, full on desktop as well */}
          <div className="md:col-span-2">
            <EarningsChart
              data={analytics.earnings?.daily || []}
              total={analytics.earnings?.total || 0}
              completedBookings={analytics.earnings?.completedBookings || 0}
              loading={analytics.loading}
            />
          </div>

          {/* Booking Stats */}
          <BookingStats data={analytics.bookingStats} loading={analytics.loading} />

          {/* Profile Views */}
          <ProfileViewsCard data={analytics.profileViews} loading={analytics.loading} />

          {/* Top Services */}
          <TopServicesCard data={analytics.topServices} loading={analytics.loading} />

          {/* Recent Reviews */}
          <RecentReviewsCard
            reviews={analytics.recentReviews}
            averageRating={analytics.averageRating}
            loading={analytics.loading}
          />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Quan ly nhanh</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <Link href="/manage-bookings" className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Quan ly don dat</p>
                <p className="text-sm text-gray-500">Xem lich su va trang thai</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>

          <Link href="/manage-services" className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Dich vu cua toi</p>
                <p className="text-sm text-gray-500">Cap nhat gia va dich vu</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>

          <Link href="/boost-profile" className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isFeatured
                  ? "bg-gradient-to-br from-amber-400 to-orange-500"
                  : "bg-amber-100"
              )}>
                <Sparkles className={cn("w-5 h-5", isFeatured ? "text-white" : "text-amber-600")} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Tang luot xem</p>
                {isFeatured && featuredSlot ? (
                  <p className="text-sm text-green-600 font-medium">
                    Dang noi bat den {new Date(featuredSlot.end_date).toLocaleDateString('vi-VN')}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Hien thi noi bat ho so</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isFeatured && (
                <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[10px] font-bold rounded-full">
                  ACTIVE
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
        </div>
      </motion.div>

      <AnimatePresence>
        {incomingRequest && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-t-3xl w-full max-w-md overflow-hidden"
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="bg-gradient-to-r from-primary-500 to-purple-500 p-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 animate-bounce" />
                    <span className="font-bold">Don moi!</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                    <Timer className="w-4 h-4" />
                    <span className="font-mono font-bold">{formatCountdown(countdown)}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <Image src={incomingRequest.booker.avatar} alt={incomingRequest.booker.name} width={60} height={60} className="rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{incomingRequest.booker.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{incomingRequest.booker.rating || 'Moi'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">{formatCurrency(incomingRequest.escrowAmount)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-xl">🍽️</div>
                    <div>
                      <p className="font-medium text-gray-900">{incomingRequest.service.title}</p>
                      <p className="text-sm text-gray-500">{incomingRequest.service.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {incomingRequest.time}, {incomingRequest.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{incomingRequest.location}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    onClick={handleReject}
                    disabled={processingAction}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {processingAction ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                    <span>Tu choi</span>
                  </motion.button>
                  <motion.button
                    onClick={handleAccept}
                    disabled={processingAction}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {processingAction ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    <span>Chap nhan</span>
                  </motion.button>
                </div>

                {loadingRequest && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Dang tai chi tiet...
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
