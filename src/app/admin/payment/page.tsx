'use client';

import { useState, useEffect } from "react";
import { Loader2, ExternalLink, Copy, Check, AlertCircle, CheckCircle2, Settings, Wallet } from "lucide-react";
import { toast } from "react-hot-toast";
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
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cấu hình Thanh toán & Ví</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Status Card */}
        <div className="xl:col-span-2">
            <div className={`p-6 rounded-2xl border ${config?.is_active ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-center gap-4">
                    {config?.is_active ? (
                    <>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="font-bold text-green-800 text-lg">Đã kết nối SePay</p>
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
                            <p className="font-bold text-red-800 text-lg">Chưa cấu hình thanh toán</p>
                            <p className="text-red-700">Vui lòng thêm Secrets trong Supabase Dashboard để kích hoạt.</p>
                        </div>
                    </>
                    )}
                </div>
            </div>
        </div>

        {/* Configuration Steps */}
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs">1</span>
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
                        <p className="text-xs text-gray-500">Số tài khoản ảo Sepay cấp</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between font-mono text-xs mb-1">
                            <span className="font-bold text-gray-700">SEPAY_BANK_BIN</span>
                            <span className="text-red-500 text-[10px]">Bắt buộc</span>
                        </div>
                        <p className="text-xs text-gray-500">Mã BIN ngân hàng (VD: MB = 970422)</p>
                    </div>
                     <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between font-mono text-xs mb-1">
                            <span className="font-bold text-gray-700">SEPAY_WEBHOOK_SECRET</span>
                            <span className="text-blue-500 text-[10px]">Bảo mật</span>
                        </div>
                        <p className="text-xs text-gray-500">Chuỗi ngẫu nhiên để bảo vệ webhook</p>
                    </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100">
                    <a
                    href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/settings/functions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:opacity-90 transition font-medium text-sm"
                    >
                    <Settings className="w-4 h-4" />
                    Mở Supabase Settings
                    </a>
                </div>
            </div>
        </div>

        {/* Webhook Info */}
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs">2</span>
                    Cấu hình Webhook
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Trong Sepay Dashboard → <strong>Cài đặt</strong> → <strong>Webhook</strong>:
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

                <div className="bg-blue-50 p-4 text-blue-800 rounded-xl text-sm">
                    <p className="font-bold mb-1">Cơ chế hoạt động:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Khách chuyển khoản vào số tài khoản ảo (VA).</li>
                        <li>Ngân hàng báo cho Sepay.</li>
                        <li>Sepay gọi Webhook này để cộng tiền vào ví User trên DineDate.</li>
                    </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                    <a
                    href="https://my.sepay.vn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-green-600 text-white rounded-xl hover:opacity-90 transition font-medium text-sm"
                    >
                    <ExternalLink className="w-4 h-4" />
                    Đến Sepay Dashboard
                    </a>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}