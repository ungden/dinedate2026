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
} from 'lucide-react';
import { cn, formatCurrency, formatRelativeTime, getVIPBadgeColor, getActivityIcon, getActivityLabel, isNewPartner, isQualityPartner } from '@/lib/utils';
import { ServiceOffering } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { PLATFORM_FEE_RATE } from '@/lib/platform';
import { useDbUserProfile } from '@/hooks/useDbUserProfile';
import { createBookingViaEdge } from '@/lib/booking';
import { motion, AnimatePresence } from '@/lib/motion';

const SESSION_HOURS = 3;

function calcSessionTotals(sessionPrice: number) {
  const subTotal = sessionPrice;
  const platformFee = Math.round(subTotal * PLATFORM_FEE_RATE);
  return { subTotal, platformFee, total: subTotal + platformFee };
}

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

  const sessionPrice = selectedService?.price || 0;
  const pricing = calcSessionTotals(sessionPrice);

  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '19:00',
    location: '',
    message: '',
  });

  const [isBooking, setIsBooking] = useState(false);

  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    actionType: 'book' | 'like' | 'generic';
  }>({
    isOpen: false,
    actionType: 'generic',
  });

  if (loading) {
    return <div className="py-20 text-center text-gray-500 font-medium">Đang tải hồ sơ...</div>;
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

  // VIP Logic to see age
  const canSeeAge = authUser?.vipStatus.tier === 'vip' || authUser?.vipStatus.tier === 'svip' || isCurrentUser;
  const displayAge = canSeeAge && user.age ? `, ${user.age}` : '';

  const openBookingForService = (serviceId: string) => {
    if (isCurrentUser) return;
    setSelectedServiceId(serviceId);
    setBookingForm({ date: '', time: '19:00', location: '', message: '' });
  };

  const handleBook = async () => {
    if (!authUser) {
      setAuthModal({ isOpen: true, actionType: 'book' });
      return;
    }
    if (!selectedServiceId) return;
    if (!bookingForm.date || !bookingForm.location) return;

    setIsBooking(true);

    const providerId = user.id;

    const res = await createBookingViaEdge({
      providerId,
      serviceId: selectedServiceId,
      date: bookingForm.date,
      time: bookingForm.time,
      location: bookingForm.location,
      message: bookingForm.message,
      durationHours: SESSION_HOURS,
    }).catch((err: any) => {
      const msg = (err?.context?.body?.message || err?.message || '').toString();
      if (msg.includes('INSUFFICIENT_FUNDS')) {
        alert('Số dư không đủ. Vui lòng nạp thêm tiền.');
        return null;
      }
      throw err;
    });

    setIsBooking(false);

    if (!res) return;

    alert('Đã tạo booking thành công! 🎉');
    setSelectedServiceId(null);
  };

  return (
    <div className="max-w-4xl mx-auto pb-28">
      {/* Top media */}
      <div className="relative group cursor-pointer" onClick={() => setViewingImageIndex(0)}>
        <div className="relative aspect-[3/4] md:aspect-[16/9] overflow-hidden rounded-b-[28px]">
          <Image src={coverImage} alt={user.name} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
        </div>
        
        {/* Gallery Indicator */}
        {gallery.length > 1 && (
          <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
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
        <div className="bg-white rounded-[28px] shadow-soft border border-gray-100 p-5">
          <div className="flex items-start gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-white shadow-sm flex-shrink-0">
              <Image src={user.avatar} alt={user.name} fill className="object-cover" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-[22px] font-black text-gray-900 truncate">
                      {user.name}{displayAge}
                    </h1>
                    {/* Lock Icon if age hidden */}
                    {!canSeeAge && user.age > 0 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-500">
                        <Lock className="w-2.5 h-2.5" />
                        <span>VIP xem tuổi</span>
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
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      <span className="truncate max-w-[220px]">{user.location}</span>
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-yellow-700">{rating ? rating.toFixed(1) : '5.0'}</span>
                      <span className="text-gray-400">({user.reviewCount || reviews.length} đánh giá)</span>
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

              {user.bio ? (
                <p className="text-[14px] text-gray-600 mt-3 line-clamp-2">{user.bio}</p>
              ) : (
                <p className="text-[14px] text-gray-400 mt-3 italic">Chưa có mô tả.</p>
              )}
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-4 bg-green-50 border border-green-100 rounded-2xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="font-bold text-green-900">Giao dịch qua ví</p>
                  <p className="text-green-800/80 text-[13px] leading-snug">
                    Thanh toán giữ trong escrow, an toàn hơn
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <BadgeCheck className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="font-bold text-green-900">Giá theo buổi</p>
                  <p className="text-green-800/80 text-[13px] leading-snug">
                    Mỗi booking là 1 buổi ({SESSION_HOURS} giờ), không tính theo giờ
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Small meta row */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {user.onlineStatus?.isOnline ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full font-bold">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                Đang hoạt động
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full font-bold">
                Hoạt động {user.onlineStatus?.lastSeen ? formatRelativeTime(user.onlineStatus.lastSeen) : 'gần đây'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      {gallery.length > 0 && (
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-black text-gray-900 flex items-center gap-2">
              <GalleryIcon className="w-5 h-5 text-primary-500" />
              Thư viện ảnh
            </h2>
            <span className="text-xs font-bold text-gray-400">{gallery.length} ảnh</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {gallery.slice(0, 6).map((img, idx) => (
              <motion.div
                key={idx}
                className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 cursor-pointer border border-gray-100"
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewingImageIndex(idx)}
              >
                <Image src={img} alt={`Gallery ${idx}`} fill className="object-cover" />
                {idx === 5 && gallery.length > 6 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm">
                    +{gallery.length - 6}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      <div className="px-4 mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-black text-gray-900">Dịch vụ</h2>
          <span className="text-[12px] font-bold text-gray-400">
            {services.length} dịch vụ
          </span>
        </div>

        {services.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-gray-100 p-6 text-center">
            <div className="text-5xl mb-3">🧾</div>
            <p className="font-bold text-gray-900">Chưa có dịch vụ hiển thị</p>
            <p className="text-sm text-gray-500 mt-1">Partner có thể bật “Có sẵn” trong mục Quản lý dịch vụ.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => {
              const selectedForThis = selectedServiceId === service.id;
              const totalForThis = calcSessionTotals(service.price || 0).total;

              return (
                <div key={service.id} className="bg-white rounded-[28px] border border-gray-100 shadow-soft overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                        {getActivityIcon(service.activity)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[16px] font-black text-gray-900 truncate">{service.title}</p>
                            <p className="text-[12px] text-gray-500 font-medium mt-0.5">
                              {getActivityLabel(service.activity)}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[12px] text-gray-400 font-bold">Giá</p>
                            <p className="text-[18px] font-black text-gray-900 leading-none">
                              {formatCurrency(service.price || 0)}
                              <span className="text-[11px] text-gray-400 font-bold ml-0.5">
                                /{service.duration === 'day' ? 'ngày' : 'buổi'}
                              </span>
                            </p>
                          </div>
                        </div>

                        {service.description ? (
                          <p className="text-[13px] text-gray-600 mt-2 line-clamp-2">{service.description}</p>
                        ) : null}

                        {/* Primary action */}
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[12px] text-gray-400 font-bold">Tổng (đã gồm phí)</p>
                            <p className="text-[20px] font-black text-primary-600 leading-none">
                              {formatCurrency(totalForThis)}
                            </p>
                          </div>

                          <button
                            onClick={() => openBookingForService(service.id)}
                            className="px-5 py-3 rounded-2xl bg-gradient-primary text-white font-black shadow-primary hover:opacity-90 transition flex items-center justify-center gap-2"
                          >
                            Đặt ngay
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedForThis && (
                    <div className="px-5 pb-5 -mt-2">
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                              Ngày
                            </label>
                            <div className="mt-2 relative">
                              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="date"
                                value={bookingForm.date}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-primary-500/20 outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                              Giờ bắt đầu
                            </label>
                            <div className="mt-2 relative">
                              <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="time"
                                value={bookingForm.time}
                                onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-primary-500/20 outline-none"
                              />
                            </div>
                          </div>

                          <div className="col-span-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                              Địa điểm
                            </label>
                            <input
                              type="text"
                              value={bookingForm.location}
                              onChange={(e) => setBookingForm({ ...bookingForm, location: e.target.value })}
                              placeholder="VD: Quán cafe ABC, Quận 1"
                              className="mt-2 w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                              Lời nhắn (tuỳ chọn)
                            </label>
                            <textarea
                              value={bookingForm.message}
                              onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                              placeholder="Ghi chú ngắn..."
                              rows={2}
                              className="mt-2 w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                            />
                          </div>
                        </div>

                        <div className="mt-4 bg-white rounded-xl border border-gray-100 p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">
                              Tạm tính ({service.duration === 'day' ? '1 ngày' : '1 buổi'})
                            </span>
                            <span className="font-black text-gray-900">{formatCurrency(pricing.subTotal)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-600 font-medium">Phí nền tảng (30%)</span>
                            <span className="font-black text-gray-900">{formatCurrency(pricing.platformFee)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                            <span className="font-black text-gray-900">Tổng</span>
                            <span className="font-black text-primary-600 text-lg">{formatCurrency(pricing.total)}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={() => setSelectedServiceId(null)}
                            disabled={isBooking}
                            className={cn(
                              'flex-1 py-3 rounded-xl font-black transition',
                              isBooking ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            )}
                          >
                            Đóng
                          </button>
                          <button
                            onClick={handleBook}
                            disabled={isBooking || !bookingForm.date || !bookingForm.location}
                            className={cn(
                              'flex-1 py-3 rounded-xl font-black transition shadow-primary',
                              isBooking || !bookingForm.date || !bookingForm.location
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-primary text-white hover:opacity-90'
                            )}
                          >
                            {isBooking ? 'Đang tạo...' : 'Xác nhận đặt'}
                          </button>
                        </div>
                      </div>
                    </div>
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