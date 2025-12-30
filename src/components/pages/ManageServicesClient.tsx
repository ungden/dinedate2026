'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import {
  formatCurrency,
  getActivityIcon,
  getActivityLabel,
  cn,
} from '@/lib/utils';
import { ActivityType, ServiceOffering } from '@/types';

const activityOptions: ActivityType[] = ['dining', 'drinking', 'movies', 'travel'];

export default function ManageServicesClient() {
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceOffering | null>(null);
  const [formData, setFormData] = useState({
    activity: 'dining' as ActivityType,
    title: '',
    description: '',
    price: '',
  });

  const { currentUser, addServiceToProfile, updateService, removeService } =
    useDateStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price) return;

    if (editingService) {
      updateService(editingService.id, {
        activity: formData.activity,
        title: formData.title,
        description: formData.description,
        price: parseInt(formData.price),
      });
    } else {
      addServiceToProfile({
        activity: formData.activity,
        title: formData.title,
        description: formData.description,
        price: parseInt(formData.price),
        available: true,
      });
    }

    setShowForm(false);
    setEditingService(null);
    setFormData({ activity: 'dining', title: '', description: '', price: '' });
  };

  const handleEdit = (service: ServiceOffering) => {
    setEditingService(service);
    setFormData({
      activity: service.activity,
      title: service.title,
      description: service.description,
      price: service.price.toString(),
    });
    setShowForm(true);
  };

  const handleToggleAvailable = (service: ServiceOffering) => {
    updateService(service.id, { available: !service.available });
  };

  const services = currentUser.services || [];

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
        <button
          onClick={() => {
            setShowForm(true);
            setEditingService(null);
            setFormData({ activity: 'dining', title: '', description: '', price: '' });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Thêm dịch vụ</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Activity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại hoạt động
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {activityOptions.map((activity) => (
                      <button
                        key={activity}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, activity })
                        }
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-xl border-2 transition',
                          formData.activity === activity
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <span>{getActivityIcon(activity)}</span>
                        <span className="font-medium">
                          {getActivityLabel(activity)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề dịch vụ
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="VD: Đi ăn tối cùng bạn"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Mô tả chi tiết về dịch vụ..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá (VND)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="VD: 500000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingService(null);
                    }}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition"
                  >
                    {editingService ? 'Cập nhật' : 'Thêm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Services List */}
      {services.length > 0 ? (
        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-gray-100 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                    {getActivityIcon(service.activity)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {service.title}
                    </h3>
                    <p className="text-sm text-gray-500">{service.description}</p>
                    <p className="font-semibold text-green-600 mt-1">
                      {formatCurrency(service.price)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAvailable(service)}
                    className={cn(
                      'p-2 rounded-lg transition',
                      service.available
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    )}
                  >
                    {service.available ? (
                      <ToggleRight className="w-6 h-6" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => removeService(service.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <div className="text-6xl mb-4">💼</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Chưa có dịch vụ nào
          </h3>
          <p className="text-gray-500 mb-4">
            Thêm dịch vụ để bắt đầu nhận booking
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition"
          >
            <Plus className="w-5 h-5" />
            Thêm dịch vụ đầu tiên
          </button>
        </div>
      )}
    </div>
  );
}
