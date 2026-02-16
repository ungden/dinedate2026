'use client';
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { Combo, Restaurant } from '@/types';
import {
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Loader2,
  ArrowLeft,
  X,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface ComboFormData {
  name: string;
  description: string;
  items: string[];
  price: number;
  imageUrl: string;
  isAvailable: boolean;
}

const emptyFormData: ComboFormData = {
  name: '',
  description: '',
  items: [''],
  price: 0,
  imageUrl: '',
  isAvailable: true,
};

export default function AdminCombosPage() {
  const params = useParams();
  const restaurantId = params.id as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ComboFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurant();
      fetchCombos();
    }
  }, [restaurantId]);

  const fetchRestaurant = async () => {
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (data) {
      setRestaurant({
        id: data.id,
        name: data.name,
        description: data.description || '',
        address: data.address || '',
        area: data.area || '',
        city: data.city || '',
        cuisineTypes: data.cuisine_types || [],
        commissionRate: Number(data.commission_rate || 0),
        status: data.status,
        createdAt: data.created_at,
      });
    }
  };

  const fetchCombos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('combos')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mapped: Combo[] = data.map((row: any) => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        name: row.name,
        description: row.description || '',
        items: row.items || [],
        price: Number(row.price || 0),
        imageUrl: row.image_url ?? '',
        isAvailable: row.is_available ?? true,
        createdAt: row.created_at,
      }));
      setCombos(mapped);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(emptyFormData);
    setShowModal(true);
  };

  const openEditModal = (combo: Combo) => {
    setEditingId(combo.id);
    setFormData({
      name: combo.name,
      description: combo.description,
      items: combo.items.length > 0 ? combo.items : [''],
      price: combo.price,
      imageUrl: combo.imageUrl || '',
      isAvailable: combo.isAvailable,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const cleanItems = formData.items.filter((item) => item.trim() !== '');

    const payload = {
      restaurant_id: restaurantId,
      name: formData.name,
      description: formData.description,
      items: cleanItems,
      price: formData.price,
      image_url: formData.imageUrl || null,
      is_available: formData.isAvailable,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('combos').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('combos').insert(payload));
    }

    setSaving(false);

    if (error) {
      console.error('Lỗi lưu combo:', error);
      alert('Không thể lưu combo: ' + error.message);
      return;
    }

    setShowModal(false);
    fetchCombos();
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    await supabase.from('combos').update({ is_available: !current }).eq('id', id);
    fetchCombos();
  };

  const addItem = () => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, ''] }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? value : item)),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/restaurants"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý Combo
          </h1>
          {restaurant && (
            <p className="text-gray-500 text-sm mt-0.5">
              {restaurant.name} - {combos.length} combo
            </p>
          )}
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition"
        >
          <Plus className="w-4 h-4" />
          Thêm combo
        </button>
      </div>

      {/* Combo List */}
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : combos.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
          <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-bold">Chưa có combo nào</p>
          <p className="text-sm mt-1">Nhấn &ldquo;Thêm combo&rdquo; để tạo combo mới cho nhà hàng này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combos.map((combo) => (
            <div
              key={combo.id}
              className={cn(
                'bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-md',
                combo.isAvailable ? 'border-gray-100' : 'border-gray-200 opacity-60'
              )}
            >
              {combo.imageUrl ? (
                <img
                  src={combo.imageUrl}
                  alt={combo.name}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                  <UtensilsCrossed className="w-10 h-10 text-gray-300" />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{combo.name}</h3>
                    <p className="text-lg font-bold text-primary-600 mt-0.5">
                      {formatCurrency(combo.price)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-bold',
                      combo.isAvailable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {combo.isAvailable ? 'Còn bán' : 'Hết'}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{combo.description}</p>

                <div className="mt-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Món trong combo
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {combo.items.slice(0, 4).map((item, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-50 rounded text-xs text-gray-600">
                        {item}
                      </span>
                    ))}
                    {combo.items.length > 4 && (
                      <span className="px-2 py-0.5 bg-gray-50 rounded text-xs text-gray-400">
                        +{combo.items.length - 4} món
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openEditModal(combo)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Sửa
                  </button>
                  <button
                    onClick={() => toggleAvailability(combo.id, combo.isAvailable)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition',
                      combo.isAvailable
                        ? 'bg-green-50 hover:bg-green-100 text-green-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    )}
                  >
                    {combo.isAvailable ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                         Bật
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                         Tắt
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Chỉnh sửa combo' : 'Thêm combo mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên combo *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="VD: Combo BBQ Couple"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 h-20 resize-none"
                  placeholder="Mô tả combo..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Các món trong combo
                </label>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateItem(index, e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        placeholder={`Món ${index + 1}`}
                      />
                      {formData.items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItem}
                    className="w-full px-4 py-2 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition"
                  >
                    + Thêm món
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Giá (VND) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="450000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={formData.isAvailable ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({ ...formData, isAvailable: e.target.value === 'true' })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="true">Còn bán</option>
                    <option value="false">Hết hàng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">URL Hình ảnh</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://..."
                />
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
                disabled={saving || !formData.name.trim() || formData.price <= 0}
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
