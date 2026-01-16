'use client';

import { useState } from 'react';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { PendingWithdrawal, exportToCSV } from '@/hooks/useFinancialReports';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Loader2,
  ArrowDownLeft,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface WithdrawalQueueProps {
  data: PendingWithdrawal[];
  loading?: boolean;
  onApprove: (withdrawal: PendingWithdrawal) => Promise<void>;
  onReject: (withdrawal: PendingWithdrawal, reason: string) => Promise<void>;
  onRefresh: () => void;
}

export function WithdrawalQueue({
  data,
  loading,
  onApprove,
  onReject,
  onRefresh
}: WithdrawalQueueProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleExport = () => {
    exportToCSV(data, 'pending_withdrawals', [
      { key: 'userName', label: 'Ten User' },
      { key: 'amount', label: 'So tien' },
      { key: 'bankName', label: 'Ngan hang' },
      { key: 'accountNumber', label: 'So tai khoan' },
      { key: 'accountName', label: 'Chu tai khoan' },
      { key: 'createdAt', label: 'Thoi gian' },
    ]);
  };

  const handleApprove = async (withdrawal: PendingWithdrawal) => {
    if (!confirm(`Xac nhan da chuyen ${formatCurrency(withdrawal.amount)} cho ${withdrawal.userName}?\nHanh dong nay se tru tien trong vi user.`)) {
      return;
    }

    setProcessingId(withdrawal.id);
    try {
      await onApprove(withdrawal);
      toast.success('Da duyet yeu cau thanh cong');
      onRefresh();
    } catch (error: any) {
      toast.error('Loi: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (withdrawal: PendingWithdrawal) => {
    const reason = prompt('Nhap ly do tu choi:');
    if (reason === null) return;

    setProcessingId(withdrawal.id);
    try {
      await onReject(withdrawal, reason);
      toast.success('Da tu choi yeu cau');
      onRefresh();
    } catch (error: any) {
      toast.error('Loi: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Da sao chep!');
  };

  const totalPending = data.reduce((sum, w) => sum + w.amount, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-orange-50 rounded-xl">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Yeu cau Rut tien</h3>
            <p className="text-sm text-gray-500">Dang cho xu ly</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-50 rounded-xl relative">
            <ArrowDownLeft className="w-6 h-6 text-orange-600" />
            {data.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {data.length}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Yeu cau Rut tien</h3>
            <p className="text-sm text-gray-500">Dang cho xu ly</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={data.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          CSV
        </button>
      </div>

      {/* Summary */}
      {data.length > 0 && (
        <div className="bg-orange-50 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-orange-600 font-medium">Tong cho xu ly</p>
            <p className="text-2xl font-black text-gray-900">{formatCurrency(totalPending)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-orange-600 font-medium">So yeu cau</p>
            <p className="text-2xl font-black text-gray-900">{data.length}</p>
          </div>
        </div>
      )}

      {data.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-400" />
            <p>Khong co yeu cau nao dang cho</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition"
            >
              {/* User info row */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                  <Image
                    src={withdrawal.userAvatar}
                    alt={withdrawal.userName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{withdrawal.userName}</p>
                  <p className="text-xs text-gray-500">{withdrawal.userEmail || withdrawal.userPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-rose-600">{formatCurrency(withdrawal.amount)}</p>
                  <p className="text-xs text-gray-400">{formatRelativeTime(withdrawal.createdAt)}</p>
                </div>
              </div>

              {/* Bank info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 text-sm flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-24 flex-shrink-0">Ngan hang:</span>
                      <span className="font-medium text-gray-900">{withdrawal.bankName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-24 flex-shrink-0">So TK:</span>
                      <span className="font-mono font-medium text-gray-900">{withdrawal.accountNumber}</span>
                      <button
                        onClick={() => copyToClipboard(withdrawal.accountNumber)}
                        className="p-1 hover:bg-gray-200 rounded transition"
                      >
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-24 flex-shrink-0">Chu TK:</span>
                      <span className="font-medium text-gray-900">{withdrawal.accountName}</span>
                    </div>
                  </div>
                </div>
                {withdrawal.note && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Ghi chu: {withdrawal.note}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(withdrawal)}
                  disabled={!!processingId}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === withdrawal.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  Da chuyen & Duyet
                </button>
                <button
                  onClick={() => handleReject(withdrawal)}
                  disabled={!!processingId}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-5 h-5" />
                  Tu choi
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick link to full withdrawals page */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <a
          href="/admin/withdrawals"
          className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-primary-600 transition"
        >
          <ExternalLink className="w-4 h-4" />
          Xem tat ca yeu cau rut tien
        </a>
      </div>
    </div>
  );
}
