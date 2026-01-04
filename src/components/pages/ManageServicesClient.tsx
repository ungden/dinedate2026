'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Sparkles, Check, Clock, Lock, Info, ShieldCheck, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import {
  formatCurrency,
  getActivityIcon,
  getActivityLabel,
  cn,
} from '@/lib/utils';
import { ActivityType, ServiceOffering, ServiceDuration } from '@/types';
import { PARTNER_EARNING_RATE } from '@/lib/platform';
import { useDbMyServices } from '@/hooks/useDbMyServices';
import { useAuth } from '@/contexts/AuthContext';

const activityOptions: ActivityType[] = ['dining', 'drinking', 'movies', 'travel', 'cafe', 'karaoke', 'tour_guide'];

const DEFAULT_CONTENT: Record<ActivityType, { title: string; description: string }> = {
  dining: { title: 'Đi ăn cùng bạn', description: 'Cùng thưởng thức món ngon và trò chuyện.' },
  drinking: { title: 'Cafe / Bar chill', description: 'Ngồi cafe hoặc đi pub nhẹ nhàng.' },
  movies: { title: 'Xem phim rạp', description: 'Cùng xem những bộ phim bom tấn.' },
  travel: { title: 'Du lịch trong ngày', description: 'Đồng hành chuyến đi ngắn.' },
  cafe: { title: 'Cafe trò chuyện', description: 'Một buổi cafe nhẹ nhàng.' },
  karaoke: { title: 'Hát Karaoke', description: 'Xả stress bằng âm nhạc.' },
  tour_guide: { title: 'Hướng dẫn viên', description: 'Dẫn bạn đi thăm thú thành phố.' },
};

const LOCKED_PRICE = 500000;

export default function ManageServicesClient() {
  const { user } = useAuth();
  const isPro = !!user?.isPro;

  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceOffering | null>(null);
  
  // For Bulk Create
  const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>([]);

  // Single Form Data (used for Edit or Single Create)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: LOCKED_PRICE,
    duration: 'session' as ServiceDuration,
  });

  const { services, loading, addService, updateService, removeService } = useDbMyServices();

  // Reset form when opening/closing
  useEffect(() => {
    if (!showForm) {
      setSelectedActivities([]);
      setFormData({
        title: '',
        description: '',
        price: isPro ? LOCKED_PRICE : LOCKED_PRICE, // Default
        duration: 'session'
      });
    }
  }, [showForm, isPro]);

  // Auto-fill content if single activity selected in CREATE mode
  useEffect(() => {
    if (!editingService && selectedActivities.length === 1) {
      const act = selectedActivities[0];
      const def = DEFAULT_CONTENT[act];
      setFormData(prev => ({
        ...prev,
        title: def.title,
        description: def.description
      }));
    }
  }, [selectedActivities, editingService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Logic giá & thời lượng
    let finalDuration: ServiceDuration = 'session';
    let finalPrice = formData.price;

    if (!isPro) {
        // Non-Pro: Lock to 500k / session
        finalDuration = 'session';
        finalPrice = LOCKED_PRICE; 
    } else {
        // Pro: Use form values
        finalDuration = formData.duration;
    }

    if (editingService) {
      // --- EDIT MODE ---
      await updateService(editingService.id, {
        title: formData.title,
        description: formData.description,
        price: finalPrice,
        duration: finalDuration
      });
    } else {
      // --- CREATE MODE (Bulk or Single) ---
      if (selectedActivities.length === 0) return;

      for (const act of selectedActivities) {
        // If multiple selected, use default content. If single, use form content.
        const content = selectedActivities.length === 1 
          ? { title: formData.title, description: formData.description }
          : DEFAULT_CONTENT[act];

        await addService({
          activity: act,
          title: content.title,
          description: content.description,
          price: finalPrice,
          duration: finalDuration,
          available: true,
        });
      }
    }

    setShowForm(false);
    setEditingService(null);
  };

  const handleEdit = (service: ServiceOffering) => {
    setEditingService(service);
    setSelectedActivities([service.activity]); // Lock activity visually
    setFormData({
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
    setEditingService(null);
    setSelectedActivities([]); // Reset
    setFormData(prev => ({ ...prev, price: isPro ? 500000 : LOCKED_PRICE }));
    setShowForm(true);
  };

  const toggleActivitySelection = (act: ActivityType) => {
    if (editingService) return; // Cannot change activity in edit mode
    
    setSelectedActivities(prev => {
      if (prev.includes(act)) return prev.filter(x => x !== act);
      return [...prev, act];
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

      {!isPro && (
        <div className="bg-gray-900 text-white rounded-xl p-4 text-sm flex gap-3">
          <Lock className="w-5 h-5 flex-shrink-0 text-yellow-400" />
          <div>
            <p className="font-bold">Chế độ Pro chưa kích hoạt</p>
            <p className="text-gray-400 text-xs mt-1">
              Bạn chỉ có thể tạo dịch vụ với giá cố định <b>{formatCurrency(LOCKED_PRICE)}/buổi</b>. 
              Hoàn thành 5 đơn + 4.8★ để mở khóa tự nhập giá.
            </p>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                {editingService ? <Edit2 className="w-5 h-5 text-primary-500" /> : <Sparkles className="w-5 h-5 text-primary-500" />}
                {editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Activity Selection Grid */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    {editingService ? 'Loại dịch vụ' : 'Chọn dịch vụ (Có thể chọn nhiều)'}
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {activityOptions.map((activity) => {
                      const isSelected = selectedActivities.includes(activity);
                      return (
                        <button
                          key={activity}
                          type="button"
                          onClick={() => toggleActivitySelection(activity)}
                          disabled={!!editingService && !isSelected}
                          className={cn(
                            'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all relative',
                            isSelected
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100',
                            (!!editingService && !isSelected) && 'opacity-40 cursor-not-allowed'
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-primary-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                                <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                          <span className="text-2xl">{getActivityIcon(activity)}</span>
                          <span className="text-[10px] font-bold text-center leading-tight">{getActivityLabel(activity)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Single Service Details (Only if 1 selected or editing) */}
                {(selectedActivities.length === 1 || editingService) && (
                  <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tiêu đề</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900 focus:border-primary-500 outline-none"
                        placeholder="VD: Đi cafe cùng bạn"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mô tả</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 focus:border-primary-500 outline-none resize-none"
                        placeholder="Mô tả chi tiết..."
                      />
                    </div>
                  </div>
                )}

                {/* Bulk Mode Notice */}
                {!editingService && selectedActivities.length > 1 && (
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl flex items-center gap-3">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">
                      Bạn đang chọn <b>{selectedActivities.length} dịch vụ</b>. Hệ thống sẽ tạo tự động với tiêu đề và mô tả mặc định. Bạn có thể chỉnh sửa lại sau.
                    </p>
                  </div>
                )}

                {/* Duration & Price */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cấu hình giá</label>
                  
                  {isPro ? (
                    // PRO MODE: Full Control
                    <div className="space-y-3">
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
                        <div className="relative">
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl font-bold text-lg text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Nhập giá..."
                                step={50000}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">VNĐ</span>
                        </div>
                    </div>
                  ) : (
                    // NON-PRO: Locked
                    <div className="bg-gray-100 rounded-2xl p-4 border border-gray-200 opacity-80 cursor-not-allowed">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Theo buổi (3h)
                            </span>
                            <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="text-xl font-black text-gray-800">
                            {formatCurrency(LOCKED_PRICE)}
                        </div>
                    </div>
                  )}

                  {/* Revenue Calculation */}
                  <div className="mt-3 bg-white border border-gray-200 rounded-xl p-3 text-xs space-y-1 shadow-sm">
                      <div className="flex justify-between items-center font-bold text-gray-700">
                          <span>Thực nhận (70%):</span>
                          <span className="text-green-600 text-sm">
                              {formatCurrency((isPro ? formData.price : LOCKED_PRICE) * PARTNER_EARNING_RATE)}
                          </span>
                      </div>
                      <div className="flex justify-between items-center text-gray-500">
                          <span>Phí nền tảng (30%):</span>
                          <span>{formatCurrency((isPro ? formData.price : LOCKED_PRICE) * (1 - PARTNER_EARNING_RATE))}</span>
                      </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold">Hủy</button>
                  <button 
                    type="submit" 
                    disabled={selectedActivities.length === 0} 
                    className="flex-1 py-3.5 bg-gradient-primary text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingService ? 'Lưu thay đổi' : `Tạo ${selectedActivities.length} dịch vụ`}
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
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                    {getActivityIcon(service.activity)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate pr-2">{service.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded uppercase flex-shrink-0",
                        service.duration === 'day' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {service.duration === 'day' ? 'Theo ngày' : 'Theo buổi'}
                      </span>
                      <span className="font-bold text-primary-600 whitespace-nowrap">{formatCurrency(service.price)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
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