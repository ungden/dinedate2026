'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, MapPin, Check, X, Loader2 } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useDbBookings } from '@/hooks/useDbBookings';
import toast from 'react-hot-toast';

type TabType = 'sent' | 'received';

function formatTimeFromIso(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDateFromIso(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN');
}

export default function ManageBookingsClient() {
  const [activeTab, setActiveTab] = useState<TabType>('sent');
  const { sent, received, loading, accept, reject } = useDbBookings();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const bookings = activeTab === 'sent' ? sent : received;

  const handleCancel = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn hủy yêu cầu này? Tiền sẽ được hoàn về ví ngay lập tức.')) return;
    setProcessingId(id);
    try {
      await reject(id); // Reuse logic reject của Edge Function (User reject = Cancel)
      toast.success('Đã hủy và hoàn tiền thành công');
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePartnerAction = async (id: string, action: 'accept' | 'reject') => {
    setProcessingId(id);
    try {
      if (action === 'accept') {
        await accept(id);
        toast.success('Đã chấp nhận booking!');
      } else {
        await reject(id);
        toast.success('Đã từ chối booking');
      }
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      accepted: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-600',
      completed: 'bg-green-100 text-green-700',
      completed_pending: 'bg-green-50 text-green-600 border border-green-200',
      in_progress: 'bg-purple-100 text-purple-700',
      paid: 'bg-green-100 text-green-700',
    };
    const labels: Record<string, string> = {
      pending: 'Chờ xác nhận',
      accepted: 'Đã chấp nhận',
      rejected: 'Đã từ chối',
      cancelled: 'Đã hủy',
      completed: 'Hoàn thành',
      completed_pending: 'Chờ thanh toán',
      in_progress: 'Đang diễn ra',
      paid: 'Đã thanh toán',
    };
    return (
      <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold uppercase', styles[status] || 'bg-gray-100 text-gray-700')}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/profile"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Booking</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('sent')}
          className={cn(
            'flex-1 py-2 px-4 rounded-lg font-bold text-sm transition',
            activeTab === 'sent'
              ? 'bg-white text-primary-600 shadow'
              : 'text-gray-500 hover:text-gray-900'
          )}
        >
          Đã gửi ({sent.length})
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={cn(
            'flex-1 py-2 px-4 rounded-lg font-bold text-sm transition',
            activeTab === 'received'
              ? 'bg-white text-primary-600 shadow'
              : 'text-gray-500 hover:text-gray-900'
          )}
        >
          Đã nhận ({received.length})
        </button>
      </div>

      {/* Booking List */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
          <p className="text-gray-500 mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((b) => {
            const startIso = b.start_time as string | undefined;
            const isProcessing = processingId === b.id;

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
              >
                <div className="p-4 border-b border-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-black text-gray-900 truncate pr-2 text-lg">
                      {b.activity ? b.activity.charAt(0).toUpperCase() + b.activity.slice(1) : 'Booking'}
                    </div>
                    {getStatusBadge(b.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary-500" />
                      <span className="font-medium">{startIso ? formatDateFromIso(startIso) : '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary-500" />
                      <span className="font-medium">{startIso ? formatTimeFromIso(startIso) : '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span className="truncate">{b.meeting_location || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Tổng tiền</p>
                    <p className="font-black text-lg text-green-600">
                        {formatCurrency(Number(b.total_amount || 0))}
                    </p>
                  </div>

                  {/* USER: Cancel button if pending */}
                  {activeTab === 'sent' && b.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition shadow-sm flex items-center gap-2"
                    >
                      {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                      Hủy yêu cầu
                    </button>
                  )}

                  {/* PARTNER: Accept/Reject buttons if pending */}
                  {activeTab === 'received' && b.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePartnerAction(b.id, 'reject')}
                        disabled={isProcessing}
                        className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition shadow-sm"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        <span className="hidden sm:inline">Từ chối</span>
                      </button>
                      <button
                        onClick={() => handlePartnerAction(b.id, 'accept')}
                        disabled={isProcessing}
                        className="flex items-center gap-1 px-4 py-2 bg-gradient-primary text-white rounded-xl font-bold text-sm shadow-primary hover:opacity-90 transition"
                      >
                        <Check className="w-4 h-4" />
                        Chấp nhận
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Chưa có booking nào
          </h3>
          <p className="text-gray-500 text-sm">
            {activeTab === 'sent'
              ? 'Bạn chưa gửi yêu cầu booking nào.'
              : 'Bạn chưa nhận được yêu cầu nào.'}
          </p>
        </div>
      )}
    </div>
  );
}