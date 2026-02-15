'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  MoreHorizontal,
  Eye,
  RefreshCw,
  DollarSign,
  X,
  ExternalLink,
  Filter,
  FileText,
  ImageIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn, formatRelativeTime, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface DisputeRow {
  id: string;
  date_order_id: string;
  user_id: string;
  reason: string;
  description: string;
  evidence_urls: string[];
  status: 'pending' | 'investigating' | 'resolved';
  resolution?: string;
  resolution_amount?: number;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  reporter?: {
    id: string;
    name: string;
    avatar_url: string;
  };
  dateOrder?: {
    id: string;
    combo_price: number;
    platform_fee: number;
    restaurant_name?: string;
  };
}

const REASON_LABELS: Record<string, string> = {
  'no_show': 'Đối phương không đến',
  'bad_behavior': 'Hành vi không phù hợp',
  'wrong_restaurant': 'Nhà hàng không đúng',
  'food_quality': 'Chất lượng món ăn kém',
  'other': 'Khác',
};

const RESOLUTION_LABELS: Record<string, string> = {
  'refund_full': 'Hoàn tiền 100%',
  'refund_partial': 'Hoàn một phần',
  'no_action': 'Không hành động',
};

const STATUS_CONFIG = {
  pending: {
    label: 'Chờ xử lý',
    color: 'bg-amber-50 text-amber-700 border-amber-100',
    icon: Clock,
  },
  investigating: {
    label: 'Đang điều tra',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    icon: Eye,
  },
  resolved: {
    label: 'Đã xử lý',
    color: 'bg-green-50 text-green-700 border-green-100',
    icon: CheckCircle,
  },
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'investigating' | 'resolved'>('all');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Resolution Modal State
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeRow | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<string>('');
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          id,
          date_order_id,
          user_id,
          reason,
          description,
          evidence_urls,
          status,
          resolution,
          resolution_amount,
          resolution_notes,
          resolved_by,
          resolved_at,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching disputes:', error);
        setDisputes([]);
        return;
      }

      if (!data || data.length === 0) {
        setDisputes([]);
        return;
      }

      // Get unique user IDs and date order IDs
      const userIds = [...new Set(data.map((d: any) => d.user_id))];
      const dateOrderIds = [...new Set(data.map((d: any) => d.date_order_id))];

      // Fetch date orders
      const { data: dateOrders } = await supabase
        .from('date_orders')
        .select('id, combo_price, platform_fee, restaurant_id')
        .in('id', dateOrderIds);

      const dateOrdersMap = new Map((dateOrders || []).map((o: any) => [o.id, o]));

      // Fetch restaurant names
      const restaurantIds = [...new Set((dateOrders || []).map((o: any) => o.restaurant_id).filter(Boolean))];
      const { data: restaurants } = restaurantIds.length > 0
        ? await supabase.from('restaurants').select('id, name').in('id', restaurantIds)
        : { data: [] };
      const restaurantsMap = new Map((restaurants || []).map((r: any) => [r.id, r.name]));

      // Fetch users
      const { data: users } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .in('id', userIds);

      const usersMap = new Map((users || []).map((u: any) => [u.id, u]));

      // Enrich disputes
      const enrichedDisputes = data.map((dispute: any) => {
        const dateOrder = dateOrdersMap.get(dispute.date_order_id);
        return {
          ...dispute,
          reporter: usersMap.get(dispute.user_id),
          dateOrder: dateOrder ? {
            id: dateOrder.id,
            combo_price: dateOrder.combo_price,
            platform_fee: dateOrder.platform_fee,
            restaurant_name: restaurantsMap.get(dateOrder.restaurant_id) || undefined,
          } : null,
        };
      });

      setDisputes(enrichedDisputes);
    } catch (err) {
      console.error('Error:', err);
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (disputeId: string, newStatus: 'investigating') => {
    setProcessing(disputeId);

    try {
      const { error } = await supabase
        .from('disputes')
        .update({ status: newStatus })
        .eq('id', disputeId);

      if (error) {
        toast.error('Không thể cập nhật trạng thái');
        console.error(error);
      } else {
        toast.success(`Đã đánh dấu là "${STATUS_CONFIG[newStatus].label}"`);
        await fetchDisputes();
      }
    } catch (err) {
      toast.error('Lỗi xử lý');
    } finally {
      setProcessing(null);
      setActionMenuId(null);
    }
  };

  const openResolutionModal = (dispute: DisputeRow) => {
    setSelectedDispute(dispute);
    setSelectedResolution('');
    setPartialAmount(0);
    setResolutionNotes('');
    setResolutionModalOpen(true);
    setActionMenuId(null);
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute || !selectedResolution) {
      toast.error('Vui lòng chọn phương án xử lý');
      return;
    }

    if (selectedResolution === 'refund_partial' && partialAmount <= 0) {
      toast.error('Vui lòng nhập số tiền hoàn');
      return;
    }

    setProcessing(selectedDispute.id);

    try {
      const { data, error } = await supabase.functions.invoke('resolve-dispute', {
        body: {
          disputeId: selectedDispute.id,
          resolution: selectedResolution,
          resolutionAmount: selectedResolution === 'refund_partial' ? partialAmount : undefined,
          resolutionNotes: resolutionNotes || undefined,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Đã xử lý khiếu nại thành công');
      setResolutionModalOpen(false);
      await fetchDisputes();
    } catch (err: any) {
      console.error('Resolve error:', err);
      toast.error(err?.message || 'Không thể xử lý khiếu nại');
    } finally {
      setProcessing(null);
    }
  };

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute.reporter?.name?.toLowerCase().includes(search.toLowerCase()) ||
      dispute.description?.toLowerCase().includes(search.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && dispute.status === filterStatus;
  });

  const pendingCount = disputes.filter((d) => d.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Khiếu nại</h1>
          <p className="text-sm text-gray-500 mt-1">Xem xét và xử lý các khiếu nại từ người dùng</p>
        </div>
        {pendingCount > 0 && (
          <span className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-100">
            {pendingCount} khiếu nại chờ xử lý
          </span>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên người dùng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="investigating">Đang điều tra</option>
            <option value="resolved">Đã xử lý</option>
          </select>
        </div>

        <button
          onClick={fetchDisputes}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Disputes List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tải dữ liệu...
            </div>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không tìm thấy khiếu nại nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredDisputes.map((dispute) => {
              const statusConfig = STATUS_CONFIG[dispute.status];
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedId === dispute.id;

              return (
                <div key={dispute.id} className="hover:bg-gray-50 transition-colors">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Reporter */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                              {dispute.reporter?.avatar_url ? (
                                <Image
                                  src={dispute.reporter.avatar_url}
                                  alt={dispute.reporter.name || 'User'}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                                  ?
                                </div>
                              )}
                            </div>
                            <Link
                              href={`/user/${dispute.user_id}`}
                              target="_blank"
                              className="font-medium text-gray-900 text-sm hover:text-primary-600 flex items-center gap-1"
                            >
                              {dispute.reporter?.name || 'Người dùng'}
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>

                          <span className="text-gray-400 text-sm">khiếu nại đơn hẹn</span>
                        </div>

                        {/* Reason & Status */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100">
                            {REASON_LABELS[dispute.reason] || dispute.reason}
                          </span>
                          <span className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1', statusConfig.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                          {dispute.resolution && (
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-100">
                              {RESOLUTION_LABELS[dispute.resolution] || dispute.resolution}
                            </span>
                          )}
                        </div>

                        {/* Date Order Info */}
                        {dispute.dateOrder && (
                          <div className="flex items-center gap-4 mb-2 text-xs text-gray-500">
                            {dispute.dateOrder.restaurant_name && (
                              <span>Nhà hàng: <b>{dispute.dateOrder.restaurant_name}</b></span>
                            )}
                            <span>Combo: <b>{formatCurrency(dispute.dateOrder.combo_price)}</b></span>
                          </div>
                        )}

                        {/* Description Preview */}
                        <p className="text-sm text-gray-600 leading-relaxed mb-2 line-clamp-2">
                          {dispute.description}
                        </p>

                        {/* Time */}
                        <p className="text-xs text-gray-400">
                          {formatRelativeTime(dispute.created_at)}
                        </p>

                        {/* Expand Button */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : dispute.id)}
                          className="mt-2 text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                               Thu gọn
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                               Xem chi tiết
                            </>
                          )}
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuId(actionMenuId === dispute.id ? null : dispute.id)}
                          disabled={processing === dispute.id}
                          className={cn(
                            'p-2 hover:bg-gray-100 rounded-lg transition',
                            processing === dispute.id && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          {processing === dispute.id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                          ) : (
                            <MoreHorizontal className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {actionMenuId === dispute.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-52 z-10">
                            {dispute.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(dispute.id, 'investigating')}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4 text-blue-500" />
                                Đánh dấu đang điều tra
                              </button>
                            )}

                            {dispute.status !== 'resolved' && (
                              <button
                                onClick={() => openResolutionModal(dispute)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Xử lý khiếu nại
                              </button>
                            )}

                            <button
                              onClick={() => setActionMenuId(null)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Đóng
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-100 pt-4 bg-gray-50">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Description */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Mô tả chi tiết
                          </h4>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border">
                            {dispute.description}
                          </p>
                        </div>

                        {/* Evidence */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            Bằng chứng ({dispute.evidence_urls?.length || 0})
                          </h4>
                          {dispute.evidence_urls && dispute.evidence_urls.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2">
                              {dispute.evidence_urls.map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 hover:opacity-80 transition"
                                >
                                  <Image src={url} alt={`Evidence ${idx + 1}`} fill className="object-cover" />
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">Không có bằng chứng</p>
                          )}
                        </div>
                      </div>

                      {/* Resolution Notes */}
                      {dispute.resolution_notes && (
                        <div className="mt-4">
                          <h4 className="text-sm font-bold text-gray-700 mb-2">Ghi chú xử lý</h4>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border">
                            {dispute.resolution_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {resolutionModalOpen && selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Xử lý khiếu nại</h3>
                <p className="text-xs text-gray-500">
                  {selectedDispute.dateOrder?.restaurant_name || `Don hen #${selectedDispute.date_order_id.slice(0, 8)}`}
                </p>
              </div>
              <button
                onClick={() => setResolutionModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Date Order Summary */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Giá combo:</span>
                    <p className="font-bold text-gray-900">
                      {formatCurrency(selectedDispute.dateOrder?.combo_price || 0)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phí nền tảng:</span>
                    <p className="font-bold text-gray-900">
                      {formatCurrency(selectedDispute.dateOrder?.platform_fee || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resolution Options */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phương án xử lý <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'refund_full', label: 'Hoàn tiền 100% cho User', desc: 'Hoàn lại toàn bộ phí' },
                    { value: 'refund_partial', label: 'Hoàn một phần cho User', desc: 'Chỉ hoàn một phần phí' },
                    { value: 'no_action', label: 'Không hành động', desc: 'Đóng khiếu nại, không hoàn tiền' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition',
                        selectedResolution === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <input
                        type="radio"
                        name="resolution"
                        value={option.value}
                        checked={selectedResolution === option.value}
                        onChange={(e) => setSelectedResolution(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{option.label}</p>
                        <p className="text-xs text-gray-500">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Partial Amount Input */}
              {selectedResolution === 'refund_partial' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Số tiền hoàn cho User <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(Number(e.target.value))}
                      placeholder="Nhập số tiền"
                      max={(selectedDispute.dateOrder?.combo_price || 0) + (selectedDispute.dateOrder?.platform_fee || 0)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tối đa: {formatCurrency((selectedDispute.dateOrder?.combo_price || 0) + (selectedDispute.dateOrder?.platform_fee || 0))}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Ghi chú xử lý
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Ghi chú nội bộ về quyết định xử lý..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setResolutionModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleResolveDispute}
                  disabled={processing === selectedDispute.id || !selectedResolution}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2',
                    processing === selectedDispute.id || !selectedResolution
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  )}
                >
                  {processing === selectedDispute.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Xác nhận xử lý'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
