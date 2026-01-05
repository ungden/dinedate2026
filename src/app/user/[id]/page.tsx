'use client';

import { useMemo, useState } from 'react';
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
  Wallet,
  Calendar,
  Clock,
  Zap,
  Sparkles,
  Images as GalleryIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Lock,
  CreditCard,
  QrCode,
  Loader2,
  Mic2
} from 'lucide-react';
import { cn, formatCurrency, formatRelativeTime, getVIPBadgeColor, getActivityIcon, getActivityLabel, isNewPartner, isQualityPartner } from '@/lib/utils';
import { ServiceOffering } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { useDbUserProfile } from '@/hooks/useDbUserProfile';
import { createBookingViaEdge } from '@/lib/booking';
import { motion, AnimatePresence } from '@/lib/motion';
import TopupModal from '@/components/TopupModal';
import VoiceIntro from '@/components/VoiceIntro'; // Import VoiceIntro

const SESSION_HOURS = 3;

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { user: authUser } = useAuth();
  const { user, services: dbServices, reviews, rating, loading } = useDbUserProfile(userId);

  const services = useMemo(() => {
    const list = dbServices || [];
    return list.filter((s) => s.available);
  }, [dbServices]);

  const isCurrentUser = !!authUser && !!user && authUser.id === user.id;

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [viewingImageIndex, setViewingImageIndex] = useState<number | null>(null);

  const selectedService: ServiceOffering | null =
    services.find((s) => s.id === selectedServiceId) || null;

  // Giá niêm yết là giá cuối cùng User phải trả
  const totalPrice = selectedService?.price || 0;

  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '19:00',
    location: '',
    message: '',
  });

  const [isBooking, setIsBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);

  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    actionType: 'book' | 'like' | 'generic';
  }>({
    isOpen: false,
    actionType: 'generic',
  });

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
          Quay lại danh sách Partner
        </Link>
      </div>
    );
  }

  const coverImage = user.images?.[0] || user.avatar;
  const gallery = user.images || [user.avatar];
  const isNew = isNewPartner(user.createdAt);
  const isQuality = isQualityPartner(rating, user.reviewCount);

  const canSeeAge = authUser?.vipStatus.tier === 'vip' || authUser?.vipStatus.tier === 'svip' || isCurrentUser;
  const displayAge = canSeeAge && user.age ? `, ${user.age}` : '';

  const openBookingForService = (serviceId: string) => {
    if (isCurrentUser) return;
    
    // Check Phone before booking
    if (!authUser?.phone) {
        toast.error('Vui lòng cập nhật số điện thoại trước khi đặt lịch');
        // A global modal handler or redirect to profile edit would go here. 
        // For now, simpler toast guidance:
        setTimeout(() => router.push('/profile/edit'), 1500);
        return;
    }

    setSelectedServiceId(serviceId);
    setBookingForm({ date: '', time: '19:00', location: '', message: '' });
  };

  const executeBooking = async () => {
    if (!authUser || !selectedServiceId) return;
    setIsBooking(true);

    try {
      const res = await createBookingViaEdge({
        providerId: user.id,
        serviceId: selectedServiceId,
        date: bookingForm.date,
        time: bookingForm.time,
        location: bookingForm.location,
        message: bookingForm.message,
        durationHours: SESSION_HOURS,
      });

      if (res?.bookingId) {
        alert('Đã tạo booking thành công! 🎉');
        setSelectedServiceId(null);
        setShowPaymentModal(false);
      }
    } catch (err: any) {
      const msg = (err?.context?.body?.message || err?.message || '').toString();
      if (msg.includes('INSUFFICIENT_FUNDS')) {
        alert('Số dư không đủ. Vui lòng nạp thêm tiền.');
      } else {
        alert('Lỗi: ' + msg);
      }
    } finally {
      setIsBooking(false);
    }
  };

  const handlePreBooking = () => {
    if (!authUser) {
      setAuthModal({ isOpen: true, actionType: 'book' });
      return;
    }
    if (!selectedServiceId || !bookingForm.date || !bookingForm.location) return;
    
    // Open Payment Selection
    setShowPaymentModal(true);
  };

  return (
    <div className="max-w-4xl mx-auto pb-28">
      {/* Top media */}
      <div className="relative group cursor-pointer" onClick={() => setViewingImageIndex(0)}>
        <div className="relative aspect-[3/4] md:aspect-[16/9] overflow-hidden rounded-b-[32px] shadow-lg">
          <Image src={coverImage} alt={user.name} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
        </div>
        
        {/* Gallery Indicator */}
        {gallery.length > 1 && (
          <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-white/20">
            <GalleryIcon className="w-3.5 h-3.5" />
            <span>1 / {gallery.length}</span>
          </div>
        )}

        {/* Top controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow flex items-center justify-center hover:bg-white transition"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => !authUser && setAuthModal({ isOpen: true, actionType: 'like' })}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow flex items-center justify-center hover:bg-white transition"
              aria-label="Yêu thích"
            >
              <Heart className="w-5 h-5 text-gray-800" />
            </button>
            <button
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow flex items-center justify-center hover:bg-white transition"
              aria-label="Chia sẻ"
            >
              <Share2 className="w-5 h-5 text-gray-800" />
            </button>
          </div>
        </div>
      </div>

      {/* Main info card */}
      <div className="-mt-10 px-4 relative z-10">
        <div className="bg-white rounded-[32px] shadow-soft border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div className="relative w-20 h-20 rounded-[20px] overflow-hidden ring-4 ring-white shadow-md flex-shrink-0">
              <Image src={user.avatar} alt={user.name} fill className="object-cover" />
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-[24px] font-black text-gray-900 truncate tracking-tight">
                      {user.name}{displayAge}
                    </h1>
                    {/* Lock Icon if age hidden */}
                    {!canSeeAge && user.age > 0 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-500 border border-gray-200">
                        <Lock className="w-2.5 h-2.5" />
                        <span>VIP</span>
                      </div>
                    )}

                    {isNew && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-blue-100 text-blue-600 flex-shrink-0">
                        Mới
                      </span>
                    )}
                    {isQuality && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-orange-100 text-orange-600 flex items-center gap-0.5 flex-shrink-0">
                        <Zap className="w-3 h-3 fill-orange-600" /> Uy tín
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span className="truncate max-w-[200px] font-medium">{user.location}</span>
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 rounded-lg border border-yellow-100">
                      <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                      <span className="font-black text-yellow-700">{rating ? rating.toFixed(1) : '5.0'}</span>
                      <span className="text-yellow-600 text-xs">({user.reviewCount || reviews.length})</span>
                    </span>
                  </div>
                </div>

                {user.vipStatus.tier !== 'free' && (
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-xl text-[11px] font-black text-white uppercase tracking-tight flex-shrink-0',
                      getVIPBadgeColor(user.vipStatus.tier)
                    )}
                  >
                    {user.vipStatus.tier}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Voice Intro */}
          {user.voiceIntroUrl && (
            <div className="mt-5">
                <VoiceIntro audioUrl={user.voiceIntroUrl} userName={user.name} />
            </div>
          )}

          {/* Bio */}
          <div className="mt-5">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-2">Giới thiệu</h3>
            {user.bio ? (
                <p className="text-[15px] text-gray-600 leading-relaxed font-medium">
                {user.bio}
                </p>
            ) : (
                <p className="text-sm text-gray-400 italic">Chưa có mô tả.</p>
            )}
          </div>

          {/* Personality Tags */}
          {user.personalityTags && user.personalityTags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
                {user.personalityTags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold border border-gray-200">
                        #{tag}
                    </span>
                ))}
            </div>
          )}

          {/* Trust badges */}
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm text-green-600 border border-green-100">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-green-900">Thanh toán Escrow</p>
                  <p className="text-green-800/80 text-[12px] leading-snug">
                    Tiền được giữ an toàn cho đến khi hoàn thành
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm text-green-600 border border-green-100">
                  <BadgeCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-green-900">Partner xác thực</p>
                  <p className="text-green-800/80 text-[12px] leading-snug">
                    Đã kiểm tra số điện thoại và thông tin
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="px-4 mt-8 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            Dịch vụ
          </h2>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {services.length}
          </span>
        </div>

        {services.length === 0 ? (
          <div className="bg-white rounded-[24px] border border-gray-100 p-8 text-center shadow-sm">
            <div className="text-5xl mb-3 opacity-50">📭</div>
            <p className="font-bold text-gray-900">Chưa có dịch vụ</p>
            <p className="text-sm text-gray-500 mt-1">Partner này đang cập nhật danh sách dịch vụ.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => {
              const selectedForThis = selectedServiceId === service.id;

              return (
                <div key={service.id} className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-3xl flex-shrink-0 border border-gray-100 shadow-inner">
                        {getActivityIcon(service.activity)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[17px] font-black text-gray-900 truncate leading-tight">{service.title}</p>
                            <p className="text-[13px] text-gray-500 font-bold mt-1 uppercase tracking-wide">
                              {getActivityLabel(service.activity)}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Giá trọn gói</p>
                            <p className="text-[18px] font-black text-rose-600 leading-none mt-0.5">
                              {formatCurrency(service.price || 0)}
                            </p>
                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                                /{service.duration === 'day' ? 'ngày' : '3h'}
                            </p>
                          </div>
                        </div>

                        {service.description ? (
                          <p className="text-[14px] text-gray-600 mt-3 line-clamp-2 leading-relaxed bg-gray-50 p-2.5 rounded-xl">
                            {service.description}
                          </p>
                        ) : null}

                        {/* Primary action */}
                        <div className="mt-4">
                          <button
                            onClick={() => openBookingForService(service.id)}
                            className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                          >
                            <Calendar className="w-4 h-4" />
                            Đặt lịch ngay
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedForThis && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="px-5 pb-5 -mt-2 bg-gray-50/50 border-t border-gray-100"
                    >
                      <div className="pt-4">
                        <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-500" />
                            Thông tin đặt lịch
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                              Ngày hẹn
                            </label>
                            <input
                              type="date"
                              value={bookingForm.date}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                              className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-medium text-sm transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                              Giờ bắt đầu
                            </label>
                            <input
                              type="time"
                              value={bookingForm.time}
                              onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                              className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-medium text-sm transition-all"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                              Địa điểm gặp mặt
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                type="text"
                                value={bookingForm.location}
                                onChange={(e) => setBookingForm({ ...bookingForm, location: e.target.value })}
                                placeholder="VD: Quán cafe ABC, Quận 1"
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-medium text-sm transition-all"
                                />
                            </div>
                          </div>

                          <div className="col-span-2">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                              Lời nhắn (tuỳ chọn)
                            </label>
                            <textarea
                              value={bookingForm.message}
                              onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                              placeholder="Ghi chú ngắn cho Partner..."
                              rows={2}
                              className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm font-medium resize-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={() => setSelectedServiceId(null)}
                            disabled={isBooking}
                            className={cn(
                              'flex-1 py-3 rounded-xl font-bold text-sm transition',
                              isBooking ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            )}
                          >
                            Đóng
                          </button>
                          <button
                            onClick={handlePreBooking}
                            disabled={isBooking || !bookingForm.date || !bookingForm.location}
                            className={cn(
                              'flex-[2] py-3 rounded-xl font-bold text-sm transition shadow-lg flex items-center justify-center gap-2',
                              isBooking || !bookingForm.date || !bookingForm.location
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                : 'bg-gradient-primary text-white hover:opacity-90 active:scale-[0.98]'
                            )}
                          >
                            {isBooking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Xác nhận & Thanh toán
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Auth modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        actionType={authModal.actionType}
      />

      {/* Payment Selection Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl"
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-md">
                <h3 className="text-lg font-black text-gray-900">Thanh toán</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="text-center">
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Tổng tiền cần thanh toán</p>
                  <p className="text-4xl font-black text-gray-900 tracking-tight">{formatCurrency(totalPrice)}</p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                  <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed font-medium">
                    <b>Bảo vệ Escrow:</b> Tiền của bạn được giữ an toàn bởi hệ thống. Partner chỉ nhận được tiền sau khi bạn xác nhận hoàn thành dịch vụ.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={executeBooking}
                    disabled={isBooking || (authUser?.wallet.balance || 0) < totalPrice}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-primary-500 hover:bg-primary-50 transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-white group-hover:text-primary-500 transition-colors">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900">Ví của tôi</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Số dư: <span className="font-bold text-gray-700">{formatCurrency(authUser?.wallet.balance || 0)}</span></p>
                      </div>
                    </div>
                    {isBooking ? <Loader2 className="w-5 h-5 animate-spin text-primary-500" /> : <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500" />}
                  </button>

                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setShowTopupModal(true);
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-green-500 hover:bg-green-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-white group-hover:text-green-500 transition-colors">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900">Quét mã QR</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Chuyển khoản & Tự động book</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Topup Modal for Single Bill */}
      {showTopupModal && selectedServiceId && (
        <TopupModal
          isOpen={showTopupModal}
          onClose={() => setShowTopupModal(false)}
          amount={totalPrice}
          title="Thanh toán đơn hàng"
          onSuccess={() => {
            // Wait a bit for modal to close visual logic then execute
            setTimeout(() => executeBooking(), 500);
          }}
        />
      )}

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {viewingImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center touch-none"
            onClick={() => setViewingImageIndex(null)}
          >
            <button 
              onClick={() => setViewingImageIndex(null)}
              className="absolute top-4 right-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 z-50 backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Prev */}
            {gallery.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : gallery.length - 1));
                }}
                className="absolute left-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 backdrop-blur-sm z-50 hidden sm:block"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            {/* Image */}
            <motion.div 
              className="relative w-full h-full max-w-5xl max-h-[85vh] mx-2"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={viewingImageIndex}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={gallery[viewingImageIndex]}
                alt={`Gallery ${viewingImageIndex}`}
                fill
                className="object-contain"
                priority
              />
            </motion.div>

            {/* Next */}
            {gallery.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingImageIndex((prev) => (prev !== null && prev < gallery.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 backdrop-blur-sm z-50 hidden sm:block"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
            
            {/* Counter */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white font-bold text-sm border border-white/10">
              {viewingImageIndex + 1} / {gallery.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}