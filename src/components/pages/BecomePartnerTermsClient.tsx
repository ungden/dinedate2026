'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, ShieldAlert, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import PartnerTermsContent, { PARTNER_TERMS_VERSION } from '../partner/PartnerTermsContent';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const SCROLL_UNLOCK_OFFSET_PX = 120;

export default function BecomePartnerTermsClient() {
  const router = useRouter();
  const { user, updateUser, isLoading } = useAuth();

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [agreeMain, setAgreeMain] = useState(false);
  const [agreeNoSensitive, setAgreeNoSensitive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isReady = useMemo(() => {
    return hasReachedBottom && agreeMain && agreeNoSensitive && !!user?.id;
  }, [hasReachedBottom, agreeMain, agreeNoSensitive, user?.id]);

  // Auto redirect if already agreed
  useEffect(() => {
    if (!isLoading && user?.partner_agreed_at) {
      router.replace('/become-partner');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (remaining <= SCROLL_UNLOCK_OFFSET_PX) {
        setHasReachedBottom(true);
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => el.removeEventListener('scroll', onScroll as any);
  }, []);

  const handleAgree = async () => {
    if (!user?.id) return;
    if (!isReady) return;

    setIsSaving(true);

    try {
      const payload = {
        user_id: user.id,
        version: PARTNER_TERMS_VERSION,
        agreed_at: new Date().toISOString(),
        ip: null as string | null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      };

      // 1. Lưu log vào bảng partner_agreements
      const { error: insertError } = await supabase.from('partner_agreements').insert(payload as any);
      
      if (insertError) {
        console.error('Lỗi insert agreement:', insertError);
        throw new Error(insertError.message || 'Không thể lưu xác nhận điều khoản');
      }

      // 2. Cập nhật user profile để client biết đã đồng ý
      await updateUser({
        partner_agreed_at: payload.agreed_at as any,
        partner_agreed_version: PARTNER_TERMS_VERSION as any,
      } as any);

      toast.success('Xác nhận thành công!');
      
      // Chuyển hướng
      router.push('/become-partner');
      
    } catch (error: any) {
      console.error('Lỗi khi đồng ý điều khoản:', error);
      toast.error('Có lỗi xảy ra: ' + (error.message || 'Vui lòng thử lại sau'));
      setIsSaving(false); // Reset trạng thái để user có thể thử lại
    }
  };

  if (isLoading || user?.partner_agreed_at) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Điều khoản Partner</h1>
          <p className="text-sm text-gray-500">Đọc kỹ trước khi kích hoạt Partner</p>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl border border-gray-200 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-700" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">Vui lòng cuộn xuống và đọc điều khoản</p>
              <p className="text-sm text-gray-600 mt-1">
                Nút xác nhận sẽ chỉ mở khi bạn đã cuộn gần hết nội dung.
              </p>
            </div>
            <div
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-black',
                hasReachedBottom ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
              )}
            >
              {hasReachedBottom ? 'Đã đọc' : 'Chưa đọc'}
            </div>
          </div>
        </div>

        {/* Scrollable terms */}
        <div ref={scrollRef} className="max-h-[55vh] overflow-y-auto p-4 sm:p-6">
          <PartnerTermsContent />
        </div>

        {/* Confirm */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-white space-y-4">
          {!hasReachedBottom && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-2xl border border-amber-200 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-amber-900">Bạn cần cuộn xuống cuối để tiếp tục</p>
                <p className="text-sm text-amber-800 mt-1">
                  Điều này giúp đảm bảo bạn đã xem qua các nội dung quan trọng như phí nền tảng 30% và cấm dịch vụ nhạy cảm.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeMain}
                onChange={(e) => setAgreeMain(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary-600 rounded"
                disabled={!hasReachedBottom}
              />
              <span className="text-sm text-gray-700">
                Tôi đã đọc và đồng ý với <span className="font-bold">toàn bộ Điều khoản Partner</span> (bao gồm cơ chế phí nền
                tảng <span className="font-bold">30%</span>).
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeNoSensitive}
                onChange={(e) => setAgreeNoSensitive(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary-600 rounded"
                disabled={!hasReachedBottom}
              />
              <span className="text-sm text-gray-700">
                Tôi cam kết <span className="font-bold text-rose-600">tuyệt đối không</span> cung cấp dịch vụ nhạy cảm/phi
                pháp; tôi hiểu vi phạm có thể bị khóa vĩnh viễn.
              </span>
            </label>
          </div>

          <button
            onClick={handleAgree}
            disabled={!isReady || isSaving}
            className={cn(
              'w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition shadow-primary',
              isReady && !isSaving ? 'bg-gradient-primary text-white hover:opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Tôi đồng ý & Tiếp tục
              </>
            )}
          </button>

          <p className="text-xs text-gray-400">
            Bằng cách tiếp tục, bạn đồng ý để DineDate lưu log xác nhận cho mục đích vận hành và xử lý khiếu nại/tranh chấp (nếu có).
          </p>
        </div>
      </div>
    </div>
  );
}