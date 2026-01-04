'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Loader2,
  Clock,
  QrCode,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  getPaymentConfig,
  generateVietQRUrl,
  getBankDisplayName,
  checkTopupStatus,
  cancelTopupRequest,
  PaymentConfig,
} from '@/lib/payment';
import { formatCurrency, cn } from '@/lib/utils';
import { QRCodeCanvas } from 'qrcode.react';

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  requestId?: string; // resume
  transferCode?: string; // resume
  onSuccess?: () => void;
}

const POLL_INTERVAL = 3000;

function toNiceMessage(err: unknown, fallback = 'Đã xảy ra lỗi') {
  if (err instanceof Error) return err.message;
  const anyErr = err as any;
  return String(anyErr?.message || anyErr?.context?.body?.message || fallback);
}

export default function TopupModal({
  isOpen,
  onClose,
  amount,
  requestId,
  transferCode,
  onSuccess,
}: TopupModalProps) {
  const [config, setConfig] = useState<PaymentConfig | null>(null);

  const [isBooting, setIsBooting] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [localRequestId, setLocalRequestId] = useState<string | null>(requestId || null);
  const [localCode, setLocalCode] = useState<string | null>(transferCode || null);

  const [paymentStatus, setPaymentStatus] = useState<
    'pending' | 'confirmed' | 'cancelled' | 'expired' | null
  >('pending');
  const [cancelling, setCancelling] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [fatalError, setFatalError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const qrUrl = useMemo(() => {
    if (!config || !config.is_active) return '';
    if (!localCode) return '';
    return generateVietQRUrl(config, amount, localCode);
  }, [config, amount, localCode]);

  const bankName = useMemo(() => (config ? getBankDisplayName(config) : 'Ngân hàng'), [config]);

  const createRequestIfNeeded = useCallback(async () => {
    if (localRequestId && localCode) return;

    setIsCreating(true);
    setFatalError(null);

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user?.id) {
      setIsCreating(false);
      setFatalError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      return;
    }

    const userId = authData.user.id;

    const code = `DD${Date.now().toString().slice(-8)}`;

    const { data, error } = await supabase
      .from('topup_requests')
      .insert({
        user_id: userId,
        amount,
        transfer_code: code,
        status: 'pending',
      })
      .select('id, transfer_code')
      .single();

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('row-level security')) {
        setFatalError(
          'Không thể tạo yêu cầu nạp tiền do thiếu quyền (RLS). Vui lòng kiểm tra policy cho bảng topup_requests.'
        );
      } else {
        setFatalError(`Không thể tạo yêu cầu nạp tiền: ${error.message}`);
      }
      setIsCreating(false);
      return;
    }

    setLocalRequestId(data.id);
    setLocalCode(data.transfer_code);
    setIsCreating(false);
  }, [amount, localCode, localRequestId]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const boot = async () => {
      setIsBooting(true);
      setFatalError(null);

      try {
        const cfg = await getPaymentConfig();
        if (cancelled) return;

        setConfig(cfg);

        if (!cfg?.is_active) {
          setIsBooting(false);
          return;
        }

        await createRequestIfNeeded();
        if (cancelled) return;

        setIsBooting(false);
      } catch (err) {
        if (cancelled) return;
        setConfig(null);
        setFatalError(toNiceMessage(err, 'Không tải được cấu hình thanh toán'));
        setIsBooting(false);
      }
    };

    boot();

    return () => {
      cancelled = true;
    };
  }, [isOpen, createRequestIfNeeded]);

  useEffect(() => {
    if (!isOpen) return;

    if (!localRequestId) return;
    if (paymentStatus === 'confirmed' || paymentStatus === 'cancelled') return;

    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      const status = await checkTopupStatus(localRequestId);
      if (!status) return;

      if (status !== 'pending') {
        setPaymentStatus(status);
      }

      if (status === 'confirmed') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        toast.success('Nạp tiền thành công! 🎉');
        onSuccess?.();
        setTimeout(() => onClose(), 800);
      }
    }, POLL_INTERVAL);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, localRequestId, paymentStatus, onClose, onSuccess]);

  useEffect(() => {
    if (!isOpen) return;

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
      setPaymentStatus('pending');
      setFatalError(null);
      setIsBooting(true);
      setIsCreating(false);
      setCopied(null);

      if (!requestId && !transferCode) {
        setLocalRequestId(null);
        setLocalCode(null);
      }
    };
  }, [isOpen, requestId, transferCode]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`Đã sao chép ${label}`);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleManualCheck = async () => {
    if (!localRequestId) return;
    setChecking(true);
    const status = await checkTopupStatus(localRequestId);
    setChecking(false);

    if (status === 'confirmed') {
      setPaymentStatus('confirmed');
      toast.success('Đã nhận được tiền!');
      onSuccess?.();
      setTimeout(() => onClose(), 800);
      return;
    }

    toast('Chưa nhận được thanh toán, vui lòng đợi thêm...', { icon: '⏳' });
  };

  const handleCancel = async () => {
    if (!localRequestId) {
      onClose();
      return;
    }

    setCancelling(true);
    const ok = await cancelTopupRequest(localRequestId);
    setCancelling(false);

    if (ok) {
      toast.success('Đã hủy yêu cầu');
      onClose();
      return;
    }

    toast.error('Không thể hủy yêu cầu lúc này');
  };

  if (!isOpen) return null;

  const showSpinner = isBooting || isCreating;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <h3 className="font-black text-gray-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary-600" />
            Nạp tiền bằng QR
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {/* Config inactive */}
          {!config?.is_active && !showSpinner && !fatalError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-red-200">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-red-800">Hệ thống thanh toán chưa được cấu hình</p>
                  <p className="text-sm text-red-700 mt-1">
                    Vui lòng vào trang Cấu hình để thiết lập Sepay.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white border border-red-200 text-red-700 font-bold hover:bg-red-50 transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fatal error */}
          {fatalError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-900">Không thể tạo mã thanh toán</p>
                  <p className="text-sm text-amber-800 mt-1">{fatalError}</p>
                  <button
                    onClick={() => createRequestIfNeeded()}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Thử lại
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirmed */}
          {paymentStatus === 'confirmed' && (
            <div className="py-10 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-green-600 mb-2">Thanh toán thành công!</h3>
              <p className="text-gray-500">Tiền đã được cộng vào ví của bạn.</p>
            </div>
          )}

          {/* Loading */}
          {showSpinner && config?.is_active && paymentStatus !== 'confirmed' && (
            <div className="py-10 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto" />
              <p className="mt-4 text-gray-600 font-medium">
                {isBooting ? 'Đang tải cấu hình thanh toán...' : 'Đang tạo mã thanh toán...'}
              </p>
            </div>
          )}

          {/* Pending content */}
          {!showSpinner && config?.is_active && paymentStatus !== 'confirmed' && !fatalError && (
            <>
              {/* QR */}
              <div className="flex flex-col items-center mb-6">
                <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
                  {qrUrl ? (
                    <div className="w-52 h-52 flex items-center justify-center">
                      <QRCodeCanvas value={qrUrl} size={208} level="M" includeMargin />
                    </div>
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center text-gray-400">
                      Không tạo được QR
                    </div>
                  )}
                </div>

                {/* Fallback link */}
                {qrUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(qrUrl, '_blank', 'noopener,noreferrer')}
                    className="mt-3 text-xs font-bold text-primary-600 hover:underline"
                  >
                    Mở QR dạng ảnh (fallback)
                  </button>
                )}

                <div className="mt-4 inline-flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full text-sm font-bold border border-amber-100">
                  <Clock className="w-4 h-4" />
                  <span>Đang chờ thanh toán...</span>
                </div>
              </div>

              {/* Bank details */}
              <div className="space-y-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Ngân hàng</span>
                  <span className="font-bold text-gray-900">{bankName}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Chủ tài khoản</span>
                  <span className="font-bold text-gray-900 uppercase">{config.bank_holder}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Số tài khoản</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900 tracking-wide">{config.bank_account}</span>
                    <button
                      onClick={() => handleCopy(config.bank_account, 'Số tài khoản')}
                      className="text-primary-600 hover:bg-primary-50 p-1 rounded"
                    >
                      {copied === 'Số tài khoản' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Số tiền</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-primary-700 text-base">{formatCurrency(amount)}</span>
                    <button
                      onClick={() => handleCopy(amount.toString(), 'Số tiền')}
                      className="text-primary-600 hover:bg-primary-50 p-1 rounded"
                    >
                      {copied === 'Số tiền' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-500 font-medium">Nội dung CK</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                      {localCode}
                    </span>
                    <button
                      onClick={() => handleCopy(localCode || '', 'Nội dung')}
                      className="text-primary-600 hover:bg-primary-50 p-1 rounded"
                    >
                      {copied === 'Nội dung' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-center text-gray-500 mt-4 px-2">
                Vui lòng chuyển khoản đúng <strong>Số tiền</strong> và <strong>Nội dung</strong> để hệ thống tự động cộng tiền.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className={cn(
                    'py-3 rounded-xl font-black text-sm transition',
                    cancelling ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {cancelling ? 'Đang hủy...' : 'Hủy yêu cầu'}
                </button>

                <button
                  onClick={handleManualCheck}
                  disabled={checking}
                  className={cn(
                    'py-3 rounded-xl font-black text-sm transition flex items-center justify-center gap-2',
                    checking ? 'bg-primary-200 text-white cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700'
                  )}
                >
                  {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Tôi đã chuyển
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}