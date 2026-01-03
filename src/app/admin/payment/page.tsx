'use client';

import { useState, useEffect } from "react";
import { Loader2, ExternalLink, Copy, Check, AlertCircle, CheckCircle2, Settings, Info, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import Link from 'next/link';
import { getPaymentConfig, PaymentConfig } from "@/lib/payment";

// Supabase Project ID
const SUPABASE_PROJECT_ID = "cgnbicnayzifjyupweki";

export default function AdminPaymentPage() {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  // Webhook URL
  const webhookUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/sepay-webhook`;

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await getPaymentConfig();
        setConfig(data);
      } catch (err) {
        console.error("Error loading config:", err);
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`Đã copy ${label}`);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <Link href="/wallet" className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Cấu hình thanh toán Sepay</h1>
        </div>

        <div className="space-y-6">
            {/* Current Status */}
            <div className={`p-6 rounded-2xl border ${config?.is_active ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center gap-4">
                {config?.is_active ? (
                <>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="font-bold text-green-800 text-lg">Đã kết nối thành công</p>
                        <p className="text-green-700">
                            Hệ thống đang sử dụng tài khoản: <span className="font-bold">{config.bank_account}</span> ({config.bank_full_name || config.bank_name})
                        </p>
                    </div>
                </>
                ) : (
                <>
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <p className="font-bold text-red-800 text-lg">Chưa được cấu hình</p>
                        <p className="text-red-700">Vui lòng thêm Secrets trong Supabase Dashboard để kích hoạt.</p>
                    </div>
                </>
                )}
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Step 1 & 2 */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs">1</span>
                            Đăng ký Sepay
                        </h3>
                        <div className="text-sm text-gray-600 space-y-2">
                            <p>Truy cập <a href="https://sepay.vn" target="_blank" className="text-primary-600 underline">sepay.vn</a> và đăng ký tài khoản.</p>
                            <p>Sepay sẽ cung cấp cho bạn một số tài khoản ảo (VA) thuộc ngân hàng MB Bank.</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                         <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs">2</span>
                            Cấu hình Secrets
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Vào <a href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/settings/functions`} target="_blank" className="text-primary-600 underline">Supabase Edge Functions Secrets</a> và thêm các biến sau:
                        </p>
                        <div className="space-y-3">
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex justify-between font-mono text-xs mb-1">
                                    <span className="font-bold text-gray-700">SEPAY_BANK_VA</span>
                                    <span className="text-red-500 text-[10px]">Bắt buộc</span>
                                </div>
                                <p className="text-xs text-gray-500">Số tài khoản ảo Sepay cấp (VD: 96247DINEDATE)</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex justify-between font-mono text-xs mb-1">
                                    <span className="font-bold text-gray-700">SEPAY_BANK_BIN</span>
                                    <span className="text-red-500 text-[10px]">Bắt buộc</span>
                                </div>
                                <p className="text-xs text-gray-500">Mã BIN ngân hàng (MB Bank là 970422)</p>
                            </div>
                             <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex justify-between font-mono text-xs mb-1">
                                    <span className="font-bold text-gray-700">SEPAY_VA_ACCOUNT_NAME</span>
                                    <span className="text-gray-400 text-[10px]">Tùy chọn</span>
                                </div>
                                <p className="text-xs text-gray-500">Tên chủ tài khoản hiển thị</p>
                            </div>
                             <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex justify-between font-mono text-xs mb-1">
                                    <span className="font-bold text-gray-700">SEPAY_WEBHOOK_SECRET</span>
                                    <span className="text-blue-500 text-[10px]">Bảo mật</span>
                                </div>
                                <p className="text-xs text-gray-500">Chuỗi ngẫu nhiên để bảo vệ webhook</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs">3</span>
                            Cấu hình Webhook
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Trong Sepay Dashboard → <strong>Cài đặt</strong> → <strong>Webhook</strong>, thêm URL sau:
                        </p>

                        <div className="bg-gray-900 rounded-xl p-4 mb-4 relative group">
                            <code className="text-gray-300 text-xs break-all block pr-8">{webhookUrl}</code>
                            <button 
                                onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}
                                className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded-lg text-white opacity-0 group-hover:opacity-100 transition"
                            >
                                {copied === 'Webhook URL' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                            Và thêm Header (nếu đã cấu hình Secret):
                        </p>
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-sm font-mono text-gray-700">
                            x-sepay-secret: [Gia_tri_Secret_cua_ban]
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm">
                            <p className="font-bold mb-1">💡 Lưu ý quan trọng:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Tuyệt đối không chia sẻ Webhook URL ra ngoài.</li>
                                <li>Sepay VA chỉ dùng để <strong>nhận tiền</strong>.</li>
                                <li>Tiền sẽ được Sepay chuyển về tài khoản chính của bạn sau 1-2 ngày (T+1).</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
                <a
                href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/settings/functions`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition shadow-sm font-medium"
                >
                <Settings className="w-4 h-4" />
                Mở Supabase Secrets
                </a>
                <a
                href="https://my.sepay.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:opacity-90 transition shadow-lg shadow-green-500/30 font-medium"
                >
                Mở Sepay Dashboard
                <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </div>
      </div>
    </div>
  );
}