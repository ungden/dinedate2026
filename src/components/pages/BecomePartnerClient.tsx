'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from '@/lib/motion';
import {
  ArrowLeft,
  Briefcase,
  Check,
  ChevronRight,
  Coffee,
  Utensils,
  Clapperboard,
  Wine,
  Mic2,
  Map,
  Plane,
  AlertTriangle,
  Image as ImageIcon,
  FileText,
  DollarSign,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { ActivityType } from '@/types';
import { cn } from '@/lib/utils';
import { useDbMyServices } from '@/hooks/useDbMyServices';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const ACTIVITY_OPTIONS: { value: ActivityType; label: string; Icon: React.ElementType }[] = [
  { value: 'cafe', label: 'Cafe', Icon: Coffee },
  { value: 'dining', label: 'Ăn uống', Icon: Utensils },
  { value: 'movies', label: 'Xem phim', Icon: Clapperboard },
  { value: 'drinking', label: 'Cafe/Bar', Icon: Wine },
  { value: 'karaoke', label: 'Karaoke', Icon: Mic2 },
  { value: 'tour_guide', label: 'Tour guide', Icon: Map },
  { value: 'travel', label: 'Du lịch', Icon: Plane },
];

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

const MIN_BIO_LEN = 30;
const MIN_PHOTOS = 3;

type ServiceConfig = {
  activity: ActivityType;

  sessionEnabled: boolean;
  sessionPrice: number;

  dayEnabled: boolean;
  dayPrice: number;
};

function defaultConfigForActivity(activity: ActivityType): ServiceConfig {
  // sensible defaults:
  // - most activities default session ON
  // - travel/tour default day ON (but still allow session too)
  const defaultSession =
    activity === 'tour_guide' || activity === 'travel' ? false : true;
  const defaultDay = activity === 'tour_guide' || activity === 'travel';

  const sessionPriceMap: Partial<Record<ActivityType, number>> = {
    cafe: 300000,
    dining: 500000,
    movies: 400000,
    drinking: 700000,
    karaoke: 600000,
    tour_guide: 700000, // optional session for tour guide
    travel: 900000, // optional session for travel
  };

  const dayPriceMap: Partial<Record<ActivityType, number>> = {
    cafe: 1000000,
    dining: 1200000,
    movies: 1000000,
    drinking: 1500000,
    karaoke: 1500000,
    tour_guide: 1500000,
    travel: 2000000,
  };

  return {
    activity,
    sessionEnabled: defaultSession,
    sessionPrice: sessionPriceMap[activity] ?? 500000,
    dayEnabled: defaultDay,
    dayPrice: dayPriceMap[activity] ?? 1500000,
  };
}

export default function BecomePartnerClient() {
  const { currentUser } = useDateStore();
  const { addService } = useDbMyServices();
  const { user: authUser, refreshProfile } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>([
    'cafe',
    'dining',
  ]);

  const [configs, setConfigs] = useState<Record<ActivityType, ServiceConfig>>({
    cafe: defaultConfigForActivity('cafe'),
    dining: defaultConfigForActivity('dining'),
    movies: defaultConfigForActivity('movies'),
    drinking: defaultConfigForActivity('drinking'),
    karaoke: defaultConfigForActivity('karaoke'),
    tour_guide: defaultConfigForActivity('tour_guide'),
    travel: defaultConfigForActivity('travel'),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAlreadyPartner = !!authUser?.isServiceProvider;

  const photoCount = (authUser?.images || []).filter(Boolean).length;
  const isBioOk = (authUser?.bio || '').trim().length >= MIN_BIO_LEN;
  const isPhotosOk = photoCount >= MIN_PHOTOS;

  const profileBlockReasons = useMemo(() => {
    const reasons: { key: 'bio' | 'photos'; title: string; detail: string }[] = [];
    if (!isBioOk) {
      reasons.push({
        key: 'bio',
        title: 'Cần cập nhật mô tả (bio)',
        detail: `Hãy viết ít nhất ${MIN_BIO_LEN} ký tự để hồ sơ đáng tin hơn.`,
      });
    }
    if (!isPhotosOk) {
      reasons.push({
        key: 'photos',
        title: 'Cần thêm ảnh rõ mặt',
        detail: `Hãy upload tối thiểu ${MIN_PHOTOS} ảnh trong mục Ảnh (gallery).`,
      });
    }
    return reasons;
  }, [isBioOk, isPhotosOk]);

  const isProfileReady = profileBlockReasons.length === 0;

  const toggleActivity = (a: ActivityType) => {
    setSelectedActivities((prev) => {
      if (prev.includes(a)) return prev.filter((x) => x !== a);
      return [...prev, a];
    });
  };

  const updateConfig = <K extends keyof ServiceConfig>(
    activity: ActivityType,
    key: K,
    value: ServiceConfig[K]
  ) => {
    setConfigs((prev) => ({
      ...prev,
      [activity]: { ...prev[activity], [key]: value },
    }));
  };

  const markPartnerActive = async () => {
    if (!authUser?.id) return;

    const { error } = await supabase
      .from('users')
      .update({
        role: 'partner',
        is_online: true,
        available_now: true,
      })
      .eq('id', authUser.id);

    if (error) throw error;

    await refreshProfile();
  };

  const validateStep2 = () => {
    // each selected activity must have at least one option enabled
    for (const a of selectedActivities) {
      const cfg = configs[a];
      const hasOne =
        (cfg.sessionEnabled && cfg.sessionPrice > 0) ||
        (cfg.dayEnabled && cfg.dayPrice > 0);

      if (!hasOne) {
        return { ok: false, activity: a };
      }
    }
    return { ok: true as const };
  };

  const handleCreate = async () => {
    if (!authUser?.id) {
      toast.error('Vui lòng đăng nhập');
      window.location.href = '/login';
      return;
    }

    if (selectedActivities.length === 0) {
      toast.error('Bạn cần chọn ít nhất 1 dịch vụ');
      return;
    }

    const v = validateStep2();
    if (!v.ok) {
      toast.error('Mỗi hoạt động cần chọn ít nhất 1 gói (theo buổi hoặc theo ngày).');
      return;
    }

    setIsSubmitting(true);

    // 1) Mark partner in DB FIRST so you appear in Partner list immediately
    await markPartnerActive();

    // 2) Create services: one row per enabled option
    for (const activity of selectedActivities) {
      const cfg = configs[activity];

      const baseTitle = DEFAULT_TITLES[activity] || 'Dịch vụ đồng hành';
      const baseDesc =
        DEFAULT_DESCRIPTIONS[activity] || 'Dịch vụ đồng hành theo yêu cầu.';

      if (cfg.sessionEnabled) {
        await addService({
          activity,
          title: `${baseTitle} (theo buổi)`,
          description: baseDesc,
          price: cfg.sessionPrice,
          duration: 'session',
          available: true,
        });
      }

      if (cfg.dayEnabled) {
        await addService({
          activity,
          title: `${baseTitle} (theo ngày)`,
          description: baseDesc,
          price: cfg.dayPrice,
          duration: 'day',
          available: true,
        });
      }
    }

    toast.success('Đã kích hoạt Partner!');

    // 3) Go to Partner dashboard
    window.location.href = '/partner-dashboard';
  };

  if (isAlreadyPartner) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-4">
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
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/partner-dashboard">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition">
                    Đi tới Partner Dashboard
                  </button>
                </Link>
                <Link href="/manage-services">
                  <button className="px-4 py-2 bg-white text-green-700 border border-green-200 rounded-xl font-bold hover:bg-green-50 transition">
                    Quản lý dịch vụ
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not ready state
  if (!isProfileReady) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-4">
        <div className="flex items-center gap-4">
          <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Trở thành Partner</h1>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">Cần hoàn thiện hồ sơ trước</h2>
              <div className="mt-4 space-y-3">
                {profileBlockReasons.map((r) => (
                  <div key={r.key} className="bg-white rounded-2xl border border-rose-100 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                        {r.key === 'bio' ? (
                          <FileText className="w-5 h-5 text-rose-600" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-rose-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{r.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{r.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex gap-3">
                <Link href="/profile/edit" className="flex-1">
                  <button className="w-full py-3 bg-gradient-primary text-white rounded-xl font-bold shadow-primary">
                    Cập nhật ngay
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => (step === 2 ? setStep(1) : window.history.back())}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 1 ? 'Chọn hoạt động' : 'Thiết lập gói giá'}
          </h1>
          <p className="text-sm text-gray-500">
            {step === 1
              ? 'Bước 1: Chọn những gì bạn muốn cung cấp'
              : 'Bước 2: Bạn có thể bật cả theo buổi và theo ngày cho mỗi hoạt động'}
          </p>
        </div>
        <div className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500">
          {step}/2
        </div>
      </div>

      {/* STEP 1: SELECT ACTIVITIES */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {ACTIVITY_OPTIONS.map((opt) => {
              const isSelected = selectedActivities.includes(opt.value);
              const Icon = opt.Icon;

              return (
                <button
                  key={opt.value}
                  onClick={() => toggleActivity(opt.value)}
                  className={cn(
                    'relative p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02]',
                    isSelected ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100' : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isSelected ? 'bg-white text-primary-600' : 'bg-gray-50 text-gray-500')}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white stroke-[3px]" />
                      </div>
                    )}
                  </div>
                  <p className={cn('font-bold text-lg', isSelected ? 'text-primary-900' : 'text-gray-700')}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Có thể bật theo buổi / theo ngày</p>
                </button>
              );
            })}
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex justify-center md:static md:bg-transparent md:border-0 md:p-0">
            <button
              onClick={() => setStep(2)}
              disabled={selectedActivities.length === 0}
              className={cn(
                'w-full md:max-w-md py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition shadow-lg',
                selectedActivities.length > 0 ? 'bg-gradient-primary text-white shadow-primary hover:opacity-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              Tiếp tục ({selectedActivities.length}) <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 2: CONFIGURE PRICE */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 pb-24">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-blue-900 text-sm">Bạn có thể bật 1 hoặc 2 gói</p>
              <p className="text-xs text-blue-700 mt-1">
                Ví dụ Tour guide: bật cả <b>theo buổi</b> và <b>theo ngày</b> nếu bạn muốn.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {selectedActivities.map((activity) => {
              const option = ACTIVITY_OPTIONS.find((o) => o.value === activity)!;
              const cfg = configs[activity];
              const Icon = option.Icon;

              return (
                <div key={activity} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{option.label}</h3>
                      <p className="text-xs text-gray-500">Chọn gói & giá</p>
                    </div>
                    <button
                      onClick={() => toggleActivity(activity)}
                      className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition"
                      aria-label="Bỏ hoạt động"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Session option */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-700">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">Theo buổi</p>
                            <p className="text-xs text-gray-500">Một buổi (3h)</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => updateConfig(activity, 'sessionEnabled', !cfg.sessionEnabled)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-black border transition',
                            cfg.sessionEnabled
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-white text-gray-600 border-gray-200'
                          )}
                        >
                          {cfg.sessionEnabled ? 'Đang bật' : 'Tắt'}
                        </button>
                      </div>

                      {cfg.sessionEnabled && (
                        <div className="mt-3">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Giá theo buổi (VNĐ)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={cfg.sessionPrice}
                              onChange={(e) => updateConfig(activity, 'sessionPrice', Number(e.target.value))}
                              className="w-full pl-4 pr-12 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                              step={50000}
                              min={0}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">đ</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Day option */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-700">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">Theo ngày</p>
                            <p className="text-xs text-gray-500">Một ngày</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => updateConfig(activity, 'dayEnabled', !cfg.dayEnabled)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-black border transition',
                            cfg.dayEnabled
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-white text-gray-600 border-gray-200'
                          )}
                        >
                          {cfg.dayEnabled ? 'Đang bật' : 'Tắt'}
                        </button>
                      </div>

                      {cfg.dayEnabled && (
                        <div className="mt-3">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Giá theo ngày (VNĐ)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={cfg.dayPrice}
                              onChange={(e) => updateConfig(activity, 'dayPrice', Number(e.target.value))}
                              className="w-full pl-4 pr-12 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                              step={50000}
                              min={0}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">đ</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Validation note */}
                    {!cfg.sessionEnabled && !cfg.dayEnabled && (
                      <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
                        Cần bật ít nhất 1 gói (theo buổi hoặc theo ngày) cho hoạt động này.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:static md:bg-transparent md:border-0 md:p-0">
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className={cn(
                'w-full py-4 rounded-2xl font-bold text-lg shadow-primary hover:opacity-90 flex items-center justify-center gap-2',
                isSubmitting ? 'bg-gray-200 text-gray-500' : 'bg-gradient-primary text-white'
              )}
            >
              <Briefcase className="w-5 h-5" />
              {isSubmitting ? 'Đang kích hoạt...' : 'Hoàn tất & Bật Partner'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}