'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  X,
  CheckCircle,
  XCircle,
  Tag,
  Percent,
  Calendar,
  Users,
  BarChart3,
  Copy,
  Eye,
  Filter,
  Sparkles,
} from 'lucide-react';
import { cn, formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number;
  usage_limit: number;
  used_count: number;
  user_limit: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  first_booking_only: boolean;
  created_at: string;
  updated_at: string;
}

interface PromoUsage {
  id: string;
  promo_code_id: string;
  user_id: string;
  booking_id: string;
  discount_amount: number;
  used_at: string;
  user?: { name: string; avatar_url: string };
}

const DEFAULT_FORM_DATA = {
  code: '',
  description: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: 10,
  min_order_amount: 0,
  max_discount_amount: 0,
  usage_limit: 0,
  user_limit: 1,
  valid_from: new Date().toISOString().split('T')[0],
  valid_until: '',
  is_active: true,
  first_booking_only: false,
};

export default function AdminPromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [saving, setSaving] = useState(false);

  // Usage modal
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedPromoForUsage, setSelectedPromoForUsage] = useState<PromoCode | null>(null);
  const [usages, setUsages] = useState<PromoUsage[]>([]);
  const [loadingUsages, setLoadingUsages] = useState(false);

  // Action menu
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (err) {
      console.error('Error fetching promo codes:', err);
      toast.error('Không thể tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsages = async (promoCodeId: string) => {
    setLoadingUsages(true);
    try {
      const { data, error } = await supabase
        .from('promo_code_usages')
        .select('*')
        .eq('promo_code_id', promoCodeId)
        .order('used_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch user info
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((u: any) => u.user_id))];
        const { data: users } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .in('id', userIds);

        const usersMap = new Map((users || []).map((u: any) => [u.id, u]));
        const enrichedUsages = data.map((usage: any) => ({
          ...usage,
          user: usersMap.get(usage.user_id),
        }));
        setUsages(enrichedUsages);
      } else {
        setUsages([]);
      }
    } catch (err) {
      console.error('Error fetching usages:', err);
      toast.error('Không thể tải lịch sử sử dụng');
    } finally {
      setLoadingUsages(false);
    }
  };

  const openCreateModal = () => {
    setFormData(DEFAULT_FORM_DATA);
    setEditingPromo(null);
    setShowCreateModal(true);
  };

  const openEditModal = (promo: PromoCode) => {
    setFormData({
      code: promo.code,
      description: promo.description,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_order_amount: promo.min_order_amount,
      max_discount_amount: promo.max_discount_amount,
      usage_limit: promo.usage_limit,
      user_limit: promo.user_limit,
      valid_from: promo.valid_from?.split('T')[0] || '',
      valid_until: promo.valid_until?.split('T')[0] || '',
      is_active: promo.is_active,
      first_booking_only: promo.first_booking_only,
    });
    setEditingPromo(promo);
    setShowCreateModal(true);
    setActionMenuId(null);
  };

  const openUsageModal = (promo: PromoCode) => {
    setSelectedPromoForUsage(promo);
    setShowUsageModal(true);
    fetchUsages(promo.id);
    setActionMenuId(null);
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }

    if (formData.discount_value <= 0) {
      toast.error('Giá trị giảm giá phải lớn hơn 0');
      return;
    }

    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      toast.error('Phần trăm giảm giá không thể vượt quá 100%');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        min_order_amount: formData.min_order_amount || 0,
        max_discount_amount: formData.max_discount_amount || 0,
        usage_limit: formData.usage_limit || 0,
        user_limit: formData.user_limit || 1,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : new Date().toISOString(),
        valid_until: formData.valid_until ? new Date(formData.valid_until + 'T23:59:59').toISOString() : null,
        is_active: formData.is_active,
        first_booking_only: formData.first_booking_only,
      };

      if (editingPromo) {
        // Update
        const { error } = await supabase
          .from('promo_codes')
          .update(payload)
          .eq('id', editingPromo.id);

        if (error) throw error;
        toast.success('Đã cập nhật mã giảm giá');
      } else {
        // Create
        const { error } = await supabase
          .from('promo_codes')
          .insert(payload);

        if (error) {
          if (error.code === '23505') {
            toast.error('Mã giảm giá đã tồn tại');
            return;
          }
          throw error;
        }
        toast.success('Đã tạo mã giảm giá mới');
      }

      setShowCreateModal(false);
      fetchPromoCodes();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err?.message || 'Không thể lưu mã giảm giá');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (promo: PromoCode) => {
    setProcessing(promo.id);
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !promo.is_active })
        .eq('id', promo.id);

      if (error) throw error;
      toast.success(promo.is_active ? 'Đã vô hiệu hóa mã giảm giá' : 'Đã kích hoạt mã giảm giá');
      fetchPromoCodes();
    } catch (err) {
      console.error('Toggle error:', err);
      toast.error('Không thể cập nhật trạng thái');
    } finally {
      setProcessing(null);
      setActionMenuId(null);
    }
  };

  const handleDelete = async (promoId: string) => {
    if (!confirm('Bạn có chắc muốn xóa mã giảm giá này? Hành động này không thể hoàn tác.')) {
      return;
    }

    setProcessing(promoId);
    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', promoId);

      if (error) throw error;
      toast.success('Đã xóa mã giảm giá');
      fetchPromoCodes();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Không thể xóa mã giảm giá');
    } finally {
      setProcessing(null);
      setActionMenuId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Da copy: ${code}`);
  };

  const filteredPromoCodes = promoCodes.filter((promo) => {
    const matchesSearch =
      promo.code.toLowerCase().includes(search.toLowerCase()) ||
      promo.description.toLowerCase().includes(search.toLowerCase());

    if (filterActive === 'all') return matchesSearch;
    if (filterActive === 'active') return matchesSearch && promo.is_active;
    return matchesSearch && !promo.is_active;
  });

  const totalUsages = promoCodes.reduce((sum, p) => sum + p.used_count, 0);
  const activeCount = promoCodes.filter((p) => p.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-primary-500" />
            Quản lý Mã giảm giá
          </h1>
          <p className="text-sm text-gray-500 mt-1">Tạo và quản lý các mã khuyến mãi, coupon</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-primary-500 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 transition shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-5 h-5" />
          Tạo mã mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
              <Tag className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{promoCodes.length}</p>
              <p className="text-sm text-gray-500">Tổng số mã</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{activeCount}</p>
              <p className="text-sm text-gray-500">Đang hoạt động</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{totalUsages}</p>
              <p className="text-sm text-gray-500">Tổng lượt dùng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm mã giảm giá..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã vô hiệu hóa</option>
          </select>
        </div>

        <button
          onClick={fetchPromoCodes}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Promo Codes List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tải dữ liệu...
            </div>
          </div>
        ) : filteredPromoCodes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có mã giảm giá nào</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl font-bold text-sm hover:bg-primary-600 transition"
            >
              Tạo mã đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Giảm giá</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Giới hạn</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sử dụng</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thời hạn</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPromoCodes.map((promo) => {
                  const isExpired = promo.valid_until && new Date(promo.valid_until) < new Date();
                  const usagePercent = promo.usage_limit > 0 ? Math.round((promo.used_count / promo.usage_limit) * 100) : 0;

                  return (
                    <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg text-sm tracking-wide">
                            {promo.code}
                          </span>
                          <button
                            onClick={() => copyCode(promo.code)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600"
                            title="Copy mã"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        {promo.description && (
                          <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">{promo.description}</p>
                        )}
                        {promo.first_booking_only && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                            Booking đầu tiên
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {promo.discount_type === 'percentage' ? (
                            <>
                              <Percent className="w-4 h-4 text-green-600" />
                              <span className="font-bold text-green-600">{promo.discount_value}%</span>
                            </>
                          ) : (
                            <>
                              <Tag className="w-4 h-4 text-blue-600" />
                              <span className="font-bold text-blue-600">{formatCurrency(promo.discount_value)}</span>
                            </>
                          )}
                        </div>
                        {promo.max_discount_amount > 0 && promo.discount_type === 'percentage' && (
                          <p className="text-xs text-gray-500 mt-0.5">Tối đa: {formatCurrency(promo.max_discount_amount)}</p>
                        )}
                        {promo.min_order_amount > 0 && (
                          <p className="text-xs text-gray-500">Đơn tối thiểu: {formatCurrency(promo.min_order_amount)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Users className="w-3.5 h-3.5" />
                            <span>{promo.user_limit > 0 ? `${promo.user_limit}/user` : 'Không giới hạn'}</span>
                          </div>
                          {promo.usage_limit > 0 && (
                            <div className="flex items-center gap-1 text-gray-600 mt-0.5">
                              <BarChart3 className="w-3.5 h-3.5" />
                              <span>{promo.usage_limit} tong</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{promo.used_count}</span>
                          {promo.usage_limit > 0 && (
                            <span className="text-gray-400">/ {promo.usage_limit}</span>
                          )}
                        </div>
                        {promo.usage_limit > 0 && (
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                usagePercent >= 90 ? "bg-red-500" : usagePercent >= 50 ? "bg-amber-500" : "bg-green-500"
                              )}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(promo.valid_from)}</span>
                          </div>
                          {promo.valid_until && (
                            <div className={cn("text-xs mt-0.5", isExpired ? "text-red-500" : "text-gray-500")}>
                               {isExpired ? 'Đã hết hạn' : `Đến ${formatDate(promo.valid_until)}`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 w-fit",
                            promo.is_active && !isExpired
                              ? "bg-green-50 text-green-700 border-green-100"
                              : "bg-gray-50 text-gray-500 border-gray-100"
                          )}
                        >
                          {promo.is_active && !isExpired ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Hoạt động
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                               {isExpired ? 'Hết hạn' : 'Vô hiệu'}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuId(actionMenuId === promo.id ? null : promo.id)}
                            disabled={processing === promo.id}
                            className={cn(
                              'p-2 hover:bg-gray-100 rounded-lg transition',
                              processing === promo.id && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            {processing === promo.id ? (
                              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            ) : (
                              <MoreHorizontal className="w-5 h-5 text-gray-400" />
                            )}
                          </button>

                          {actionMenuId === promo.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-48 z-10">
                              <button
                                onClick={() => openEditModal(promo)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4 text-blue-500" />
                                Chỉnh sửa
                              </button>
                              <button
                                onClick={() => openUsageModal(promo)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4 text-purple-500" />
                                Xem lịch sử dùng
                              </button>
                              <button
                                onClick={() => handleToggleActive(promo)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                {promo.is_active ? (
                                  <>
                                    <XCircle className="w-4 h-4 text-amber-500" />
                                    Vô hiệu hóa
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Kích hoạt
                                  </>
                                )}
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => handleDelete(promo.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Xóa mã
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-gray-900 text-lg">
                {editingPromo ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Code */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Mã giảm giá <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="VD: NEWUSER, SUMMER2024..."
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 uppercase tracking-wide font-bold"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                   placeholder="VD: Giảm 20% cho người dùng mới"
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Loại giảm giá</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VND)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Giá trị giảm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    placeholder={formData.discount_type === 'percentage' ? 'VD: 20' : 'VD: 50000'}
                    className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Min/Max amounts */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Đơn tối thiểu (VND)</label>
                  <input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                    placeholder="0 = Không giới hạn"
                    className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Giảm tối đa (VND)</label>
                  <input
                    type="number"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: Number(e.target.value) })}
                    placeholder="0 = Không giới hạn"
                    className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Chỉ áp dụng cho loại phần trăm</p>
                </div>
              </div>

              {/* Usage limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Giới hạn/người dùng</label>
                  <input
                    type="number"
                    value={formData.user_limit}
                    onChange={(e) => setFormData({ ...formData, user_limit: Number(e.target.value) })}
                    placeholder="1"
                    className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = Không giới hạn</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tổng lượt dùng</label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                    placeholder="0 = Không giới hạn"
                    className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Valid dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Bat dau</label>
                  <input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ket thuc</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">De trong = Khong het han</p>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="font-medium text-gray-700">Kich hoat ngay</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.first_booking_only}
                    onChange={(e) => setFormData({ ...formData, first_booking_only: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="font-medium text-gray-700">Chi danh cho booking dau tien (nguoi dung moi)</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
              >
                Huy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  'flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2',
                  saving
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Dang luu...
                  </>
                ) : editingPromo ? (
                  'Cap nhat'
                ) : (
                  'Tao ma'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage History Modal */}
      {showUsageModal && selectedPromoForUsage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-900">Lich su su dung</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Ma: <span className="font-bold">{selectedPromoForUsage.code}</span>
                </p>
              </div>
              <button
                onClick={() => setShowUsageModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingUsages ? (
                <div className="py-8 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Dang tai...
                </div>
              ) : usages.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Eye className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p>Chua co ai su dung ma nay</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {usages.map((usage) => (
                    <div
                      key={usage.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                          {usage.user?.avatar_url ? (
                            <img
                              src={usage.user.avatar_url}
                              alt={usage.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">
                              ?
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{usage.user?.name || 'Nguoi dung'}</p>
                          <p className="text-xs text-gray-500">{formatRelativeTime(usage.used_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">-{formatCurrency(usage.discount_amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close action menu */}
      {actionMenuId && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActionMenuId(null)}
        />
      )}
    </div>
  );
}
