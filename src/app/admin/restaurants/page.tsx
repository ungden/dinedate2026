'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Restaurant, CuisineType, CUISINE_LABELS, RestaurantStatus } from '@/types';
import {
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Loader2,
  UtensilsCrossed,
  MapPin,
  Star,
  X,
  ExternalLink,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface RestaurantFormData {
  name: string;
  description: string;
  address: string;
  area: string;
  city: string;
  cuisineTypes: CuisineType[];
  phone: string;
  commissionRate: number;
  status: RestaurantStatus;
}

const emptFormData: RestaurantFormData = {
  name: '',
  description: '',
  address: '',
  area: '',
  city: 'TP.HCM',
  cuisineTypes: [],
  phone: '',
  commissionRate: 0.15,
  status: 'active',
};

const cuisineOptions: CuisineType[] = [
  'vietnamese', 'japanese', 'korean', 'chinese', 'italian',
  'thai', 'bbq', 'hotpot', 'seafood', 'vegetarian', 'fusion', 'other',
];

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RestaurantFormData>(emptFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mapped: Restaurant[] = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        address: row.address || '',
        area: row.area || '',
        city: row.city || '',
        cuisineTypes: row.cuisine_types || [],
        phone: row.phone ?? '',
        commissionRate: Number(row.commission_rate || 0),
        status: row.status as RestaurantStatus,
        averageRating: row.average_rating != null ? Number(row.average_rating) : undefined,
        reviewCount: row.review_count != null ? Number(row.review_count) : undefined,
        logoUrl: row.logo_url ?? undefined,
        coverImageUrl: row.cover_image_url ?? undefined,
        openingHours: row.opening_hours ?? undefined,
        createdAt: row.created_at,
      }));
      setRestaurants(mapped);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(emptFormData);
    setShowModal(true);
  };

  const openEditModal = (restaurant: Restaurant) => {
    setEditingId(restaurant.id);
    setFormData({
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      area: restaurant.area,
      city: restaurant.city,
      cuisineTypes: restaurant.cuisineTypes,
      phone: restaurant.phone || '',
      commissionRate: restaurant.commissionRate,
      status: restaurant.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: formData.name,
      description: formData.description,
      address: formData.address,
      area: formData.area,
      city: formData.city,
      cuisine_types: formData.cuisineTypes,
      phone: formData.phone || null,
      commission_rate: formData.commissionRate,
      status: formData.status,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('restaurants').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('restaurants').insert(payload));
    }

    setSaving(false);

    if (error) {
      console.error('Lỗi lưu nhà hàng:', error);
      alert('Không thể lưu nhà hàng: ' + error.message);
      return;
    }

    setShowModal(false);
    fetchRestaurants();
  };

  const toggleStatus = async (id: string, currentStatus: RestaurantStatus) => {
    const newStatus: RestaurantStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await supabase.from('restaurants').update({ status: newStatus }).eq('id', id);
    fetchRestaurants();
  };

  const toggleCuisine = (ct: CuisineType) => {
    setFormData((prev) => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(ct)
        ? prev.cuisineTypes.filter((c) => c !== ct)
        : [...prev.cuisineTypes, ct],
    }));
  };

  const getStatusBadge = (status: RestaurantStatus) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-600',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    const labels: Record<string, string> = {
      active: 'Hoạt động',
      inactive: 'Tạm ngưng',
      pending: 'Chờ duyệt',
    };
    return (
      <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', styles[status])}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhà hàng</h1>
          <p className="text-gray-500 text-sm mt-1">{restaurants.length} nhà hàng</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition"
        >
          <Plus className="w-4 h-4" />
          Thêm nhà hàng
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left p-4 font-bold text-gray-600">Nhà hàng</th>
                  <th className="text-left p-4 font-bold text-gray-600">Khu vực</th>
                  <th className="text-left p-4 font-bold text-gray-600">Loại món</th>
                  <th className="text-left p-4 font-bold text-gray-600">Hoa hồng</th>
                  <th className="text-left p-4 font-bold text-gray-600">Trạng thái</th>
                  <th className="text-left p-4 font-bold text-gray-600">Đánh giá</th>
                  <th className="text-right p-4 font-bold text-gray-600">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {restaurants.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {r.logoUrl ? (
                          <img src={r.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <UtensilsCrossed className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900">{r.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{r.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{r.area}, {r.city}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {r.cuisineTypes.slice(0, 3).map((ct) => (
                          <span key={ct} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                            {CUISINE_LABELS[ct]}
                          </span>
                        ))}
                        {r.cuisineTypes.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-400">
                            +{r.cuisineTypes.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-700">
                      {(r.commissionRate * 100).toFixed(0)}%
                    </td>
                    <td className="p-4">{getStatusBadge(r.status)}</td>
                    <td className="p-4">
                      {r.averageRating != null ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold">{r.averageRating.toFixed(1)}</span>
                          <span className="text-gray-400 text-xs">({r.reviewCount || 0})</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Chưa có</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/restaurants/${r.id}/combos`}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition"
                          title="Quản lý combo"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEditModal(r)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(r.id, r.status)}
                          className={cn(
                            'p-2 rounded-lg transition',
                            r.status === 'active'
                              ? 'hover:bg-green-50 text-green-600'
                              : 'hover:bg-gray-100 text-gray-400'
                          )}
                          title={r.status === 'active' ? 'Tạm ngưng' : 'Kích hoạt'}
                        >
                          {r.status === 'active' ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {restaurants.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Chưa có nhà hàng nào. Nhấn "Thêm nhà hàng" để bắt đầu.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Chỉnh sửa nhà hàng' : 'Thêm nhà hàng mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên nhà hàng *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="VD: Gogi House - Quan 1"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none"
                  placeholder="Mô tả ngắn về nhà hàng..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="VD: 123 Nguyen Hue, Quan 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Khu vực</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Quan 1"
                  />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Thành phố</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="TP.HCM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Loại ẩm thực</label>
                <div className="flex flex-wrap gap-2">
                  {cuisineOptions.map((ct) => (
                    <button
                      key={ct}
                      type="button"
                      onClick={() => toggleCuisine(ct)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                        formData.cuisineTypes.includes(ct)
                          ? 'bg-primary-50 border-primary-300 text-primary-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {CUISINE_LABELS[ct]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="028 xxxx xxxx"
                  />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Tỷ lệ hoa hồng (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0.15"
                  />
                   <p className="text-xs text-gray-400 mt-1">Nhập dạng thập phân: 0.15 = 15%</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as RestaurantStatus })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Tạm ngưng</option>
                  <option value="pending">Chờ duyệt</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name.trim()}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
