'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  ArrowLeft,
  Briefcase,
  Check,
  Sparkles,
  Zap,
  ChevronDown,
  Wand2
} from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { ActivityType } from '@/types';
import { cn, formatCurrency, getActivityIcon, getActivityLabel } from '@/lib/utils';

const ACTIVITY_OPTIONS: { value: ActivityType; label: string; emoji: string }[] = [
  { value: 'cafe', label: 'Cafe', emoji: '☕' },
  { value: 'dining', label: 'Ăn uống', emoji: '🍽️' },
  { value: 'movies', label: 'Xem phim', emoji: '🎬' },
  { value: 'drinking', label: 'Cafe/Bar', emoji: '🍸' },
  { value: 'karaoke', label: 'Karaoke', emoji: '🎤' },
  { value: 'tour_guide', label: 'Tour guide', emoji: '🗺️' },
  { value: 'travel', label: 'Du lịch', emoji: '✈️' },
];

const PRICE_PRESETS = [
  { value: 100000, label: '100k/giờ' },
  { value: 200000, label: '200k/giờ' },
  { value: 300000, label: '300k/giờ' },
  { value: 500000, label: '500k/giờ' },
  { value: 1000000, label: '1 triệu/giờ' },
];

const DEFAULT_SUGGESTION: { activities: ActivityType[]; price: number } = {
  activities: ['cafe', 'dining'],
  price: 200000,
};

const DEFAULT_TITLES: Partial<Record<ActivityType, string>> = {
  cafe: 'Cafe trò chuyện',
  dining: 'Đi ăn cùng bạn',
  movies: 'Xem phim rạp',
  drinking: 'Cafe / Bar chill',
  karaoke: 'Hát Karaoke',
  tour_guide: 'Hướng dẫn viên địa phương',
  travel: 'Du lịch trong ngày',
};

const DEFAULT_DESCRIPTIONS: Partial<Record<ActivityType, string>> = {
  cafe: 'Cùng bạn đi cafe, nói chuyện nhẹ nhàng và vui vẻ.',
  dining: 'Cùng thưởng thức món ngon và trò chuyện thoải mái.',
  movies: 'Đi xem phim và cùng bàn về những cảnh hay.',
  drinking: 'Đi cafe/bar nhẹ nhàng, lịch sự.',
  karaoke: 'Đi karaoke xả stress, hát bài bạn thích.',
  tour_guide: 'Dẫn bạn đi khám phá địa điểm thú vị.',
  travel: 'Đồng hành chuyến đi ngắn trong ngày.',
};

export default function BecomePartnerClient() {
  const { currentUser, addServiceToProfile } = useDateStore();

  // Default-first: prefilled on first render
  const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>(
    DEFAULT_SUGGESTION.activities
  );
  const [selectedPrice, setSelectedPrice] = useState<number>(DEFAULT_SUGGESTION.price);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const canSubmit = selectedActivities.length > 0 && selectedPrice > 0;

  const earningsPreview = useMemo(() => {
    const feeRate = 0.1;
    const afterFee = (hours: number) => Math.round(selectedPrice * hours * (1 - feeRate));
    return {
      h3: afterFee(3),
      h5: afterFee(5),
      h10: afterFee(10),
    };
  }, [selectedPrice]);

  const toggleActivity = (a: ActivityType) => {
    setSelectedActivities((prev) => {
      if (prev.includes(a)) return prev.filter((x) => x !== a);
      return [...prev, a];
    });
  };

  const applyRecommended = () => {
    setSelectedActivities(DEFAULT_SUGGESTION.activities);
    setSelectedPrice(DEFAULT_SUGGESTION.price);
  };

  const handleCreate = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    await new Promise((r) => setTimeout(r, 300));

    selectedActivities.forEach((activity) => {
      addServiceToProfile({
        activity,
        title: DEFAULT_TITLES[activity] || `Dịch vụ ${getActivityLabel(activity)}`,
        description: DEFAULT_DESCRIPTIONS[activity] || 'Dịch vụ đồng hành theo yêu cầu.',
        price: selectedPrice,
        available: true,
      });
    });

    setIsSubmitting(false);
    window.location.href = '/manage-services';
  };

  const isAlreadyPartner = currentUser.isServiceProvider && (currentUser.services?.length || 0) > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Trở thành Partner</h1>
          <p className="text-sm text-gray-500">
            Bạn đã có sẵn cấu hình mặc định — bấm tạo ngay, hoặc chỉnh nếu muốn.
          </p>
        </div>
      </div>

      {/* Already Partner */}
      {isAlreadyPartner && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-green-900">Bạn đã là Partner</p>
              <p className="text-sm text-green-700 mt-1">
                Bạn có thể quản lý dịch vụ tại trang Quản lý dịch vụ.
              </p>
              <Link href="/manage-services" className="inline-block mt-3">
                <button className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition">
                  Đi tới Quản lý dịch vụ
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Default card */}
      {!isAlreadyPartner && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Thiết lập mặc định</h2>
                <p className="text-sm text-gray-500">
                  Đã chọn sẵn để bạn khỏi phải nghĩ.
                </p>
              </div>
            </div>
            <button
              onClick={applyRecommended}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition"
            >
              Reset mặc định
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Hoạt động đã chọn</p>
              <div className="flex flex-wrap gap-2">
                {selectedActivities.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm font-bold text-gray-700"
                  >
                    <span className="text-base">{getActivityIcon(a)}</span>
                    <span>{getActivityLabel(a)}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Giá chung</p>
              <p className="text-2xl font-black text-gray-900">{formatCurrency(selectedPrice)}/giờ</p>
              <p className="text-xs text-gray-500 mt-1">
                (Sau phí 10%) 3h: <span className="font-bold text-green-700">{formatCurrency(earningsPreview.h3)}</span>
              </p>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="mt-6 flex gap-3">
            <Link href="/profile" className="flex-1">
              <button className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition">
                Để sau
              </button>
            </Link>

            <motion.button
              onClick={handleCreate}
              disabled={!canSubmit || isSubmitting}
              className={cn(
                'flex-1 py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition shadow-primary',
                canSubmit && !isSubmitting ? 'bg-gradient-primary hover:opacity-90' : 'bg-gray-300 cursor-not-allowed'
              )}
              whileTap={canSubmit && !isSubmitting ? { scale: 0.98 } : {}}
            >
              <Briefcase className="w-5 h-5" />
              {isSubmitting ? 'Đang tạo...' : 'Tạo dịch vụ mặc định'}
            </motion.button>
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="mt-5 w-full flex items-center justify-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition"
          >
            {showAdvanced ? 'Ẩn tuỳ chỉnh' : 'Muốn chỉnh? Mở tuỳ chọn'}
            <ChevronDown className={cn('w-4 h-4 transition-transform', showAdvanced && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-5 space-y-6">
                  {/* Activities */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-gray-700">Chọn hoạt động (chọn nhiều)</p>
                      <span className="text-xs text-gray-400 font-medium">{selectedActivities.length} đã chọn</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {ACTIVITY_OPTIONS.map((opt) => {
                        const active = selectedActivities.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleActivity(opt.value)}
                            className={cn(
                              'p-4 rounded-2xl border-2 text-left transition',
                              active ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xl">{opt.emoji}</span>
                              {active && (
                                <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center">
                                  <Check className="w-4 h-4" />
                                </span>
                              )}
                            </div>
                            <p className={cn('mt-2 font-bold', active ? 'text-primary-700' : 'text-gray-900')}>
                              {opt.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {getActivityIcon(opt.value)} {getActivityLabel(opt.value)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-3">Chọn mức giá chung</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {PRICE_PRESETS.map((p) => {
                        const active = selectedPrice === p.value;
                        return (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setSelectedPrice(p.value)}
                            className={cn(
                              'py-3 px-3 rounded-2xl border-2 font-bold transition relative',
                              active ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            )}
                          >
                            {p.label}
                            {active && (
                              <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 bg-green-50 border border-green-100 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-bold text-green-800">Thu nhập dự kiến (sau phí 10%)</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-white rounded-xl border border-green-100 p-3">
                          <p className="text-xs text-gray-500 font-semibold">Gói 3 giờ</p>
                          <p className="font-black text-green-700">{formatCurrency(earningsPreview.h3)}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-green-100 p-3">
                          <p className="text-xs text-gray-500 font-semibold">Gói 5 giờ</p>
                          <p className="font-black text-green-700">{formatCurrency(earningsPreview.h5)}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-green-100 p-3">
                          <p className="text-xs text-gray-500 font-semibold">Gói 1 ngày</p>
                          <p className="font-black text-green-700">{formatCurrency(earningsPreview.h10)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Mẹo</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Sau khi tạo xong, bạn có thể vào “Quản lý dịch vụ” để chỉnh tiêu đề/mô tả hoặc bật/tắt dịch vụ.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Small note */}
      {!isAlreadyPartner && (
        <p className="text-center text-[11px] font-medium text-gray-400">
          Hệ thống sẽ tạo {selectedActivities.length} dịch vụ theo hoạt động đã chọn, cùng mức giá chung.
        </p>
      )}
    </div>
  );
}