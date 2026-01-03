'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  ArrowLeft,
  Wallet,
  Plus,
  CreditCard,
  X,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { PaymentMethod } from '@/types';
import { useDbWallet } from '@/hooks/useDbWallet';
import { useAuth } from '@/contexts/AuthContext';

const topUpAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

const paymentMethods: { id: PaymentMethod; name: string; icon: string; color: string }[] = [
  { id: 'banking', name: 'Chuyển khoản', icon: '🏦', color: 'bg-blue-50' },
  { id: 'momo', name: 'MoMo', icon: '💜', color: 'bg-pink-50' },
  { id: 'zalopay', name: 'ZaloPay', icon: '💙', color: 'bg-blue-50' },
];

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
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTopUp = async () => {
    if (!user?.id) return;
    if (!selectedAmount || !selectedMethod) return;

    setIsProcessing(true);

    // Create a pending topup request (no auto balance credit without verification)
    const transferCode = `DD${Date.now().toString().slice(-8)}`;

    const { error } = await supabase.from('topup_requests').insert({
      user_id: user.id,
      amount: selectedAmount,
      transfer_code: transferCode,
      status: 'pending',
    } as any);

    setIsProcessing(false);

    if (error) throw error;

    alert(
      `Đã tạo yêu cầu nạp tiền.\nMã chuyển khoản: ${transferCode}\nVui lòng chuyển khoản đúng nội dung để được xác nhận.`
    );

    setShowTopUp(false);
    setSelectedAmount(null);
    setSelectedMethod(null);

    await reload();
  };

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

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link href="/profile">
          <motion.button
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Ví của tôi</h1>
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

          <motion.button
            onClick={() => setShowTopUp(true)}
            className="w-full py-3.5 bg-white text-gray-900 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-white/90 transition-colors shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            Nạp tiền
          </motion.button>
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
            <span className="text-sm text-gray-500">Tổng nạp (đã xác nhận)</span>
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

      {/* Top Up Modal */}
      <AnimatePresence>
        {showTopUp && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTopUp(false)}
          >
            <motion.div
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Nạp tiền</h2>
                <button
                  onClick={() => setShowTopUp(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Chọn số tiền
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {topUpAmounts.map((amount) => (
                      <motion.button
                        key={amount}
                        onClick={() => setSelectedAmount(amount)}
                        className={cn(
                          'py-3 px-3 rounded-xl border-2 text-sm font-semibold transition-all',
                          selectedAmount === amount
                            ? 'border-primary-500 bg-primary-50 text-primary-600 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        )}
                        whileTap={{ scale: 0.95 }}
                      >
                        {formatCurrency(amount)}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Phương thức thanh toán
                  </label>
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <motion.button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={cn(
                          'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all',
                          selectedMethod === method.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className={cn('text-3xl p-2 rounded-xl', method.color)}>{method.icon}</span>
                        <span className="font-semibold text-gray-900">{method.name}</span>
                        {selectedMethod === method.id && (
                          <CheckCircle className="w-5 h-5 text-primary-500 ml-auto" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {selectedAmount && selectedMethod && (
                  <motion.div
                    className="bg-gray-50 rounded-xl p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Số tiền nạp</span>
                      <span className="font-semibold">{formatCurrency(selectedAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái</span>
                      <span className="font-semibold text-yellow-600">Chờ xác nhận</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Vì chưa tích hợp cổng thanh toán tự động, yêu cầu nạp sẽ ở trạng thái chờ xác nhận.
                    </p>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <motion.button
                    onClick={() => setShowTopUp(false)}
                    className="flex-1 py-3.5 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    whileTap={{ scale: 0.98 }}
                  >
                    Hủy
                  </motion.button>
                  <motion.button
                    onClick={handleTopUp}
                    disabled={!selectedAmount || !selectedMethod || isProcessing}
                    className="flex-1 py-3.5 bg-gradient-primary text-white rounded-xl font-semibold disabled:opacity-50 transition-all shadow-primary"
                    whileHover={selectedAmount && selectedMethod ? { scale: 1.02 } : {}}
                    whileTap={selectedAmount && selectedMethod ? { scale: 0.98 } : {}}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        Đang tạo...
                      </span>
                    ) : (
                      'Tạo yêu cầu'
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs', meta.color)}>
                    {meta.label}
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
    </motion.div>
  );
}