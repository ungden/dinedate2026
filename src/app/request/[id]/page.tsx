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
  Wallet,
  Send,
  Trash2,
  CheckCircle,
  Briefcase,
  Loader2,
  User as UserIcon,
  MessageCircle,
  XCircle,
  Check
} from 'lucide-react';
import { useDbRequestDetail } from '@/hooks/useDbDateRequests';
import { useDbApplications } from '@/hooks/useDbApplications';
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  const { user } = useAuth();

  const [applyMessage, setApplyMessage] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // DB Data
  const { request, loading: reqLoading } = useDbRequestDetail(requestId);
  const { applications, loading: appLoading, acceptApplication, rejectApplication } = useDbApplications(requestId);

  // Check if current user applied
  useEffect(() => {
    if (!user || !requestId) return;
    const checkApplied = async () => {
      const { data } = await supabase
        .from('applications')
        .select('id')
        .eq('request_id', requestId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setHasApplied(true);
    };
    checkApplied();
  }, [user, requestId]);

  const handleApply = async () => {
    if (!applyMessage.trim()) return;
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      router.push('/login');
      return;
    }

    setIsApplying(true);
    try {
      const { error } = await supabase.from('applications').insert({
        request_id: requestId,
        user_id: user.id,
        message: applyMessage.trim(),
        status: 'pending'
      });

      if (error) throw error;

      toast.success('Đã gửi ứng tuyển thành công! 🎉');
      setHasApplied(true);
      setShowApplyForm(false);
    } catch (err: any) {
      toast.error('Lỗi khi ứng tuyển: ' + err.message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa lời mời này?')) return;
    
    const { error } = await supabase.from('date_requests').delete().eq('id', requestId);
    if (!error) {
      toast.success('Đã xóa lời mời');
      router.push('/discover');
    } else {
      toast.error('Không thể xóa');
    }
  };

  const handleAcceptApplicant = async (appId: string, applicantId: string) => {
    if (!user) return;
    try {
      const conversationId = await acceptApplication(appId, applicantId, user.id);
      toast.success('Đã chấp nhận! Đang mở chat...');
      if (conversationId) {
        router.push(`/chat/${conversationId}`);
      }
    } catch (error: any) {
      toast.error('Có lỗi xảy ra: ' + error.message);
    }
  };

  if (reqLoading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Không tìm thấy lời mời
        </h3>
        <Link href="/discover" className="text-primary-600 hover:underline">
          Quay lại danh sách Khám phá
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === request.userId;
  const isPartner = !!user?.isServiceProvider;
  const isExpired = request.status === 'expired';
  const isMatched = request.status === 'matched';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
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
            Lời mời đã hết hạn.
          </div>
        )}
        {isMatched && (
          <div className="p-4 bg-green-50 border-b border-green-100 text-green-700 text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Đã match! Chủ lời mời đã chọn người đồng hành.
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-black text-gray-900 mb-3">{request.title}</h2>
          <p className="text-gray-600 mb-6 whitespace-pre-wrap">{request.description}</p>

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
            <div className="col-span-2 flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <MapPin className="w-6 h-6 text-primary-500" />
              <div>
                <p className="text-sm text-gray-500">Địa điểm</p>
                <p className="font-semibold text-gray-900">{request.location}</p>
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

        {/* --- OWNER VIEW: APPLICANTS LIST --- */}
        {isOwner && (
          <div className="border-t border-gray-100 bg-gray-50 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-gray-600" />
              Danh sách ứng tuyển ({applications.length})
            </h3>

            {appLoading ? (
              <div className="py-4 text-center text-gray-500">Đang tải ứng viên...</div>
            ) : applications.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Chưa có ai ứng tuyển.</p>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-start gap-4">
                      <Link href={`/user/${app.user.id}`}>
                        <Image
                          src={app.user.avatar}
                          alt={app.user.name}
                          width={56}
                          height={56}
                          className="rounded-full object-cover"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <Link href={`/user/${app.user.id}`} className="font-bold text-gray-900 hover:text-primary-600">
                            {app.user.name}
                          </Link>
                          {app.status === 'pending' && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">Chờ duyệt</span>
                          )}
                          {app.status === 'accepted' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Đã chọn</span>
                          )}
                          {app.status === 'rejected' && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">Đã từ chối</span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded-lg italic">
                          &quot;{app.message}&quot;
                        </p>

                        {app.status === 'pending' && !isMatched && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleAcceptApplicant(app.id, app.user.id)}
                              className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition flex items-center justify-center gap-1"
                            >
                              <Check className="w-4 h-4" /> Chấp nhận
                            </button>
                            <button
                              onClick={() => rejectApplication(app.id)}
                              className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition flex items-center justify-center gap-1"
                            >
                              <XCircle className="w-4 h-4" /> Từ chối
                            </button>
                          </div>
                        )}

                        {app.status === 'accepted' && (
                          <div className="mt-3">
                            <button className="w-full py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                              <MessageCircle className="w-4 h-4" />
                              Nhắn tin ngay
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- APPLICANT VIEW: APPLY FORM --- */}
        {!isOwner && !hasApplied && request.status === 'active' && (
          <div className="p-6 border-t border-gray-100">
            {!isPartner ? (
              <div className="bg-rose-50 rounded-2xl p-6 text-center border border-rose-100">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Briefcase className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Trở thành Partner để ứng tuyển</h3>
                <p className="text-sm text-gray-600 mb-4 max-w-sm mx-auto">
                  Bạn cần đăng ký làm người cung cấp dịch vụ (Partner) để có thể gửi yêu cầu tham gia các lời mời hấp dẫn này.
                </p>
                <Link href="/become-partner/terms">
                  <button className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-bold shadow-primary hover:opacity-95 transition w-full sm:w-auto">
                    Đăng ký Partner ngay
                  </button>
                </Link>
              </div>
            ) : showApplyForm ? (
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
                    disabled={!applyMessage.trim() || isApplying}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2',
                      applyMessage.trim() && !isApplying
                        ? 'bg-gradient-primary text-white hover:opacity-90'
                        : 'bg-gray-200 text-gray-400'
                    )}
                  >
                    {isApplying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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
            <p className="text-center text-green-600 font-medium flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Bạn đã ứng tuyển lời mời này
            </p>
          </div>
        )}
      </div>
    </div>
  );
}