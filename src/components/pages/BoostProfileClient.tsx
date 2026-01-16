'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  ArrowLeft,
  Sparkles,
  Check,
  Clock,
  Zap,
  Star,
  TrendingUp,
  Wallet,
  MapPin,
  Loader2,
  Crown,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyFeaturedStatus } from '@/hooks/useDbFeaturedPartners';
import { formatCurrency, cn, getVIPBadgeColor } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

type SlotType = 'homepage_top' | 'search_top' | 'category_top';
type DurationDays = 1 | 3 | 7;

interface PricingOption {
  days: DurationDays;
  price: number;
  label: string;
  popular?: boolean;
  discount?: string;
}

const PRICING_OPTIONS: PricingOption[] = [
  { days: 1, price: 50000, label: '1 ngay' },
  { days: 3, price: 120000, label: '3 ngay', popular: true, discount: 'Tiet kiem 20%' },
  { days: 7, price: 250000, label: '7 ngay', discount: 'Tiet kiem 28%' },
];

const SLOT_TYPES: { type: SlotType; label: string; description: string }[] = [
  {
    type: 'homepage_top',
    label: 'Trang chu',
    description: 'Hien thi noi bat tren trang Partners',
  },
  {
    type: 'search_top',
    label: 'Tim kiem',
    description: 'Hien thi dau tien trong ket qua tim kiem',
  },
  {
    type: 'category_top',
    label: 'Theo danh muc',
    description: 'Hien thi noi bat trong danh muc dich vu',
  },
];

export default function BoostProfileClient() {
  const { user, refreshProfile } = useAuth();
  const { slot: currentSlot, loading: slotLoading, reload: reloadSlot, isActive } = useMyFeaturedStatus(user?.id);

  const [selectedDuration, setSelectedDuration] = useState<DurationDays>(3);
  const [selectedSlotType, setSelectedSlotType] = useState<SlotType>('homepage_top');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const selectedPricing = PRICING_OPTIONS.find((p) => p.days === selectedDuration)!;
  const walletBalance = user?.wallet.balance || 0;
  const canAfford = walletBalance >= selectedPricing.price;

  const handlePurchase = async () => {
    if (!user?.id) {
      toast.error('Vui long dang nhap');
      return;
    }

    if (!canAfford) {
      toast.error('So du vi khong du. Vui long nap them tien.');
      return;
    }

    setIsPurchasing(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('Khong tim thay phien dang nhap');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/purchase-featured-slot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            slotType: selectedSlotType,
            durationDays: selectedDuration,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Khong the mua goi noi bat');
      }

      toast.success('Mua goi noi bat thanh cong! Ho so cua ban se duoc hien thi noi bat.');
      await refreshProfile();
      await reloadSlot();
    } catch (err: any) {
      console.error('Purchase error:', err);
      toast.error(err.message || 'Co loi xay ra');
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Vui long dang nhap de su dung tinh nang nay.</p>
      </div>
    );
  }

  if (!user.isServiceProvider) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Tinh nang danh cho Partner</h2>
          <p className="text-gray-500 mb-6">
            Ban can dang ky tro thanh Partner de su dung tinh nang Tang luot xem.
          </p>
          <Link
            href="/become-partner/terms"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-2xl font-bold shadow-lg"
          >
            <Zap className="w-5 h-5" />
            Dang ky Partner ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 px-4 pt-4 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/partner-dashboard">
            <button className="p-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">Tang luot xem</h1>
            <p className="text-white/80 text-sm">Noi bat ho so cua ban</p>
          </div>
        </div>

        {/* Current Status */}
        {slotLoading ? (
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
            <span className="text-white/80">Dang kiem tra trang thai...</span>
          </div>
        ) : isActive && currentSlot ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">Dang hoat dong</p>
                <p className="text-white/70 text-sm">Ho so dang duoc noi bat</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Clock className="w-4 h-4" />
              <span>
                Het han: {new Date(currentSlot.end_date).toLocaleDateString('vi-VN')} luc{' '}
                {new Date(currentSlot.end_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-white/80 text-sm">
              Ho so cua ban chua duoc noi bat. Mua goi de tang co hoi duoc khach hang tim thay!
            </p>
          </div>
        )}
      </div>

      <div className="px-4 -mt-4 space-y-6">
        {/* Benefits */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Loi ich khi noi bat
          </h2>
          <div className="space-y-3">
            {[
              { icon: Star, text: 'Hien thi o vi tri dau tien tren trang Partners', color: 'text-amber-500' },
              { icon: Zap, text: 'Tang gap 5x luot xem ho so', color: 'text-orange-500' },
              { icon: Crown, text: 'Badge "Noi bat" thu hut chu y', color: 'text-rose-500' },
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50', benefit.color)}>
                  <benefit.icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-700 font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Slot Type Selection */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Vi tri hien thi</h2>
          <div className="space-y-2">
            {SLOT_TYPES.map((slot) => (
              <button
                key={slot.type}
                onClick={() => setSelectedSlotType(slot.type)}
                className={cn(
                  'w-full p-4 rounded-2xl border-2 text-left transition-all',
                  selectedSlotType === slot.type
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-100 hover:border-gray-200'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{slot.label}</p>
                    <p className="text-sm text-gray-500">{slot.description}</p>
                  </div>
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                      selectedSlotType === slot.type
                        ? 'border-amber-500 bg-amber-500'
                        : 'border-gray-300'
                    )}
                  >
                    {selectedSlotType === slot.type && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Table */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Chon goi</h2>
          <div className="space-y-3">
            {PRICING_OPTIONS.map((option) => (
              <button
                key={option.days}
                onClick={() => setSelectedDuration(option.days)}
                className={cn(
                  'w-full p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden',
                  selectedDuration === option.days
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-100 hover:border-gray-200'
                )}
              >
                {option.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                    PHO BIEN
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{option.label}</p>
                    {option.discount && (
                      <p className="text-xs text-green-600 font-medium">{option.discount}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-amber-600">{formatCurrency(option.price)}</p>
                    <p className="text-xs text-gray-400">
                      {formatCurrency(Math.round(option.price / option.days))}/ngay
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Xem truoc</h2>
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200/50">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Image
                  src={user.avatar || '/default-avatar.png'}
                  alt={user.name}
                  width={80}
                  height={80}
                  className="rounded-2xl object-cover border-2 border-amber-300"
                />
                <div className="absolute -top-2 -left-2 px-2 py-0.5 rounded-full text-[9px] font-black text-white uppercase bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Noi bat
                </div>
                {user.vipStatus.tier !== 'free' && (
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-black text-white uppercase bg-gradient-to-r from-purple-500 to-pink-500">
                    {user.vipStatus.tier}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{user.name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{user.location?.split(',')[0]}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-bold text-gray-700">{(user.rating || 5).toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Ho so cua ban se hien thi nhu the nay trong muc Partner noi bat
          </p>
        </div>

        {/* Wallet Balance */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">So du vi</p>
                <p className="text-xl font-black text-gray-900">{formatCurrency(walletBalance)}</p>
              </div>
            </div>
            <Link
              href="/wallet"
              className="px-4 py-2 bg-green-50 text-green-600 rounded-xl font-bold text-sm hover:bg-green-100 transition"
            >
              Nap them
            </Link>
          </div>

          {!canAfford && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">
                So du khong du. Can them {formatCurrency(selectedPricing.price - walletBalance)} de mua goi nay.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Purchase Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 safe-bottom">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600 font-medium">Tong thanh toan</span>
            <span className="text-2xl font-black text-amber-600">{formatCurrency(selectedPricing.price)}</span>
          </div>
          <button
            onClick={handlePurchase}
            disabled={isPurchasing || !canAfford || isActive}
            className={cn(
              'w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2',
              canAfford && !isActive
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 hover:opacity-90'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            )}
          >
            {isPurchasing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Dang xu ly...
              </>
            ) : isActive ? (
              <>
                <Check className="w-5 h-5" />
                Dang hoat dong
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Mua goi noi bat
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
