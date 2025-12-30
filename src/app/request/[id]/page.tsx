'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Wallet,
  Send,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import {
  formatCurrency,
  formatDate,
  getActivityIcon,
  getActivityLabel,
  getActivityColor,
  getVIPBadgeColor,
  cn,
} from '@/lib/utils';
import RequestCountdown from '@/components/RequestCountdown';

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [applyMessage, setApplyMessage] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);

  const {
    dateRequests,
    currentUser,
    applyToRequest,
    getMyApplications,
    deleteRequest,
    expireRequestsIfNeeded,
  } = useDateStore();

  const request = dateRequests.find((r) => r.id === requestId);
  const myApplications = getMyApplications();
  const hasApplied = myApplications.some((a) => a.requestId === requestId);
  const isOwner = request?.userId === currentUser.id;

  useEffect(() => {
    expireRequestsIfNeeded();
  }, [expireRequestsIfNeeded]);

  const handleApply = () => {
    if (!applyMessage.trim()) return;
    applyToRequest(requestId, applyMessage.trim());
    setApplyMessage('');
    setShowApplyForm(false);
  };

  const handleDelete = () => {
    if (confirm('Bạn có chắc muốn huỷ/xóa lời mời này?')) {
      deleteRequest(requestId);
      router.push('/');
    }
  };

  if (!request) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Không tìm thấy lời mời
        </h3>
        <Link href="/" className="text-primary-600 hover:underline">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const isExpired = request.status === 'expired';
  const isMatched = request.status === 'matched';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="space-y-1">
            <h1 className="text-xl font-black text-gray-900">Chi tiết lời mời</h1>
            <div className="flex flex-wrap items-center gap-2">
              <RequestCountdown expiresAt={request.expiresAt} status={request.status} />
            </div>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            aria-label="Xóa lời mời"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Request Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* User Info */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <Link href={`/user/${request.user.id}`}>
              <Image
                src={request.user.avatar}
                alt={request.user.name}
                width={64}
                height={64}
                className="rounded-full object-cover"
              />
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/user/${request.user.id}`}
                  className="text-lg font-semibold text-gray-900 hover:underline truncate"
                >
                  {request.user.name}
                </Link>
                {request.user.vipStatus.tier !== 'free' && (
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs font-medium text-white rounded-full uppercase flex-shrink-0',
                      getVIPBadgeColor(request.user.vipStatus.tier)
                    )}
                  >
                    {request.user.vipStatus.tier}
                  </span>
                )}
              </div>
              <p className="text-gray-500 truncate">{request.user.location}</p>
            </div>

            <div
              className={cn(
                'px-4 py-2 rounded-full text-white font-medium flex items-center gap-2 flex-shrink-0',
                getActivityColor(request.activity)
              )}
            >
              <span>{getActivityIcon(request.activity)}</span>
              <span className="hidden sm:inline">{getActivityLabel(request.activity)}</span>
            </div>
          </div>
        </div>

        {/* Status banners */}
        {isExpired && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-red-700 text-sm font-medium">
            Lời mời đã hết hạn sau 15 phút. Bạn có thể tạo lời mời mới.
          </div>
        )}
        {isMatched && (
          <div className="p-4 bg-green-50 border-b border-green-100 text-green-700 text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Đã match! Bạn có thể vào Tin nhắn để trò chuyện.
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-black text-gray-900 mb-3">{request.title}</h2>
          <p className="text-gray-600 mb-6">{request.description}</p>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Calendar className="w-6 h-6 text-primary-500" />
              <div>
                <p className="text-sm text-gray-500">Ngày</p>
                <p className="font-semibold text-gray-900">{formatDate(request.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Clock className="w-6 h-6 text-primary-500" />
              <div>
                <p className="text-sm text-gray-500">Giờ</p>
                <p className="font-semibold text-gray-900">{request.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <MapPin className="w-6 h-6 text-primary-500" />
              <div>
                <p className="text-sm text-gray-500">Địa điểm</p>
                <p className="font-semibold text-gray-900">{request.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Users className="w-6 h-6 text-primary-500" />
              <div>
                <p className="text-sm text-gray-500">Số người</p>
                <p className="font-semibold text-gray-900">
                  {request.currentParticipants}/{request.maxParticipants}
                </p>
              </div>
            </div>
          </div>

          {/* Hiring Amount */}
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
            <Wallet className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm text-green-600">Mức chi trả</p>
              <p className="text-xl font-black text-green-600">
                {request.hiringAmount > 0 ? formatCurrency(request.hiringAmount) : 'Miễn phí'}
              </p>
            </div>
          </div>
        </div>

        {/* Apply Section - for non-owner */}
        {!isOwner && !hasApplied && request.status === 'active' && (
          <div className="p-6 border-t border-gray-100">
            {showApplyForm ? (
              <div className="space-y-4">
                <textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="Viết lời giới thiệu của bạn..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowApplyForm(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={!applyMessage.trim()}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2',
                      applyMessage.trim()
                        ? 'bg-gradient-primary text-white hover:opacity-90'
                        : 'bg-gray-200 text-gray-400'
                    )}
                  >
                    <Send className="w-5 h-5" />
                    Ứng tuyển
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowApplyForm(true)}
                className="w-full py-3 bg-gradient-primary text-white rounded-xl font-semibold hover:opacity-90 transition shadow-primary"
              >
                Tôi muốn đi cùng
              </button>
            )}
          </div>
        )}

        {!isOwner && hasApplied && (
          <div className="p-6 border-t border-gray-100 bg-green-50">
            <p className="text-center text-green-600 font-medium">
              Bạn đã ứng tuyển lời mời này
            </p>
          </div>
        )}
      </div>
    </div>
  );
}