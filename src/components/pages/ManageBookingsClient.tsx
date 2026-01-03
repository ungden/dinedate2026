'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, MapPin, Check, X } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useDbBookings } from '@/hooks/useDbBookings';

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

  const bookings = activeTab === 'sent' ? sent : received;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      completed: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-purple-100 text-purple-700',
      paid: 'bg-green-100 text-green-700',
    };
    const labels: Record<string, string> = {
      pending: 'Chờ xác nhận',
      accepted: 'Đã chấp nhận',
      rejected: 'Đã từ chối',
      completed: 'Hoàn thành',
      in_progress: 'Đang diễn ra',
      paid: 'Đã thanh toán',
    };
    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', styles[status] || 'bg-gray-100 text-gray-700')}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
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
            'flex-1 py-2 px-4 rounded-lg font-medium transition',
            activeTab === 'sent'
              ? 'bg-white text-primary-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Đã gửi ({sent.length})
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={cn(
            'flex-1 py-2 px-4 rounded-lg font-medium transition',
            activeTab === 'received'
              ? 'bg-white text-primary-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Đã nhận ({received.length})
        </button>
      </div>

      {/* Booking List */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Đang tải booking...</div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((b) => {
            const startIso = b.start_time as string | undefined;

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-900 truncate">
                          {b.activity || 'Booking'}
                        </div>
                        {getStatusBadge(b.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{startIso ? formatDateFromIso(startIso) : '-'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{startIso ? formatTimeFromIso(startIso) : '-'}</span>
                        </div>
                        <div className="flex items-center gap-1 col-span-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{b.meeting_location || '-'}</span>
                        </div>
                      </div>

                      {b.duration_hours ? (
                        <p className="text-sm text-gray-600 mt-2">
                          Thời lượng: <span className="font-semibold">{b.duration_hours} giờ</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                  <p className="font-semibold text-green-600">
                    {formatCurrency(Number(b.total_amount || 0))}
                  </p>

                  {activeTab === 'received' && b.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => reject(b.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition"
                      >
                        <X className="w-4 h-4" />
                        Từ chối
                      </button>
                      <button
                        onClick={() => accept(b.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-600 rounded-lg font-medium hover:bg-green-200 transition"
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
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Chưa có booking nào
          </h3>
          <p className="text-gray-500">
            {activeTab === 'sent'
              ? 'Bạn chưa gửi booking nào'
              : 'Bạn chưa nhận booking nào'}
          </p>
        </div>
      )}
    </div>
  );
}