'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  ArrowLeft,
  Wallet as WalletIcon,
  Plus,
  CreditCard,
  TrendingUp,
  Clock,
  ExternalLink,
  Crown,
} from 'lucide-react';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { useDbWallet } from '@/hooks/useDbWallet';
import TopupModal from '@/components/TopupModal';
import { useAuth } from '@/contexts/AuthContext';

const topUpAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

export default function WalletClient() {
  const { user } = useAuth();
  const { balance, transactions, loading, reload } = useDbWallet();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const totalTopUp = useMemo(() => {
    return transactions
      .filter((t: any) => t.type === 'top_up' && t.status === 'completed')
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const totalSpend = useMemo(() => {
    return transactions
      .filter((t: any) => ['date_order_payment', 'vip_payment'].includes(t.type))
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const getTransactionMeta = (type: string) => {
    switch (type) {
      case 'top_up':
        return { label: 'Nạp tiền', color: 'bg-green-100 text-green-700' };
      case 'date_order_payment':
        return { label: 'Thanh toán date', color: 'bg-rose-100 text-rose-700' };
      case 'date_order_refund':
        return { label: 'Hoàn tiền', color: 'bg-emerald-100 text-emerald-700' };
      case 'vip_payment':
        return { label: 'VIP', color: 'bg-amber-100 text-amber-800' };
      case 'referral_bonus':
        return { label: 'Giới thiệu', color: 'bg-blue-100 text-blue-700' };
      case 'booking_payment':
        return { label: 'Thanh toán', color: 'bg-rose-100 text-rose-700' };
      case 'escrow_hold':
        return { label: 'Escrow', color: 'bg-amber-100 text-amber-800' };
      case 'escrow_release':
        return { label: 'Giải phóng', color: 'bg-emerald-100 text-emerald-700' };
      case 'booking_earning':
        return { label: 'Thu nhập', color: 'bg-green-100 text-green-700' };
      default:
        return { label: type, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const handleTopupSuccess = async () => {
    await reload();
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Ví của tôi</h1>
            <p className="text-sm text-gray-500 font-medium">Quản lý số dư và lịch sử giao dịch</p>
          </div>
        </div>
      </div>

      {/* Balance card */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center">
              <WalletIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold">Số dư khả dụng</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{formatCurrency(balance)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
                onClick={() => setSelectedAmount(200000)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-primary text-white font-black shadow-primary hover:opacity-90 transition text-sm"
            >
                <Plus className="w-4 h-4" />
                Nạp tiền
            </button>
            <Link
                href="/vip-subscription"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 text-amber-700 font-black hover:bg-amber-100 transition text-sm border border-amber-100"
            >
                <Crown className="w-4 h-4" />
                Đăng ký VIP
            </Link>
          </div>
        </div>

        {/* Amount quick picks */}
        <div className="mt-5 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {topUpAmounts.map((amt) => (
            <button
              key={amt}
              onClick={() => setSelectedAmount(amt)}
              className="py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900 text-xs font-black transition"
            >
              {formatCurrency(amt).replace('₫', '')}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Nạp tiền qua chuyển khoản QR (SePay) — hệ thống tự động cộng tiền khi nhận đúng nội dung.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-500 font-bold">Tổng nạp</span>
          </div>
          <p className="text-xl font-black text-gray-900">{formatCurrency(totalTopUp)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-rose-600" />
            <span className="text-sm text-gray-500 font-bold">Tổng chi</span>
          </div>
          <p className="text-xl font-black text-gray-900">{formatCurrency(totalSpend)}</p>
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-lg font-black text-gray-900 mb-4">Lịch sử giao dịch</h2>

        {loading ? (
          <div className="py-10 text-center text-gray-500 font-medium">Đang tải giao dịch...</div>
        ) : transactions.length > 0 ? (
          <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
            {transactions.map((tx: any) => {
              const meta = getTransactionMeta(tx.type);
              const isIncome = ['top_up', 'date_order_refund', 'referral_bonus', 'booking_earning', 'escrow_release'].includes(tx.type);
              const amount = Number(tx.amount || 0);

              return (
                <motion.div
                  key={tx.id}
                  variants={itemVariants}
                  className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4"
                >
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[11px] text-center p-1', meta.color)}>
                    <span className="leading-tight">{meta.label}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{tx.description}</p>
                    <p className="text-sm text-gray-500">{formatRelativeTime(tx.created_at)}</p>
                  </div>

                  <p className={cn('text-lg font-black', isIncome ? 'text-green-600' : 'text-rose-600')}>
                    {isIncome ? '+' : '-'}
                    {formatCurrency(amount)}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">💰</div>
            <p className="text-gray-600 font-bold">Chưa có giao dịch nào</p>
            <p className="text-gray-400 text-sm mt-1">Nạp tiền để bắt đầu sử dụng DineDate</p>
          </div>
        )}
      </div>

      {/* Topup modal */}
      {selectedAmount && (
        <TopupModal
          isOpen={!!selectedAmount}
          onClose={() => setSelectedAmount(null)}
          amount={selectedAmount}
          onSuccess={handleTopupSuccess}
        />
      )}
    </motion.div>
  );
}
