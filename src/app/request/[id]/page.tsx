'use client';

import { useState } from 'react';
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
  Check,
  X,
  Trash2,
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
    getApplicationsForRequest,
    getMyApplications,
    acceptApplication,
    rejectApplication,
    deleteRequest,
  } = useDateStore();

  const request = dateRequests.find((r) => r.id === requestId);
  const applications = getApplicationsForRequest(requestId);
  const myApplications = getMyApplications();
  const hasApplied = myApplications.some((a) => a.requestId === requestId);
  const isOwner = request?.userId === currentUser.id;

  const handleApply = () => {
    if (!applyMessage.trim()) return;
    applyToRequest(requestId, applyMessage.trim());
    setApplyMessage('');
    setShowApplyForm(false);
  };

  const handleDelete = () => {
    if (confirm('Bạn có chắc muốn xóa lời mời này?')) {
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Chi tiết lời mời</h1>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/user/${request.user.id}`}
                  className="text-lg font-semibold text-gray-900 hover:underline"
                >
                  {request.user.name}
                </Link>
                {request.user.vipStatus.tier !== 'free' && (
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs font-medium text-white rounded-full uppercase',
                      getVIPBadgeColor(request.user.vipStatus.tier)
                    )}
                  >
                    {request.user.vipStatus.tier}
                  </span>
                )}
              </div>
              <p className="text-gray-500">{request.user.location}</p>
            </div>
            <div
              className={cn(
                'px-4 py-2 rounded-full text-white font-medium flex items-center gap-2',
                getActivityColor(request.activity)
              )}
            >
              <span>{getActivityIcon(request.activity)}</span>
              <span>{getActivityLabel(request.activity)}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {request.title}
          </h2>
          <p className="text-gray-600 mb-6">{request.description}</p>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Calendar className="w-6 h-6 text-primary-500" />
              <div>
                <p className="text-sm text-gray-500">Ngày</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(request.date)}
                </p>
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
              <p className="text-xl font-bold text-green-600">
                {request.hiringAmount > 0
                  ? formatCurrency(request.hiringAmount)
                  : 'Miễn phí'}
              </p>
            </div>
          </div>
        </div>

        {/* Apply Section */}
        {!isOwner && !hasApplied && (
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
                    Gửi ứng tuyển
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowApplyForm(true)}
                className="w-full py-3 bg-gradient-primary text-white rounded-xl font-semibold hover:opacity-90 transition shadow-primary"
              >
                Ứng tuyển ngay
              </button>
            )}
          </div>
        )}

        {hasApplied && (
          <div className="p-6 border-t border-gray-100 bg-green-50">
            <p className="text-center text-green-600 font-medium">
              Bạn đã ứng tuyển lời mời này
            </p>
          </div>
        )}
      </div>

      {/* Applicants (for owner) */}
      {isOwner && applications.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Người ứng tuyển ({applications.length})
          </h3>
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
              >
                <Link href={`/user/${app.user.id}`}>
                  <Image
                    src={app.user.avatar}
                    alt={app.user.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/user/${app.user.id}`}
                    className="font-semibold text-gray-900 hover:underline"
                  >
                    {app.user.name}
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">"{app.message}"</p>
                </div>
                {app.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => rejectApplication(app.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => acceptApplication(app.id)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium',
                      app.status === 'accepted'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    )}
                  >
                    {app.status === 'accepted' ? 'Đã chấp nhận' : 'Đã từ chối'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Applicants Preview */}
      {!isOwner && request.applicants.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Đã có {request.applicants.length} người ứng tuyển
          </h3>
          <div className="flex -space-x-3">
            {request.applicants.slice(0, 5).map((applicant) => (
              <Image
                key={applicant.id}
                src={applicant.avatar}
                alt={applicant.name}
                width={40}
                height={40}
                className="rounded-full border-2 border-white"
              />
            ))}
            {request.applicants.length > 5 && (
              <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-sm font-medium text-gray-600">
                +{request.applicants.length - 5}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
