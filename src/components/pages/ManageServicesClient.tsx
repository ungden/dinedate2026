'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Sparkles, Check, Clock } from 'lucide-react';
import {
  formatCurrency,
  getActivityIcon,
  getActivityLabel,
  cn,
} from '@/lib/utils';
import { ActivityType, ServiceOffering, ServiceDuration } from '@/types';
import { PARTNER_EARNING_RATE } from '@/lib/platform';
import { useDbMyServices } from '@/hooks/useDbMyServices';

const activityOptions: ActivityType[] = ['dining', 'drinking', 'movies', 'travel', 'cafe', 'karaoke', 'tour_guide'];

const PRICE_PRESETS_SESSION = [300000, 500000, 700000, 1000000];
const PRICE_PRESETS_DAY = [1000000, 1500000, 2000000, 3000000];

const DEFAULT_CONTENT: Record<ActivityType, { title: string; description: string }> = {
  dining: { title: 'Đi ăn cùng bạn', description: 'Cùng thưởng thức món ngon và trò chuyện.' },
  drinking: { title: 'Cafe / Bar chill', description: 'Ngồi cafe hoặc đi pub nhẹ nhàng.' },
  movies: { title: 'Xem phim rạp', description: 'Cùng xem những bộ phim bom tấn.' },
  travel: { title: 'Du lịch trong ngày', description: 'Đồng hành chuyến đi ngắn.' },
  cafe: { title: 'Cafe trò chuyện', description: 'Một buổi cafe nhẹ nhàng.' },
  karaoke: { title: 'Hát Karaoke', description: 'Xả stress bằng âm nhạc.' },
  tour_guide: { title: 'Hướng dẫn viên', description: 'Dẫn bạn đi thăm thú thành phố.' },
};

export default function ManageServicesClient() {
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceOffering | null>(null);
  
  const [formData, setFormData] = useState({
    activity: 'dining' as ActivityType,
    title: '',
    description: '',
    price: 0,
    duration: 'session' as ServiceDuration,
  });

  const { services, loading, addService, updateService, removeService } = useDbMyServices();

  // Presets based on duration type
  const pricePresets = formData.duration === 'session' ? PRICE_PRESETS_SESSION : PRICE_PRESETS_DAY;

  // Auto-fill content
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

    const payload = {
      activity: formData.activity,
      title: formData.title,
      description: formData.description,
      price: formData.price,
      duration: formData.duration,
    };

    if (editingService) {
      await updateService(editingService.id, payload);
    } else {
      await addService({ ...payload, available: true });
    }

    setShowForm(false);
    setEditingService(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ activity: 'dining', title: '', description: '', price: 0, duration: 'session' });
  };

  const handleEdit = (service: ServiceOffering) => {
    setEditingService(service);
    setFormData({
      activity: service.activity,
      title: service.title,
      description: service.description,
      price: service.price,
      duration: service.duration || 'session',
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
      price: 500000,
      duration: 'session'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Dịch vụ</h1>
        </div>
        {!showForm && (
          <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition">
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
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Loại hoạt động</label>
                  <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                    {activityOptions.map((activity) => (
                      <button
                        key={activity}
                        type="button"
                        onClick={() => setFormData({ ...formData, activity })}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 min-w-[80px] rounded-xl border-2 transition-all',
                          formData.activity === activity
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                        )}
                      >
                        <span className="text-2xl">{getActivityIcon(activity)}</span>
                        <span className="text-xs font-bold whitespace-nowrap">{getActivityLabel(activity)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Toggle */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cách tính giá</label>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, duration: 'session'})}
                      className={cn(
                        "flex-1 py-2 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2",
                        formData.duration === 'session' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <Clock className="w-4 h-4" /> Theo buổi (3h)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, duration: 'day'})}
                      className={cn(
                        "flex-1 py-2 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2",
                        formData.duration === 'day' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <Sparkles className="w-4 h-4" /> Theo ngày
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Mức giá ({formData.duration === 'session' ? '/buổi' : '/ngày'})
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {pricePresets.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFormData({ ...formData, price: val })}
                        className={cn(
                          'py-2 px-2 rounded-xl border-2 font-bold text-sm transition-all relative',
                          formData.price === val
                            ? 'border-primary-500 bg-primary-50 text-primary-600'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        )}
                      >
                        {formatCurrency(val)}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <input
                        type="number"
                        value={formData.price || ''}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl font-bold text-lg text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="Nhập giá khác..."
                        step={50000}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">VNĐ</span>
                  </div>
                  
                  {formData.price > 0 && (
                    <div className="mt-2 text-xs text-gray-500 flex justify-between">
                      <span>Phí nền tảng (30%): -{formatCurrency(formData.price * (1 - PARTNER_EARNING_RATE))}</span>
                      <span className="font-bold text-green-600">Thực nhận: {formatCurrency(formData.price * PARTNER_EARNING_RATE)}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tiêu đề</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border-b border-gray-200 py-2 font-bold text-gray-900 focus:border-primary-500 outline-none"
                      placeholder="VD: Đi cafe cùng bạn"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mô tả</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full border-b border-gray-200 py-2 text-sm text-gray-600 focus:border-primary-500 outline-none resize-none"
                      placeholder="Mô tả chi tiết..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold">Hủy</button>
                  <button type="submit" disabled={!formData.title || !formData.price} className="flex-1 py-3.5 bg-gradient-primary text-white rounded-xl font-bold shadow-lg disabled:opacity-50">
                    {editingService ? 'Lưu' : 'Tạo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Đang tải...</div>
      ) : services.length > 0 ? (
        <div className="space-y-4">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl">
                    {getActivityIcon(service.activity)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{service.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                        service.duration === 'day' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {service.duration === 'day' ? 'Theo ngày' : 'Theo buổi'}
                      </span>
                      <span className="font-bold text-primary-600">{formatCurrency(service.price)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleToggleAvailable(service)} className={cn("p-2 rounded-xl transition", service.available ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400")}>
                    {service.available ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(service)} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => removeService(service.id)} className="p-2 text-red-600 bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border-dashed border border-gray-200">
          <p className="text-gray-500 mb-4">Chưa có dịch vụ nào</p>
          <button onClick={handleAddNew} className="px-6 py-2 bg-gradient-primary text-white rounded-full font-bold">Tạo ngay</button>
        </div>
      )}
    </div>
  );
}