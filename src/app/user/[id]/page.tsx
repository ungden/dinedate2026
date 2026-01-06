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
  Mic2,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, formatCurrency, formatRelativeTime, getVIPBadgeColor, getActivityIcon, getActivityLabel, isNewPartner, isQualityPartner } from '@/lib/utils';
import { ServiceOffering } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { useDbUserProfile } from '@/hooks/useDbUserProfile';
import { createBookingViaEdge } from '@/lib/booking';
import { motion, AnimatePresence } from '@/lib/motion';
import TopupModal from '@/components/TopupModal';
import VoiceIntro from '@/components/VoiceIntro';

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

  // Optimize Images: Combine Avatar + Gallery if gallery is empty or short
  const rawGallery = user.images && user.images.length > 0 ? user.images : [user.avatar];
  // Ensure we have unique images
  const gallery = Array.from(new Set(rawGallery));

  const isNew = isNewPartner(user.createdAt);
  const isQuality = isQualityPartner(rating, user.reviewCount);

  const canSeeAge = authUser?.vipStatus.tier === 'vip' || authUser?.vipStatus.tier === 'svip' || isCurrentUser;
  const displayAge = canSeeAge && user.age ? `, ${user.age}` : '';

  const openBookingForService = (serviceId: string) => {
    if (isCurrentUser) return;
    
    if (!authUser?.phone) {
        toast.error('Vui lòng cập nhật số điện thoại trước khi đặt lịch');
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
    
    setShowPaymentModal(true);
  };

  // Grid Layout Logic
  const MainImage = gallery[0];
  const SubImages = gallery.slice(1, 3); // Max 2 sub images on preview
  const remainingCount = Math.max(0, gallery.length - 3);

  return (
    <div className="max-w-5xl mx-auto pb-28 md:pt-4 px-0 md:px-4">
      {/* Navigation & Actions (Desktop) */}
      <div className="hidden md:flex items-center justify-between mb-4">
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
        </div>
      </div>

      {/* Modern Photo Grid Gallery */}
      <div className="relative md:rounded-[32px] overflow-hidden bg-gray-100 mb-6">
        {/* Mobile: Horizontal Scroll Snap / Desktop: Grid */}
        <div className="md:grid md:grid-cols-4 md:gap-2 h-[400px] md:h-[500px] flex overflow-x-auto snap-x snap-mandatory md:overflow-visible hide-scrollbar">
            {/* Main Image (First) */}
            <div 
                className="relative w-full md:w-auto h-full flex-shrink-0 snap-center md:col-span-2 md:row-span-2 cursor-pointer group"
                onClick={() => setViewingImageIndex(0)}
            >
                <Image src={MainImage} alt="Main photo" fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                
                {/* Mobile Back Button Overlay */}
                <button onClick={(e) => { e.stopPropagation(); router.back(); }} className="md:hidden absolute top-4 left-4 p-2.5 bg-black/30 backdrop-blur-md text-white rounded-full z-20">
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </div>

            {/* Desktop: Side Images */}
            {SubImages.map((img, idx) => (
                <div 
                    key={idx}
                    className="hidden md:block relative w-full h-full cursor-pointer group overflow-hidden"
                    onClick={() => setViewingImageIndex(idx + 1)}
                >
                    <Image src={img} alt={`Photo ${idx + 1}`} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    
                    {/* Overlay for the last image if more exist */}
                    {idx === 1 && remainingCount > 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl backdrop-blur-[2px] transition-colors group-hover:bg-black/50">
                            +{remainingCount} ảnh
                        </div>
                    )}
                </div>
            ))}

            {/* Mobile: Remaining Images in Scroll */}
            {gallery.slice(1).map((img, idx) => (
                <div 
                    key={`mob-${idx}`}
                    className="md:hidden relative w-full h-full flex-shrink-0 snap-center"
                    onClick={() => setViewingImageIndex(idx + 1)}
                >
                    <Image src={img} alt={`Photo ${idx}`} fill className="object-cover" />
                </div>
            ))}
        </div>

        {/* Mobile Gallery Indicator */}
        <div className="md:hidden absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 pointer-events-none">
            <GalleryIcon className="w-3.5 h-3.5" />
            <span>{gallery.length} ảnh</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">
        {/* Left Column: Info */}
        <div className="lg:col-span-2 space-y-8">
            {/* Header Info */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{user.name}{displayAge}</h1>
                    {user.vipStatus.tier !== 'free' && (
                        <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black text-white uppercase shadow-sm', getVIPBadgeColor(user.vipStatus.tier))}>
                            {user.vipStatus.tier}
                        </span>
                    )}
                    {isQuality && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-600 flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-orange-600" /> Uy tín
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        <span>{user.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-gray-900">{rating.toFixed(1)}</span>
                        <span className="text-gray-400">({user.reviewCount} đánh giá)</span>
                    </div>
                </div>
            </div>

            {/* Voice Intro */}
            {user.voiceIntroUrl && (
                <div className="p-1">
                    <VoiceIntro audioUrl={user.voiceIntroUrl} userName={user.name} />
                </div>
            )}

            {/* About */}
            <div className="space-y-3">
                <h3 className="font-bold text-gray-900 text-lg">Giới thiệu</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-[15px]">
                    {user.bio || "Người dùng này chưa viết giới thiệu."}
                </p>
                
                {/* Tags */}
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

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-600 shadow-sm border border-green-100">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-green-900">Thanh toán Escrow</p>
                        <p className="text-sm text-green-800/80 mt-0.5">Tiền được giữ an toàn bởi hệ thống</p>
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
        </div>

        {/* Right Column: Services (Sticky on Desktop) */}
        <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-lg shadow-gray-200/50 p-6">
                    <h3 className="font-black text-gray-900 text-xl mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary-500" />
                        Dịch vụ ({services.length})
                    </h3>

                    {services.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>Chưa có dịch vụ nào.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {services.map((service) => (
                                <div key={service.id} className="group">
                                    <button
                                        onClick={() => openBookingForService(service.id)}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl border transition-all duration-200 hover:shadow-md",
                                            selectedServiceId === service.id 
                                                ? "bg-primary-50 border-primary-500 ring-1 ring-primary-500" 
                                                : "bg-white border-gray-200 hover:border-primary-300"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{getActivityIcon(service.activity)}</span>
                                                <span className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                                                    {service.title}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-black text-rose-600">{formatCurrency(service.price)}</span>
                                                <span className="text-[10px] text-gray-400 uppercase font-bold">/{service.duration === 'day' ? 'ngày' : '3h'}</span>
                                            </div>
                                        </div>
                                        {service.description && (
                                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                {service.description}
                                            </p>
                                        )}
                                    </button>

                                    {/* Inline Booking Form for Mobile/Desktop */}
                                    <AnimatePresence>
                                        {selectedServiceId === service.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-3 pb-2 space-y-3 px-1">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-200">
                                                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Ngày hẹn</label>
                                                            <input
                                                                type="date"
                                                                value={bookingForm.date}
                                                                min={new Date().toISOString().split('T')[0]}
                                                                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                                                                className="w-full bg-transparent text-sm font-bold outline-none"
                                                            />
                                                        </div>
                                                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-200">
                                                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Giờ</label>
                                                            <input
                                                                type="time"
                                                                value={bookingForm.time}
                                                                onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                                                                className="w-full bg-transparent text-sm font-bold outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-200">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Địa điểm</label>
                                                        <input
                                                            type="text"
                                                            value={bookingForm.location}
                                                            onChange={(e) => setBookingForm({ ...bookingForm, location: e.target.value })}
                                                            placeholder="VD: Cafe Starbucks..."
                                                            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-gray-400"
                                                        />
                                                    </div>

                                                    <div className="flex gap-2 pt-2">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setSelectedServiceId(null); }}
                                                            className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
                                                        >
                                                            Đóng
                                                        </button>
                                                        <button
                                                            onClick={handlePreBooking}
                                                            disabled={!bookingForm.date || !bookingForm.location || isBooking}
                                                            className="flex-1 py-3 bg-gradient-primary text-white rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                        >
                                                            {isBooking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                            Xác nhận
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Auth Modal */}
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
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white font-bold text-sm border border-white/10">
              {viewingImageIndex + 1} / {gallery.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}