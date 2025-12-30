'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  ArrowLeft,
  MapPin,
  Star,
  MessageCircle,
  Calendar,
  Clock,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Ruler,
  Briefcase,
  Shield,
  AlertTriangle,
  Check,
  Crown,
  X,
  Sparkles,
} from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import {
  formatCurrency,
  getActivityIcon,
  getActivityLabel,
  getVIPBadgeColor,
  formatRelativeTime,
  cn,
} from '@/lib/utils';
import { ServiceOffering, ZODIAC_LABELS, PERSONALITY_TAG_LABELS } from '@/types';
import VoiceIntro from '@/components/VoiceIntro';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedService, setSelectedService] = useState<ServiceOffering | null>(null);
  const [bookingHours, setBookingHours] = useState(2);
  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '19:00',
    location: '',
    message: '',
  });
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    actionType: 'book' | 'chat' | 'like' | 'generic';
  }>({
    isOpen: false,
    actionType: 'generic',
  });

  const {
    getUserById,
    getUserAverageRating,
    getUserReviews,
    createBooking,
    currentUser,
    getOrCreateConversationWithUser,
  } = useDateStore();

  const { user: authUser } = useAuth();

  const user = getUserById(userId);
  const rating = user?.rating || getUserAverageRating(userId);
  const reviews = getUserReviews(userId);
  const images = user?.images || [user?.avatar];

  const isCurrentUser = !!user && user.id === currentUser.id;

  const nextImage = () => {
    if (images && images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images && images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const openChatWithUser = () => {
    if (!authUser) {
      setAuthModal({ isOpen: true, actionType: 'chat' });
      return;
    }
    const conversationId = getOrCreateConversationWithUser(userId);
    if (!conversationId) return;
    router.push(`/chat/${conversationId}`);
  };

  const handleBook = () => {
    if (!authUser) {
      setAuthModal({ isOpen: true, actionType: 'book' });
      return;
    }

    if (!selectedService || !bookingForm.date || !bookingForm.location) return;

    createBooking(
      userId,
      selectedService.id,
      bookingForm.date,
      bookingForm.time,
      bookingForm.location,
      bookingForm.message
    );

    setSelectedService(null);
    setBookingForm({ date: '', time: '19:00', location: '', message: '' });
    alert('Đã gửi yêu cầu booking thành công! 🎉');
  };

  const totalCost = selectedService
    ? (user?.hourlyRate || selectedService.price) * bookingHours
    : 0;

  const platformFee = Math.round(totalCost * 0.1);

  if (!user) {
    return (
      <div className="text-center py-12">
        <motion.div
          className="text-6xl mb-4"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          😢
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Không tìm thấy người dùng
        </h3>
        <Link href="/" className="text-primary-600 hover:underline">
          Quay lại danh sách Partner
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Floating Back Button */}
      <motion.button
        onClick={() => router.back()}
        className="fixed top-20 left-4 z-30 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ArrowLeft className="w-5 h-5" />
      </motion.button>

      {/* Media Gallery */}
      <div className="relative aspect-[3/4] md:aspect-[16/9] mb-6 rounded-b-3xl overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={images?.[currentImageIndex] || user.avatar}
              alt={user.name}
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {images && images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/50 transition"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/50 transition"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    idx === currentImageIndex ? 'w-6 bg-white' : 'bg-white/50 hover:bg-white/70'
                  )}
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute top-4 right-4 flex gap-2">
          <motion.button
            className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center p-2 hover:bg-white/40 transition"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => !authUser && setAuthModal({ isOpen: true, actionType: 'like' })}
          >
            <Heart className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center p-2 hover:bg-white/40 transition"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Share2 className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {user.vipStatus.tier !== 'free' && (
          <div
            className={cn(
              'absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full',
              getVIPBadgeColor(user.vipStatus.tier)
            )}
          >
            <Crown className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold capitalize">
              {user.vipStatus.tier}
            </span>
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {user.name},{' '}
                {user.birthYear ? new Date().getFullYear() - user.birthYear : user.age}
              </h1>
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{user.location}</span>
                </div>
                {rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{rating.toFixed(1)}</span>
                    <span className="text-white/70">({user.reviewCount || reviews.length})</span>
                  </div>
                )}
              </div>
            </div>

            {user.onlineStatus?.isOnline && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/90 rounded-full">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">Đang rảnh</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {user.voiceIntroUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <VoiceIntro audioUrl={user.voiceIntroUrl} userName={user.name} />
          </motion.div>
        )}

        {/* 1-1 CTA */}
        {!isCurrentUser && (
          <motion.div
            className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <div className="min-w-0">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Hẹn 1-1
              </p>
              <p className="text-[15px] font-black text-gray-900 truncate mt-1">
                Gửi đề nghị và chat riêng ngay
              </p>
              <p className="text-[12px] text-gray-500 truncate mt-0.5">
                Nếu muốn đi nhóm, hai bạn sẽ tự rủ thêm người sau
              </p>
            </div>
            <button
              onClick={openChatWithUser}
              className="px-4 py-3 rounded-2xl bg-gradient-primary text-white font-black shadow-primary tap-highlight flex items-center gap-2 flex-shrink-0"
            >
              <Sparkles className="w-5 h-5" />
              <span>Đề nghị</span>
            </button>
          </motion.div>
        )}

        {/* Quick Info Cards */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {user.height && (
            <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
              <Ruler className="w-5 h-5 text-primary-500 mx-auto mb-1" />
              <p className="text-sm text-gray-500">Chiều cao</p>
              <p className="font-semibold text-gray-900">{user.height} cm</p>
            </div>
          )}
          {user.zodiac && (
            <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
              <span className="text-2xl">{ZODIAC_LABELS[user.zodiac]?.split(' ')[0]}</span>
              <p className="text-sm text-gray-500">Cung hoàng đạo</p>
              <p className="font-semibold text-gray-900">{ZODIAC_LABELS[user.zodiac]?.split(' ')[1]}</p>
            </div>
          )}
          {user.occupation && (
            <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
              <Briefcase className="w-5 h-5 text-primary-500 mx-auto mb-1" />
              <p className="text-sm text-gray-500">Nghề nghiệp</p>
              <p className="font-semibold text-gray-900 truncate">{user.occupation}</p>
            </div>
          )}
          {user.hourlyRate && (
            <div className="bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl p-3 text-center text-white">
              <Clock className="w-5 h-5 mx-auto mb-1" />
              <p className="text-sm text-white/80">Giá thuê</p>
              <p className="font-bold">{formatCurrency(user.hourlyRate)}/h</p>
            </div>
          )}
        </motion.div>

        {/* Bio */}
        <motion.div
          className="bg-white rounded-2xl p-5 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-bold text-gray-900 mb-2">Giới thiệu</h2>
          <p className="text-gray-600 leading-relaxed">{user.bio}</p>
        </motion.div>

        {/* Personality Tags */}
        {user.personalityTags && user.personalityTags.length > 0 && (
          <motion.div
            className="bg-white rounded-2xl p-5 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h2 className="font-bold text-gray-900 mb-3">Tính cách</h2>
            <div className="flex flex-wrap gap-2">
              {user.personalityTags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                >
                  {PERSONALITY_TAG_LABEL_LABELS[tag] ?? PERSONALITY_TAG_LABELS[tag]}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Restrictions */}
        {user.restrictions && user.restrictions.length > 0 && (
          <motion.div
            className="bg-orange-50 rounded-2xl p-5 border border-orange-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-orange-600" />
              <h2 className="font-bold text-orange-900">Quy định riêng</h2>
            </div>
            <ul className="space-y-2">
              {user.restrictions.map((restriction, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 text-orange-800 text-sm"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{restriction}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Services */}
        {user.services && user.services.length > 0 && (
          <motion.div
            className="bg-white rounded-2xl p-5 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h2 className="font-bold text-gray-900 mb-4">
              Dịch vụ & Giá ({user.services.length})
            </h2>
            <div className="space-y-3">
              {user.services.map((service) => (
                <motion.div
                  key={service.id}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-xl border-2 transition cursor-pointer',
                    selectedService?.id === service.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-100 hover:border-primary-200 hover:bg-gray-50'
                  )}
                  onClick={() => !isCurrentUser && setSelectedService(service)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {getActivityIcon(service.activity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {service.title}
                      </h3>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {getActivityLabel(service.activity)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {service.description}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg text-primary-600">
                      {formatCurrency(service.price)}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      {service.available ? (
                        <>
                          <Check className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600">Có sẵn</span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">Tạm ngưng</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <motion.div
            className="bg-white rounded-2xl p-5 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Đánh giá ({reviews.length})</h2>
              <Link
                href={`/reviews/${userId}`}
                className="text-primary-600 font-medium hover:underline text-sm"
              >
                Xem tất cả
              </Link>
            </div>
            <div className="space-y-4">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="flex gap-3">
                  <Image
                    src={review.reviewer.avatar}
                    alt={review.reviewer.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {review.reviewer.name}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-3.5 h-3.5',
                              i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatRelativeTime(review.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Sticky Booking Button */}
      {!isCurrentUser && user.services && user.services.length > 0 && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-40"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button
              onClick={openChatWithUser}
              className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition"
            >
              <MessageCircle className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={() => setSelectedService(user.services![0])}
              className="flex-1 py-4 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-500/30 hover:opacity-90 transition"
            >
              Đặt lịch ngay - {formatCurrency(user.hourlyRate || user.services[0].price)}/h
            </button>
          </div>
        </motion.div>
      )}

      {/* Booking Form Modal */}
      <AnimatePresence>
        {selectedService && !isCurrentUser && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Đặt lịch hẹn</h2>
                  <p className="text-sm text-gray-500">với {user.name}</p>
                </div>
                <button
                  onClick={() => setSelectedService(null)}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
                  <span className="text-2xl">{getActivityIcon(selectedService.activity)}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{selectedService.title}</p>
                    <p className="text-sm text-gray-600">{getActivityLabel(selectedService.activity)}</p>
                  </div>
                  <p className="font-bold text-primary-600">{formatCurrency(selectedService.price)}/h</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Thời lượng
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5].map((hours) => (
                      <button
                        key={hours}
                        onClick={() => setBookingHours(hours)}
                        className={cn(
                          'flex-1 py-3 rounded-xl font-medium transition',
                          bookingHours === hours
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        {hours}h
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Ngày
                    </label>
                    <input
                      type="date"
                      value={bookingForm.date}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, date: e.target.value })
                      }
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Giờ bắt đầu
                    </label>
                    <input
                      type="time"
                      value={bookingForm.time}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, time: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Địa điểm hẹn
                  </label>
                  <input
                    type="text"
                    value={bookingForm.location}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, location: e.target.value })
                    }
                    placeholder="VD: Quán cafe ABC, Quận 1"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lời nhắn (tùy chọn)
                  </label>
                  <textarea
                    value={bookingForm.message}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, message: e.target.value })
                    }
                    placeholder="Gửi lời nhắn cho Partner..."
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {formatCurrency(user.hourlyRate || selectedService.price)} × {bookingHours} giờ
                    </span>
                    <span className="font-medium">{formatCurrency(totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí nền tảng (10%)</span>
                    <span className="font-medium">{formatCurrency(platformFee)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="font-bold text-gray-900">Tổng cộng</span>
                    <span className="font-bold text-xl text-primary-600">
                      {formatCurrency(totalCost + platformFee)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-xl text-sm">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-800">
                    Yêu cầu đặt cọc 100% để xác nhận lịch hẹn. Tiền sẽ được giữ trong ví escrow cho đến khi hoàn thành.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedService(null)}
                    className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleBook}
                    disabled={!bookingForm.date || !bookingForm.location}
                    className={cn(
                      'flex-1 py-4 rounded-xl font-bold transition',
                      bookingForm.date && bookingForm.location
                        ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white hover:opacity-90'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    Đặt lịch - {formatCurrency(totalCost + platformFee)}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        actionType={authModal.actionType}
      />
    </div>
  );
}

const PERSONALITY_TAG_LABEL_LABELS: Record<string, string> = {};