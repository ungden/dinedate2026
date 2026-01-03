'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  ArrowLeft,
  Wallet,
  Plus,
  CreditCard,
  TrendingUp,
  Clock,
  ExternalLink
} from 'lucide-react';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { useDbWallet } from '@/hooks/useDbWallet';
import { useAuth } from '@/contexts/AuthContext';
import TopupModal from '@/components/TopupModal';

const topUpAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function WalletClient() {
  const { user } = useAuth();
  const { balance, escrow, transactions, loading, reload } = useDbWallet();

  const [showTopUp, setShowTopUp] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'top_up':
        return { label: 'Nạp tiền', color: 'bg-green-100 text-green-600' };
      case 'escrow_hold':
        return { label: 'Giữ tiền (escrow)', color: 'bg-yellow-100 text-yellow-700' };
      case 'escrow_release':
        return { label: 'Giải phóng escrow', color: 'bg-green-100 text-green-600' };
      case 'booking_payment':
      case 'vip_payment':
        return { label: 'Thanh toán', color: 'bg-red-100 text-red-600' };
      case 'booking_earning':
        return { label: 'Thu nhập booking', color: 'bg-green-100 text-green-600' };
      default:
        return { label: type, color: 'bg-gray-100 text-gray-600' };
    }
  };

  const totalTopUp = useMemo(() => {
    return transactions
      .filter((t: any) => t.type === 'top_up' && t.status === 'completed')
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const totalSpend = useMemo(() => {
    return transactions
      .filter((t: any) => ['booking_payment', 'vip_payment', 'escrow_hold'].includes(t.type))
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const handleTopupSuccess = async () => {
    await reload();
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center gap-4">
            <Link href="/profile">
            <motion.button
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
                whileTap={{ scale: 0.9 }}
            >
                <ArrowLeft className="w-5 h-5" />
            </motion.button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Ví của tôi</h1>
        </div>
        
        {/* Admin Link for convenience if needed, otherwise hidden */}
        <Link href="/admin/payment" className="text-xs text-gray-400 hover:text-primary-500 flex items-center gap-1">
           <ExternalLink className="w-3 h-3" />
           Cấu hình
        </Link>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        className="relative bg-gradient-premium rounded-3xl p-6 text-white overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <motion.div
              className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Wallet className="w-7 h-7" />
            </motion.div>
            <div>
              <p className="text-white/70 text-sm font-medium">Số dư khả dụng</p>
              <motion.p
                className="text-4xl font-bold"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                {formatCurrency(balance)}
              </motion.p>
            </div>
          </div>

          {escrow > 0 && (
            <motion.div
              className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Clock className="w-5 h-5 text-white/70" />
              <div className="flex-1">
                <p className="text-white/70 text-sm">Đang giữ (Escrow)</p>
                <p className="font-semibold">{formatCurrency(escrow)}</p>
              </div>
            </motion.div>
          )}

          {/* Top Up Selection Grid - Inline for better UX */}
          {!showTopUp ? (
             <motion.button
                onClick={() => setShowTopUp(true)}
                className="w-full py-3.5 bg-white text-gray-900 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-white/90 transition-colors shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
             >
                <Plus className="w-5 h-5" />
                Nạp tiền ngay
             </motion.button>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                <p className="text-sm font-medium mb-3 text-white/90">Chọn mệnh giá nạp:</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {topUpAmounts.map(amt => (
                        <button
                            key={amt}
                            onClick={() => setSelectedAmount(amt)}
                            className="py-2 px-1 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition"
                        >
                            {formatCurrency(amt).replace('₫','')}
                        </button>
                    ))}
                </div>
                 <button
                    onClick={() => setShowTopUp(false)}
                    className="w-full py-2 text-sm text-white/70 hover:text-white"
                >
                    Hủy bỏ
                </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Tổng nạp</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(totalTopUp)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-500">Tổng chi</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(totalSpend)}
          </p>
        </div>
      </motion.div>

      {/* Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">Lịch sử giao dịch</h2>

        {loading ? (
          <div className="py-10 text-center text-gray-500">Đang tải giao dịch...</div>
        ) : transactions.length > 0 ? (
          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {transactions.map((tx: any) => {
              const meta = getTransactionIcon(tx.type);
              const isIncome = ['booking_earning', 'top_up', 'escrow_release'].includes(tx.type);

              return (
                <motion.div
                  key={tx.id}
                  variants={itemVariants}
                  className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs text-center p-1', meta.color)}>
                     <span className="leading-tight">{meta.label}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{tx.description}</p>
                    <p className="text-sm text-gray-500">{formatRelativeTime(tx.created_at)}</p>
                  </div>
                  <p className={cn('text-lg font-bold', isIncome ? 'text-green-600' : 'text-red-600')}>
                    {isIncome ? '+' : '-'}{formatCurrency(Number(tx.amount || 0))}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            className="text-center py-12 bg-white rounded-2xl border border-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="text-5xl mb-4"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💰
            </motion.div>
            <p className="text-gray-500">Chưa có giao dịch nào</p>
            <p className="text-gray-400 text-sm mt-1">Nạp tiền để bắt đầu sử dụng các dịch vụ</p>
          </motion.div>
        )}
      </motion.div>

      {/* Payment Modal */}
      {selectedAmount && (
          <TopupModal 
            isOpen={!!selectedAmount}
            onClose={() => { setSelectedAmount(null); setShowTopUp(false); }}
            amount={selectedAmount}
            onSuccess={handleTopupSuccess}
          />
      )}
    </motion.div>
  );
}