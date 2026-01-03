'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Copy, Check, Loader2, Clock, QrCode, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
    getPaymentConfig, 
    generateVietQRUrl, 
    getBankDisplayName, 
    checkTopupStatus, 
    cancelTopupRequest,
    PaymentConfig 
} from "@/lib/payment";
import { formatCurrency, cn } from "@/lib/utils";

interface TopupModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    requestId?: string; // Nếu đã có request ID (resume)
    transferCode?: string; // Nếu đã có code (resume)
    onSuccess?: () => void;
}

const POLL_INTERVAL = 3000; // 3 seconds

export default function TopupModal({
    isOpen,
    onClose,
    amount,
    requestId,
    transferCode,
    onSuccess,
}: TopupModalProps) {
    const [config, setConfig] = useState<PaymentConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [localRequestId, setLocalRequestId] = useState<string | null>(requestId || null);
    const [localCode, setLocalCode] = useState<string | null>(transferCode || null);
    
    // Status
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | 'cancelled' | 'expired' | null>('pending');
    const [cancelling, setCancelling] = useState(false);
    const [checking, setChecking] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Create request if not exists
    const createRequestIfNeeded = useCallback(async () => {
        if (localRequestId) return;
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const code = `DD${Date.now().toString().slice(-8)}`;
            
            const { data, error } = await supabase
                .from('topup_requests')
                .insert({
                    user_id: user.id,
                    amount: amount,
                    transfer_code: code,
                    status: 'pending'
                })
                .select('id, transfer_code')
                .single();

            if (error) throw error;
            
            setLocalRequestId(data.id);
            setLocalCode(data.transfer_code);
        } catch (err) {
            console.error(err);
            toast.error("Không thể tạo yêu cầu nạp tiền");
            onClose();
        }
    }, [amount, localRequestId, onClose]);

    // 2. Load config & init
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            getPaymentConfig().then(cfg => {
                setConfig(cfg);
                createRequestIfNeeded().then(() => setLoading(false));
            });
        } else {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setPaymentStatus('pending');
            setLocalRequestId(null); // Reset for fresh open if needed
        }
        
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [isOpen, createRequestIfNeeded]);

    // 3. Polling logic
    useEffect(() => {
        if (!isOpen || !localRequestId || paymentStatus === 'confirmed' || paymentStatus === 'cancelled') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            return;
        }

        pollingRef.current = setInterval(async () => {
            const status = await checkTopupStatus(localRequestId);
            if (status && status !== 'pending') {
                setPaymentStatus(status);
                if (status === 'confirmed') {
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    toast.success("Nạp tiền thành công! 🎉");
                    setTimeout(() => {
                        onSuccess?.();
                        onClose();
                    }, 2000);
                }
            }
        }, POLL_INTERVAL);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [isOpen, localRequestId, paymentStatus, onSuccess, onClose]);

    // Handlers
    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        toast.success(`Đã sao chép ${label}`);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleManualCheck = async () => {
        if (!localRequestId) return;
        setChecking(true);
        const status = await checkTopupStatus(localRequestId);
        setChecking(false);
        
        if (status === 'confirmed') {
            setPaymentStatus('confirmed');
            toast.success("Đã nhận được tiền!");
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1500);
        } else {
            toast("Chưa nhận được thanh toán, vui lòng đợi thêm...", { icon: '⏳' });
        }
    };

    const handleCancel = async () => {
        if (!localRequestId) { onClose(); return; }
        setCancelling(true);
        await cancelTopupRequest(localRequestId);
        setCancelling(false);
        toast.success("Đã hủy yêu cầu");
        onClose();
    };

    if (!isOpen) return null;

    const qrUrl = (config && localCode) ? generateVietQRUrl(config, amount, localCode) : '';
    const bankName = config ? getBankDisplayName(config) : 'Ngân hàng';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-primary-500" />
                        Thanh toán QR
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto" />
                        <p className="mt-4 text-gray-500 font-medium">Đang tạo mã thanh toán...</p>
                    </div>
                ) : !config?.is_active ? (
                    <div className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <p className="text-gray-900 font-bold">Hệ thống thanh toán đang bảo trì</p>
                        <p className="text-sm text-gray-500 mt-2">Vui lòng quay lại sau hoặc liên hệ Admin.</p>
                    </div>
                ) : paymentStatus === 'confirmed' ? (
                     <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-green-600 mb-2">Thanh toán thành công!</h3>
                        <p className="text-gray-500">Tiền đã được cộng vào ví của bạn.</p>
                    </div>
                ) : (
                    <div className="p-6 overflow-y-auto">
                        <div className="flex flex-col items-center mb-6">
                             {/* QR Image */}
                             <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm mb-4">
                                <img src={qrUrl} alt="QR Code" className="w-48 h-48 object-contain" />
                             </div>
                             
                             <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full text-sm font-medium animate-pulse">
                                <Clock className="w-4 h-4" />
                                <span>Đang chờ thanh toán...</span>
                             </div>
                        </div>

                        {/* Bank Info Details */}
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
                                    <button onClick={() => handleCopy(config.bank_account, "Số tài khoản")} className="text-primary-600 hover:bg-primary-50 p-1 rounded">
                                        {copied === 'Số tài khoản' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Số tiền</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-primary-600 text-lg">{formatCurrency(amount)}</span>
                                    <button onClick={() => handleCopy(amount.toString(), "Số tiền")} className="text-primary-600 hover:bg-primary-50 p-1 rounded">
                                        {copied === 'Số tiền' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                                <span className="text-gray-500 font-medium">Nội dung CK</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">{localCode}</span>
                                    <button onClick={() => handleCopy(localCode || '', "Nội dung")} className="text-primary-600 hover:bg-primary-50 p-1 rounded">
                                        {copied === 'Nội dung' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-center text-gray-400 mt-4 px-4">
                            ⚠️ Vui lòng chuyển khoản đúng <strong>Số tiền</strong> và <strong>Nội dung</strong> để hệ thống tự động xử lý.
                        </p>

                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleManualCheck}
                                disabled={checking}
                                className="py-3 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition flex items-center justify-center gap-2"
                            >
                                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Đã chuyển tiền
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}