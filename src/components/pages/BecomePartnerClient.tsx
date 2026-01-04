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
  Lock,
  Loader2,
} from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { ActivityType, ServiceDuration } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import { useDbMyServices } from '@/hooks/useDbMyServices';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const ACTIVITY_OPTIONS: { value: ActivityType; label: string; Icon: React.ElementType; defaultDuration: ServiceDuration }[] = [
  { value: 'cafe', label: 'Cafe', Icon: Coffee, defaultDuration: 'session' },
  { value: 'dining', label: 'Ăn uống', Icon: Utensils, defaultDuration: 'session' },
  { value: 'movies', label: 'Xem phim', Icon: Clapperboard, defaultDuration: 'session' },
  { value: 'drinking', label: 'Cafe/Bar', Icon: Wine, defaultDuration: 'session' },
  { value: 'karaoke', label: 'Karaoke', Icon: Mic2, defaultDuration: 'session' },
  { value: 'tour_guide', label: 'Tour guide', Icon: Map, defaultDuration: 'day' },
  { value: 'travel', label: 'Du lịch', Icon: Plane, defaultDuration: 'day' },
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

interface ServiceConfig {
  activity: ActivityType;
  sessionEnabled: boolean;
  sessionPrice: number;
  dayEnabled: boolean;
  dayPrice: number;
}

function defaultConfigForActivity(activity: ActivityType): ServiceConfig {
  const defaultSession = activity !== 'tour_guide' && activity !== 'travel';
  const defaultDay = false; // Initially disabled for everyone

  return {
    activity,
    sessionEnabled: defaultSession,
    sessionPrice: 500000,
    dayEnabled: defaultDay,
    dayPrice: 1500000,
  };
}

export default function BecomePartnerClient() {
  const { addService } = useDbMyServices();
  const { user: authUser, refreshProfile } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>(['cafe', 'dining']);

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
  const isPro = !!authUser?.isPro;

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

    setIsSubmitting(true);

    // 1) Mark partner
    await markPartnerActive();

    // 2) Create services
    for (const activity of selectedActivities) {
      const cfg = configs[activity];
      const baseTitle = DEFAULT_TITLES[activity] || 'Dịch vụ đồng hành';
      const baseDesc = DEFAULT_DESCRIPTIONS[activity] || 'Dịch vụ đồng hành theo yêu cầu.';

      if (cfg.sessionEnabled) {
        await addService({
          activity,
          title: `${baseTitle}`,
          description: baseDesc,
          price: cfg.sessionPrice,
          duration: 'session',
          available: true,
        });
      }

      if (cfg.dayEnabled && isPro) { // Security check
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
    window.location.href = '/partner-dashboard';
  };

  const PRICE_PRESETS = [300000, 500000, 700000, 1000000];

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
                    Dashboard
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
          <h2 className="text-lg font-bold text-gray-900">Cần hoàn thiện hồ sơ trước</h2>
          <div className="mt-4 space-y-3">
            {profileBlockReasons.map((r) => (
              <div key={r.key} className="bg-white rounded-2xl border border-rose-100 p-4">
                <p className="font-bold text-gray-900">{r.title}</p>
                <p className="text-sm text-gray-600 mt-1">{r.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <Link href="/profile/edit" className="flex-1">
              <button className="w-full py-3 bg-gradient-primary text-white rounded-xl font-bold shadow-primary">
                Cập nhật ngay
              </button>
            </Link>
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
            {step === 1 ? 'Chọn dịch vụ' : 'Thiết lập giá'}
          </h1>
          <p className="text-sm text-gray-500">
            {step === 1 ? 'Chọn sở trường của bạn' : 'Cấu hình giá cho từng dịch vụ'}
          </p>
        </div>
        <div className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500">{step}/2</div>
      </div>

      {/* PRO BANNER */}
      {!isPro && step === 2 && (
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl p-4 flex items-start gap-3 shadow-lg">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Chế độ Partner tiêu chuẩn</p>
            <p className="text-xs text-white/80 mt-1">
              Hoàn thành <b>5 đơn hàng</b> + <b>đánh giá 4.8★</b> để mở khóa:
            </p>
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded">✅ Booking theo ngày</span>
              <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded">✅ Tự nhập giá</span>
            </div>
          </div>
        </div>
      )}

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
                    {isSelected && <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                  </div>
                  <p className="font-bold text-sm">{opt.label}</p>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={selectedActivities.length === 0}
            className="w-full py-4 bg-gradient-primary text-white rounded-2xl font-bold shadow-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tiếp tục
          </button>
        </motion.div>
      )}

      {/* STEP 2: CONFIGURE */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 pb-20">
          <div className="space-y-6">
            {selectedActivities.map((activity) => {
              const option = ACTIVITY_OPTIONS.find((o) => o.value === activity)!;
              const cfg = configs[activity];
              const Icon = option.Icon;

              return (
                <div key={activity} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900 flex-1">{option.label}</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Session Option */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-bold text-gray-700">Theo buổi (3h)</span>
                        </div>
                        <button
                          onClick={() => updateConfig(activity, 'sessionEnabled', !cfg.sessionEnabled)}
                          className={cn(
                            'px-3 py-1 rounded-lg text-xs font-bold transition-colors',
                            cfg.sessionEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                          )}
                        >
                          {cfg.sessionEnabled ? 'Bật' : 'Tắt'}
                        </button>
                      </div>

                      {cfg.sessionEnabled && (
                        <div>
                          {isPro ? (
                            <div className="relative">
                              <input
                                type="number"
                                value={cfg.sessionPrice}
                                onChange={(e) => updateConfig(activity, 'sessionPrice', Number(e.target.value))}
                                className="w-full pl-3 pr-10 py-2 rounded-lg border border-gray-200 text-sm font-bold"
                              />
                              <span className="absolute right-3 top-2 text-xs text-gray-400">đ</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {PRICE_PRESETS.map((price) => (
                                <button
                                  key={price}
                                  onClick={() => updateConfig(activity, 'sessionPrice', price)}
                                  className={cn(
                                    'py-2 rounded-lg border text-xs font-bold transition-colors',
                                    cfg.sessionPrice === price
                                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                                      : 'border-gray-200 bg-white text-gray-600'
                                  )}
                                >
                                  {formatCurrency(price)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Day Option (Locked for non-pro) */}
                    <div className={cn(
                      "rounded-xl p-3 border",
                      isPro ? "bg-gray-50 border-gray-100" : "bg-gray-100 border-gray-200 opacity-80"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-bold text-gray-700">Theo ngày</span>
                          {!isPro && <Lock className="w-3 h-3 text-gray-400" />}
                        </div>
                        
                        {isPro ? (
                          <button
                            onClick={() => updateConfig(activity, 'dayEnabled', !cfg.dayEnabled)}
                            className={cn(
                              'px-3 py-1 rounded-lg text-xs font-bold transition-colors',
                              cfg.dayEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                            )}
                          >
                            {cfg.dayEnabled ? 'Bật' : 'Tắt'}
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold bg-gray-200 text-gray-500 px-2 py-1 rounded">
                            Khóa
                          </span>
                        )}
                      </div>

                      {isPro && cfg.dayEnabled && (
                        <div className="mt-3 relative">
                           <input
                              type="number"
                              value={cfg.dayPrice}
                              onChange={(e) => updateConfig(activity, 'dayPrice', Number(e.target.value))}
                              className="w-full pl-3 pr-10 py-2 rounded-lg border border-gray-200 text-sm font-bold"
                            />
                            <span className="absolute right-3 top-2 text-xs text-gray-400">đ</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleCreate}
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-primary text-white rounded-2xl font-bold shadow-primary flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Briefcase className="w-5 h-5" />}
            {isSubmitting ? 'Đang kích hoạt...' : 'Hoàn tất & Bật Partner'}
          </button>
        </motion.div>
      )}
    </div>
  );
}