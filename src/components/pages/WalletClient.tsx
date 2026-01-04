'use client';

import { useMemo, useState, useEffect } from 'react';
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
  ArrowRight,
  X,
  Save,
  Building,
} from 'lucide-react';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { useDbWallet } from '@/hooks/useDbWallet';
import TopupModal from '@/components/TopupModal';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';
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
  const { user, updateUser } = useAuth();
  const { balance, escrow, transactions, loading, reload } = useDbWallet();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });
  const [saveBankInfo, setSaveBankInfo] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Pre-fill bank info if available
  useEffect(() => {
    if (user?.bankInfo) {
      setBankForm({
        bankName: user.bankInfo.bankName || '',
        accountNumber: user.bankInfo.accountNumber || '',
        accountHolder: user.bankInfo.accountHolder || '',
      });
      setSaveBankInfo(true); // Default check if data exists
    }
  }, [user?.bankInfo]);

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

  const getTransactionMeta = (type: string) => {
    switch (type) {
      case 'top_up':
        return { label: 'Nạp tiền', color: 'bg-green-100 text-green-700' };
      case 'escrow_hold':
        return { label: 'Escrow', color: 'bg-amber-100 text-amber-800' };
      case 'escrow_release':
        return { label: 'Giải phóng', color: 'bg-emerald-100 text-emerald-700' };
      case 'booking_payment':
      case 'vip_payment':
        return { label: 'Thanh toán', color: 'bg-rose-100 text-rose-700' };
      case 'booking_earning':
        return { label: 'Thu nhập', color: 'bg-green-100 text-green-700' };
      case 'withdrawal':
        return { label: 'Rút tiền', color: 'bg-gray-100 text-gray-700' };
      default:
        return { label: type, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const handleTopupSuccess = async () => {
    await reload();
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount < 50000) {
      toast.error('Số tiền rút tối thiểu 50.000đ');
      return;
    }
    if (amount > balance) {
      toast.error('Số dư không đủ');
      return;
    }
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountHolder) {
      toast.error('Vui lòng điền đầy đủ thông tin ngân hàng');
      return;
    }

    setIsWithdrawing(true);
    
    // Save bank info if checked
    if (saveBankInfo && user) {
        await supabase.from('users').update({ bank_info: bankForm }).eq('id', user.id);
        // Refresh local user context if needed, but not critical for withdrawal flow
        updateUser({ bankInfo: bankForm });
    }

    // Create withdrawal request
    const { error } = await supabase.from('withdrawal_requests').insert({
      user_id: user?.id,
      amount,
      bank_name: bankForm.bankName,
      account_number: bankForm.accountNumber,
      account_name: bankForm.accountHolder,
      status: 'pending',
      note: `${bankForm.bankName} - ${bankForm.accountNumber} - ${bankForm.accountHolder}`
    });

    if (error) {
      toast.error('Lỗi tạo yêu cầu rút tiền');
      console.error(error);
    } else {
      toast.success('Đã gửi yêu cầu rút tiền');
      setShowWithdraw(false);
      setWithdrawAmount('');
    }
    setIsWithdrawing(false);
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

        <Link
          href="/admin/payment"
          className="text-xs text-gray-500 hover:text-primary-600 font-bold flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          Cấu hình
        </Link>
      </div>

      {/* Balance card (clean, readable) */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center">
              <WalletIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold">Số dư khả dụng</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{formatCurrency(balance)}</p>

              {escrow > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-100">
                  <Clock className="w-4 h-4" />
                  Đang giữ escrow: {formatCurrency(escrow)}
                </div>
              )}
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
            <button
                onClick={() => setShowWithdraw(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-100 text-gray-700 font-black hover:bg-gray-200 transition text-sm"
            >
                <ArrowRight className="w-4 h-4" />
                Rút tiền
            </button>
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
              const isIncome = ['booking_earning', 'top_up', 'escrow_release'].includes(tx.type);
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
            <p className="text-gray-400 text-sm mt-1">Nạp tiền để bắt đầu sử dụng các dịch vụ</p>
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

      {/* Withdrawal Modal */}
      <AnimatePresence>
        {showWithdraw && (
            <motion.div 
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Rút tiền về ngân hàng</h3>
                        <button onClick={() => setShowWithdraw(false)} className="p-2 hover:bg-gray-100 rounded-full">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto space-y-5">
                        {/* Amount */}
                        <div>
                            <label className="text-sm font-bold text-gray-700">Số tiền muốn rút</label>
                            <div className="relative mt-1">
                                <input 
                                    type="number" 
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl font-bold text-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">VNĐ</span>
                            </div>
                            <div className="flex justify-between mt-1 text-xs">
                                <span className="text-gray-500">Tối đa: {formatCurrency(balance)}</span>
                                <button 
                                    onClick={() => setWithdrawAmount(balance.toString())}
                                    className="text-primary-600 font-bold hover:underline"
                                >
                                    Rút hết
                                </button>
                            </div>
                        </div>
                        
                        {/* Bank Info */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Building className="w-4 h-4 text-gray-500" />
                                <label className="text-sm font-bold text-gray-700">Thông tin nhận tiền</label>
                            </div>
                            
                            <input 
                                type="text"
                                value={bankForm.bankName}
                                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Tên ngân hàng (VD: MB Bank, Vietcombank...)"
                            />
                            
                            <input 
                                type="text"
                                value={bankForm.accountNumber}
                                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Số tài khoản"
                            />
                            
                            <input 
                                type="text"
                                value={bankForm.accountHolder}
                                onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none uppercase"
                                placeholder="Tên chủ tài khoản (Không dấu)"
                            />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={saveBankInfo}
                                onChange={(e) => setSaveBankInfo(e.target.checked)}
                                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-600">Lưu thông tin ngân hàng cho lần sau</span>
                        </label>

                        <button
                            onClick={handleWithdraw}
                            disabled={isWithdrawing}
                            className="w-full py-4 bg-gradient-primary text-white rounded-xl font-bold hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-primary transition-all"
                        >
                            {isWithdrawing ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu rút tiền'}
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}