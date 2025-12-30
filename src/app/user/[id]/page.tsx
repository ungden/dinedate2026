'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/motion';
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
  X,
} from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { cn, formatCurrency, formatRelativeTime, getVIPBadgeColor, getActivityIcon, getActivityLabel } from '@/lib/utils';
import { ServiceOffering } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';

type PackageKey = '3h' | '5h' | '1d';

const PACKAGES: { key: PackageKey; label: string; hours: number }[] = [
  { key: '3h', label: '3 giờ', hours: 3 },
  { key: '5h', label: '5 giờ', hours: 5 },
  { key: '1d', label: '1 ngày', hours: 10 },
];

function getBaseHourlyPrice(userHourlyRate?: number, servicePrice?: number) {
  return userHourlyRate && userHourlyRate > 0 ? userHourlyRate : servicePrice || 0;
}

function calcTotal(baseHourly: number, hours: number) {
  const subTotal = baseHourly * hours;
  const platformFee = Math.round(subTotal * 0.1);
  return { subTotal, platformFee, total: subTotal + platformFee };
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { user: authUser } = useAuth();
  const { getUserById, getUserReviews, getUserAverageRating, createBooking, currentUser } =
    useDateStore();

  const user = getUserById(userId);
  const reviews = getUserReviews(userId);
  const rating = user?.rating || getUserAverageRating(userId);

  const isCurrentUser = !!user && user.id === currentUser.id;

  const services = useMemo(() => {
    const list = user?.services || [];
    return list.filter((s) => s.available);
  }, [user?.services]);

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageKey>('3h');

  const selectedService: ServiceOffering | null =
    services.find((s) => s.id === selectedServiceId) || null;

  const baseHourly = getBaseHourlyPrice(user?.hourlyRate, selectedService?.price);
  const packageHours = PACKAGES.find((p) => p.key === selectedPackage)?.hours || 3;
  const pricing = calcTotal(baseHourly, packageHours);

  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '19:00',
    location: '',
    message: '',
  });

  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    actionType: 'book' | 'like' | 'generic';
  }>({
    isOpen: false,
    actionType: 'generic',
  });

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

  const openBookingForService = (serviceId: string) => {
    if (isCurrentUser) return;
    setSelectedServiceId(serviceId);
    setSelectedPackage('3h');
    setBookingForm({ date: '', time: '19:00', location: '', message: '' });
  };

  const handleBook = () => {
    if (!authUser) {
      setAuthModal({ isOpen: true, actionType: 'book' });
      return;
    }
    if (!selectedServiceId || !selectedService) return;
    if (!bookingForm.date || !bookingForm.location) return;

    createBooking(
      userId,
      selectedServiceId,
      bookingForm.date,
      bookingForm.time,
      bookingForm.location,
      bookingForm.message
    );

    setSelectedServiceId(null);
    alert('Đã gửi yêu cầu booking thành công! 🎉');
  };

  return (
    <div className="max-w-4xl mx-auto pb-28">
      {/* Top media */}
      <div className="relative">
        <div className="relative aspect-[3/4] md:aspect-[16/9] overflow-hidden rounded-b-[28px]">
          <Image src={coverImage} alt={user.name} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
        </div>

        {/* Top controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow flex items-center justify-center"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => !authUser && setAuthModal({ isOpen: true, actionType: 'like' })}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow flex items-center justify-center"
              aria-label="Yêu thích"
            >
              <Heart className="w-5 h-5 text-gray-800" />
            </button>
            <button
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow flex items-center justify-center"
              aria-label="Chia sẻ"
            >
              <Share2 className="w-5 h-5 text-gray-800" />
            </button>
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
                    <h1 className="text-[22px] font-black text-gray-900 truncate">{user.name}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-primary-500" />
                        <span className="truncate max-w-[220px]">{user.location}</span>
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-yellow-700">{rating ? rating.toFixed(1) : '0.0'}</span>
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
                    <p className="font-bold text-green-900">Rõ ràng gói cước</p>
                    <p className="text-green-800/80 text-[13px] leading-snug">
                      Chọn combo 3 giờ, 5 giờ, 1 ngày kèm giá
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

              {user.hourlyRate ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full font-black">
                  <Wallet className="w-4 h-4" />
                  {formatCurrency(user.hourlyRate)}/giờ
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="px-4 mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-black text-gray-900">Dịch vụ của tôi</h2>
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
              const base = getBaseHourlyPrice(user.hourlyRate, service.price);
              const selectedForThis = selectedServiceId === service.id;

              const price3h = calcTotal(base, 3).total;
              const price5h = calcTotal(base, 5).total;
              const price1d = calcTotal(base, 10).total;

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
                            <p className="text-[12px] text-gray-400 font-bold">Từ</p>
                            <p className="text-[18px] font-black text-gray-900 leading-none">
                              {formatCurrency(base)}/giờ
                            </p>
                          </div>
                        </div>

                        {service.description ? (
                          <p className="text-[13px] text-gray-600 mt-2 line-clamp-2">{service.description}</p>
                        ) : null}

                        {/* Package pills */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {[
                            { key: '3h' as const, label: '3 giờ', price: price3h },
                            { key: '5h' as const, label: '5 giờ', price: price5h },
                            { key: '1d' as const, label: '1 ngày', price: price1d },
                          ].map((p) => {
                            const active = selectedForThis && selectedPackage === p.key;
                            return (
                              <button
                                key={p.key}
                                onClick={() => {
                                  openBookingForService(service.id);
                                  setSelectedPackage(p.key);
                                }}
                                className={cn(
                                  'px-4 py-2 rounded-full border text-sm font-bold transition',
                                  active
                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                )}
                              >
                                <span>{p.label}</span>
                                <span className="text-gray-300 mx-2">•</span>
                                <span className={cn(active ? 'text-primary-700' : 'text-gray-700')}>
                                  {formatCurrency(p.price)}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Primary action */}
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[12px] text-gray-400 font-bold">Tổng (đã gồm phí)</p>
                            <p className="text-[20px] font-black text-primary-600 leading-none">
                              {formatCurrency(
                                selectedForThis
                                  ? pricing.total
                                  : price3h
                              )}
                            </p>
                          </div>

                          <button
                            onClick={() => openBookingForService(service.id)}
                            className="px-5 py-3 rounded-2xl bg-gradient-primary text-white font-black shadow-primary hover:opacity-90 transition flex items-center justify-center gap-2"
                          >
                            Đặt
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
                              Tạm tính ({formatCurrency(baseHourly)}/giờ × {packageHours} giờ)
                            </span>
                            <span className="font-black text-gray-900">{formatCurrency(pricing.subTotal)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-600 font-medium">Phí nền tảng (10%)</span>
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
                            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-black hover:bg-gray-200 transition"
                          >
                            Đóng
                          </button>
                          <button
                            onClick={handleBook}
                            disabled={!bookingForm.date || !bookingForm.location}
                            className={cn(
                              'flex-1 py-3 rounded-xl font-black transition shadow-primary',
                              bookingForm.date && bookingForm.location
                                ? 'bg-gradient-primary text-white hover:opacity-90'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            )}
                          >
                            Xác nhận đặt
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

        {/* Reviews - compact */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[16px] font-black text-gray-900">Đánh giá</h3>
            <span className="text-[12px] text-gray-400 font-bold">{reviews.length} lượt</span>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-white rounded-[28px] border border-gray-100 p-6 text-center text-gray-500">
              Chưa có đánh giá.
            </div>
          ) : (
            <div className="bg-white rounded-[28px] border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {reviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="p-4 flex gap-3">
                    <Image
                      src={r.reviewer.avatar}
                      alt={r.reviewer.name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold text-gray-900 truncate">{r.reviewer.name}</p>
                        <span className="text-xs text-gray-400 font-bold">{formatRelativeTime(r.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-3.5 h-3.5',
                              i < r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{r.comment}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <Link href="/reviews" className="text-primary-600 font-black text-sm hover:underline">
                  Xem tất cả đánh giá
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auth modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        actionType={authModal.actionType}
      />

      {/* Sticky bottom quick action */}
      {!isCurrentUser && services.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:static md:z-auto">
          <div className="md:hidden bg-white/80 backdrop-blur-xl border-t border-gray-200/60 p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <button
              onClick={() => openBookingForService(services[0].id)}
              className="w-full py-4 rounded-2xl bg-gradient-primary text-white font-black shadow-primary hover:opacity-90 transition"
            >
              Chọn gói & đặt nhanh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}