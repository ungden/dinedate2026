'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, MapPin, Wallet, Loader2 } from 'lucide-react';
import { ActivityType, HiringAmount } from '@/types';
import {
  getActivityIcon,
  getActivityLabel,
  cn,
} from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const activities: ActivityType[] = ['dining', 'drinking', 'movies', 'travel', 'cafe', 'karaoke', 'tour_guide'];

const hiringOptions: { amount: HiringAmount; label: string }[] = [
  { amount: 0, label: 'Miễn phí' },
  { amount: 300000, label: '300K' },
  { amount: 500000, label: '500K' },
  { amount: 700000, label: '700K' },
  { amount: 1000000, label: '1 triệu' },
];

const locationPresets = [
  'Quận 1, TP.HCM',
  'Quận 3, TP.HCM',
  'Quận 7, TP.HCM',
  'Quận Bình Thạnh, TP.HCM',
  'Quận Phú Nhuận, TP.HCM',
];

const titleSuggestions: Record<ActivityType, string[]> = {
  dining: [
    'Thưởng thức ẩm thực Hàn Quốc',
    'Ăn tối lãng mạn',
    'Khám phá món ngon đường phố',
    'Buffet cuối tuần',
  ],
  drinking: [
    'Rooftop bar chill',
    'Wine tasting tối thứ 7',
    'Cocktail party',
    'Đi pub nghe nhạc acoustic',
  ],
  movies: [
    'Xem phim bom tấn mới',
    'Movie night cuối tuần',
    'Phim kinh dị nửa đêm',
    'Xem phim hoạt hình',
  ],
  travel: [
    'Đi Vũng Tàu 1 ngày',
    'Khám phá Đà Lạt',
    'City tour Sài Gòn',
    'Phượt cuối tuần',
  ],
  cafe: [
    'Cafe sáng cuối tuần',
    'Tìm quán cafe làm việc',
    'Cafe sống ảo',
    'Trò chuyện tại quán quen',
  ],
  karaoke: [
    'Hát cho nhau nghe',
    'Karaoke xả stress',
    'Luyện giọng cuối tuần',
    'Tiệc karaoke sinh nhật',
  ],
  tour_guide: [
    'Dẫn tour quanh thành phố',
    'Food tour quận 5',
    'Khám phá địa điểm lịch sử',
    'Tour chụp ảnh',
  ],
};

export default function CreateRequestClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    activity: 'dining' as ActivityType,
    title: '',
    description: '',
    location: '',
    date: '',
    time: '19:00',
    hiringAmount: 0 as HiringAmount,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.length < 5) {
      newErrors.title = 'Tiêu đề phải có ít nhất 5 ký tự';
    }
    if (!formData.location || formData.location.length < 5) {
      newErrors.location = 'Địa điểm phải có ít nhất 5 ký tự';
    }
    if (!formData.date) {
      newErrors.date = 'Vui lòng chọn ngày';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Vui lòng đăng nhập để tạo lời mời');
      router.push('/login');
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('date_requests').insert({
        user_id: user.id,
        activity: formData.activity,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        date: formData.date,
        time: formData.time,
        hiring_amount: formData.hiringAmount,
        hiring_option: `tier${hiringOptions.findIndex((h) => h.amount === formData.hiringAmount)}`,
        max_participants: 2,
        status: 'active'
      });

      if (error) throw error;

      toast.success('Đã tạo lời mời thành công! 🎉');
      router.push('/discover');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Tạo lời mời mới</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Activity Type */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Loại hoạt động
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {activities.map((activity) => (
              <button
                key={activity}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, activity, title: '' })
                }
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition',
                  formData.activity === activity
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <span className="text-3xl">{getActivityIcon(activity)}</span>
                <span className="font-medium text-sm">
                  {getActivityLabel(activity)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Title & Description */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="VD: Thưởng thức BBQ Hàn Quốc"
              className={cn(
                'w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none',
                errors.title ? 'border-red-300' : 'border-gray-200'
              )}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {titleSuggestions[formData.activity].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setFormData({ ...formData, title: suggestion })}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Mô tả thêm về lời mời của bạn..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">Địa điểm</h2>
          </div>
          <input
            type="text"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="VD: Quận 1, TP.HCM"
            className={cn(
              'w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mb-2',
              errors.location ? 'border-red-300' : 'border-gray-200'
            )}
          />
          {errors.location && (
            <p className="text-red-500 text-sm mb-2">{errors.location}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {locationPresets.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setFormData({ ...formData, location: loc })}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition"
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                <label className="text-sm font-medium text-gray-700">
                  Ngày <span className="text-red-500">*</span>
                </label>
              </div>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                min={new Date().toISOString().split('T')[0]}
                className={cn(
                  'w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none',
                  errors.date ? 'border-red-300' : 'border-gray-200'
                )}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-primary-500" />
                <label className="text-sm font-medium text-gray-700">Giờ</label>
              </div>
              <input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Hiring Amount */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">Mức chi trả</h2>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {hiringOptions.map((option) => (
              <button
                key={option.amount}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, hiringAmount: option.amount })
                }
                className={cn(
                  'py-3 rounded-xl font-medium transition border-2',
                  formData.hiringAmount === option.amount
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full py-4 bg-gradient-primary text-white rounded-xl font-semibold transition shadow-primary flex items-center justify-center gap-2",
            isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
          )}
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {isSubmitting ? 'Đang đăng...' : 'Đăng lời mời'}
        </button>
      </form>
    </div>
  );
}