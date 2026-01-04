'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Sparkles, Check } from 'lucide-react';
import {
  formatCurrency,
  getActivityIcon,
  getActivityLabel,
  cn,
} from '@/lib/utils';
import { ActivityType, ServiceOffering } from '@/types';
import { PARTNER_EARNING_RATE } from '@/lib/platform';
import { useDbMyServices } from '@/hooks/useDbMyServices';

const SESSION_HOURS = 3;

const activityOptions: ActivityType[] = ['dining', 'drinking', 'movies', 'travel', 'cafe', 'karaoke', 'tour_guide'];

const PRICE_PRESETS = [
  { value: 300000, label: '300k' },
  { value: 500000, label: '500k' },
  { value: 700000, label: '700k' },
  { value: 1000000, label: '1 triệu' },
  { value: 1500000, label: '1.5 triệu' },
  { value: 2000000, label: '2 triệu' },
];

const DEFAULT_CONTENT: Record<ActivityType, { title: string; description: string }> = {
  dining: {
    title: 'Đi ăn cùng bạn',
    description: 'Cùng thưởng thức những món ăn ngon và trò chuyện vui vẻ.',
  },
  drinking: {
    title: 'Cafe / Bar chill',
    description: 'Ngồi cafe hoặc đi pub nhẹ nhàng, tâm sự chuyện đời sống.',
  },
  movies: {
    title: 'Xem phim rạp',
    description: 'Cùng xem những bộ phim bom tấn mới nhất ngoài rạp.',
  },
  travel: {
    title: 'Du lịch trong ngày',
    description: 'Đồng hành cùng bạn trong chuyến đi ngắn, chụp ảnh và khám phá.',
  },
  cafe: {
    title: 'Cafe trò chuyện',
    description: 'Một buổi cafe nhẹ nhàng để làm quen và kết bạn.',
  },
  karaoke: {
    title: 'Hát Karaoke',
    description: 'Xả stress bằng những bài hát yêu thích.',
  },
  tour_guide: {
    title: 'Hướng dẫn viên địa phương',
    description: 'Dẫn bạn đi thăm thú những địa điểm thú vị trong thành phố.',
  },
};

export default function ManageServicesClient() {
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceOffering | null>(null);
  const [formData, setFormData] = useState({
    activity: 'dining' as ActivityType,
    title: '',
    description: '',
    price: 0,
  });

  const { services, loading, addService, updateService, removeService } = useDbMyServices();

  // Auto-fill content when activity changes (only if fields are empty or match previous default)
  useEffect(() => {
    if (!editingService && formData.activity && (!formData.title || Object.values(DEFAULT_CONTENT).some(c => c.title === formData.title))) {
      const def = DEFAULT_CONTENT[formData.activity];
      setFormData(prev => ({
        ...prev,
        title: def.title,
        description: def.description
      }));
    }
  }, [formData.activity, editingService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price) return;

    if (editingService) {
      await updateService(editingService.id, {
        activity: formData.activity,
        title: formData.title,
        description: formData.description,
        price: formData.price,
      });
    } else {
      await addService({
        activity: formData.activity,
        title: formData.title,
        description: formData.description,
        price: formData.price,
        available: true,
      });
    }

    setShowForm(false);
    setEditingService(null);
    setFormData({ activity: 'dining', title: '', description: '', price: 0 });
  };

  const handleEdit = (service: ServiceOffering) => {
    setEditingService(service);
    setFormData({
      activity: service.activity,
      title: service.title,
      description: service.description,
      price: service.price,
    });
    setShowForm(true);
  };

  const handleToggleAvailable = async (service: ServiceOffering) => {
    await updateService(service.id, { available: !service.available });
  };

  const handleAddNew = () => {
    setShowForm(true);
    setEditingService(null);
    const def = DEFAULT_CONTENT['dining'];
    setFormData({
      activity: 'dining',
      title: def.title,
      description: def.description,
      price: 500000
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Dịch vụ</h1>
        </div>
        {!showForm && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Thêm dịch vụ</span>
          </button>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                {editingService ? <Edit2 className="w-5 h-5 text-primary-500" /> : <Sparkles className="w-5 h-5 text-primary-500" />}
                {editingService ? 'Chỉnh sửa dịch vụ' : 'Thiết lập dịch vụ mới'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Activity */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                    Chọn hoạt động
                  </label>
                  <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                    {activityOptions.map((activity) => (
                      <button
                        key={activity}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, activity })
                        }
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 min-w-[90px] rounded-2xl border-2 transition-all',
                          formData.activity === activity
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                        )}
                      >
                        <span className="text-2xl">{getActivityIcon(activity)}</span>
                        <span className="text-xs font-bold whitespace-nowrap">
                          {getActivityLabel(activity)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                    Mức giá (theo buổi)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {PRICE_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, price: preset.value })}
                        className={cn(
                          'py-3 px-2 rounded-xl border-2 font-bold text-sm transition-all relative',
                          formData.price === preset.value
                            ? 'border-primary-500 bg-primary-50 text-primary-600'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        )}
                      >
                        {preset.label}/buổi
                        {formData.price === preset.value && (
                          <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3px]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Price Projection */}
                  {formData.price > 0 && (
                    <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
                      <p className="text-xs text-green-700 font-medium mb-1">
                        Thu nhập dự kiến (sau phí 30%) • 1 buổi ({SESSION_HOURS} giờ):
                      </p>
                      <div className="flex justify-between items-center text-sm">
                        <span>Nhận về:</span>
                        <span className="font-bold text-green-700">{formatCurrency(formData.price * PARTNER_EARNING_RATE)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Preview */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Tiêu đề hiển thị</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full bg-transparent font-bold text-gray-900 placeholder:text-gray-400 outline-none border-b border-gray-300 focus:border-primary-500 py-1 transition-colors"
                      placeholder="Nhập tiêu đề..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Mô tả ngắn</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={2}
                      className="w-full bg-transparent text-sm text-gray-600 placeholder:text-gray-400 outline-none border-b border-gray-300 focus:border-primary-500 py-1 transition-colors resize-none"
                      placeholder="Mô tả về dịch vụ của bạn..."
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingService(null);
                    }}
                    className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.title || !formData.price}
                    className={cn(
                      "flex-1 py-3.5 rounded-xl font-bold text-white transition shadow-lg",
                      (!formData.title || !formData.price)
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-gradient-primary hover:opacity-90 shadow-primary"
                    )}
                  >
                    {editingService ? 'Lưu thay đổi' : 'Tạo dịch vụ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Services List */}
      {loading ? (
        <div className="py-12 text-center text-gray-500 font-medium">Đang tải dịch vụ...</div>
      ) : services.length > 0 ? (
        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                    {getActivityIcon(service.activity)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {service.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1 line-clamp-1">{service.description}</p>
                    <p className="inline-flex items-center gap-2 px-2 py-0.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold">
                      {formatCurrency(service.price)}/buổi
                      <span className="text-green-700/60 font-black">•</span>
                      <span className="text-green-700/80 font-black">{SESSION_HOURS} giờ</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleToggleAvailable(service)}
                    className={cn(
                      'p-2 rounded-xl transition',
                      service.available
                        ? 'text-green-600 bg-green-50'
                        : 'text-gray-400 bg-gray-100'
                    )}
                  >
                    {service.available ? (
                      <ToggleRight className="w-6 h-6" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(service)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeService(service.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 border-dashed">
          <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Bắt đầu kiếm tiền ngay
          </h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            Tạo dịch vụ theo buổi (3 giờ). Chọn hoạt động và giá mong muốn.
          </p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white rounded-2xl font-bold hover:opacity-90 transition shadow-primary"
          >
            <Plus className="w-5 h-5" />
            Tạo dịch vụ ngay
          </button>
        </div>
      )}
    </div>
  );
}