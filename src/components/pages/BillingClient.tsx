'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  ArrowLeft,
  Search,
  Filter,
  X,
  Copy,
  Check,
  Receipt,
  Wallet as WalletIcon,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';
import { useDbWallet } from '@/hooks/useDbWallet';

// Must match wallet_transactions CHECK constraint: topup, payment, escrow, refund, withdraw
type TxType = 'topup' | 'payment' | 'escrow' | 'refund' | 'withdraw' | string;

// Must match wallet_transactions CHECK constraint: pending, completed, failed, cancelled
type TxStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | string;

type DbTxRow = Record<string, any>;

function getTypeLabel(type: TxType) {
  switch (type) {
    case 'topup':
      return 'Nạp tiền';
    case 'payment':
      return 'Thanh toán';
    case 'escrow':
      return 'Tạm giữ (escrow)';
    case 'refund':
      return 'Hoàn tiền';
    case 'withdraw':
      return 'Rút tiền';
    default:
      return type;
  }
}

function getStatusBadge(status: TxStatus) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    failed: 'bg-rose-100 text-rose-700 border-rose-200',
    refunded: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const labels: Record<string, string> = {
    pending: 'Đang xử lý',
    completed: 'Thành công',
    failed: 'Thất bại',
    cancelled: 'Đã hủy',
  };

  return {
    className: styles[status] || 'bg-gray-100 text-gray-700 border-gray-200',
    label: labels[status] || status,
  };
}

function isIncome(type: TxType) {
  return ['topup', 'refund'].includes(type);
}

function parseDateInputToIsoStart(date: string) {
  // YYYY-MM-DD => local start of day
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
  return dt.toISOString();
}

function parseDateInputToIsoEnd(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999);
  return dt.toISOString();
}

export default function BillingClient() {
  const { balance, escrow, transactions, loading, reload } = useDbWallet();

  const [query, setQuery] = useState('');
  const [type, setType] = useState<TxType | 'all'>('all');
  const [status, setStatus] = useState<TxStatus | 'all'>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const [selected, setSelected] = useState<DbTxRow | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const totals = useMemo(() => {
    const txs = transactions || [];
    const sum = (pred: (t: any) => boolean) =>
      txs.filter(pred).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);

    return {
      topup: sum((t) => t.type === 'topup' && t.status === 'completed'),
      spend: sum((t) => ['payment', 'escrow', 'withdraw'].includes(t.type) && t.status === 'completed'),
      earning: sum((t) => t.type === 'refund' && t.status === 'completed'),
    };
  }, [transactions]);

  const filtered = useMemo(() => {
    const txs = (transactions || []) as DbTxRow[];
    const q = query.trim().toLowerCase();

    const fromIso = fromDate ? parseDateInputToIsoStart(fromDate) : null;
    const toIso = toDate ? parseDateInputToIsoEnd(toDate) : null;

    return txs.filter((t) => {
      if (type !== 'all' && String(t.type) !== type) return false;
      if (status !== 'all' && String(t.status) !== status) return false;

      if (fromIso) {
        const created = String(t.created_at || t.completed_at || '');
        if (created && created < fromIso) return false;
      }

      if (toIso) {
        const created = String(t.created_at || t.completed_at || '');
        if (created && created > toIso) return false;
      }

      if (!q) return true;

      const hay = [
        t.id,
        t.related_id,
        t.type,
        t.status,
        t.payment_method,
        t.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return hay.includes(q);
    });
  }, [transactions, query, type, status, fromDate, toDate]);

  const typeOptions: { value: TxType | 'all'; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'topup', label: 'Nạp tiền' },
    { value: 'payment', label: 'Thanh toán' },
    { value: 'escrow', label: 'Tạm giữ (escrow)' },
    { value: 'refund', label: 'Hoàn tiền' },
    { value: 'withdraw', label: 'Rút tiền' },
  ];

  const statusOptions: { value: TxStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Đang xử lý' },
    { value: 'completed', label: 'Thành công' },
    { value: 'failed', label: 'Thất bại' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`Đã copy ${label}`);
    setTimeout(() => setCopied(null), 1200);
  };

  const clearFilters = () => {
    setQuery('');
    setType('all');
    setStatus('all');
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link href="/wallet" className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-primary-600" />
              Billing
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Lịch sử giao dịch & hóa đơn
            </p>
          </div>
        </div>

        <button
          onClick={() => reload()}
          className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition"
        >
          Làm mới
        </button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-bold">
            <WalletIcon className="w-4 h-4 text-primary-600" />
            Số dư
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900">{formatCurrency(balance)}</p>
          {escrow > 0 && (
            <p className="mt-2 text-sm font-bold text-amber-700 bg-amber-50 border border-amber-100 inline-flex items-center gap-2 px-3 py-1.5 rounded-full">
              <Clock className="w-4 h-4" />
              Escrow: {formatCurrency(escrow)}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-bold text-gray-500">Tổng nạp</p>
          <p className="mt-2 text-2xl font-black text-green-600">{formatCurrency(totals.topup)}</p>
          <p className="mt-1 text-xs text-gray-400">Chỉ tính giao dịch completed</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-bold text-gray-500">Tổng chi / Tổng thu</p>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-gray-400">Chi</p>
              <p className="text-xl font-black text-rose-600">{formatCurrency(totals.spend)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400">Thu</p>
              <p className="text-xl font-black text-green-600">{formatCurrency(totals.earning)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo mô tả, mã giao dịch, trạng thái..."
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition"
            />
            {query.trim() && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center border font-bold transition',
              showFilters ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            )}
            aria-label="Bộ lọc"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Loại</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="mt-2 w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white font-bold text-sm"
                  >
                    {typeOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Trạng thái</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="mt-2 w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white font-bold text-sm"
                  >
                    {statusOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Từ ngày</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="mt-2 w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Đến ngày</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="mt-2 w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white font-bold text-sm"
                  />
                </div>

                <div className="md:col-span-4 flex gap-2">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
                  >
                    Xóa bộ lọc
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-gray-500 font-medium">
            Đang tải lịch sử giao dịch...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">🧾</div>
            <p className="font-bold text-gray-900">Không có giao dịch</p>
            <p className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa.</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const t = String(tx.type) as TxType;
            const s = String(tx.status) as TxStatus;
            const badge = getStatusBadge(s);
            const amount = Number(tx.amount || 0);

            return (
              <button
                key={tx.id}
                onClick={() => setSelected(tx)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-gray-900 truncate">{tx.description || getTypeLabel(t)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(String(tx.created_at || tx.completed_at || ''))}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={cn('px-2 py-1 rounded-full text-[11px] font-black border', badge.className)}>
                        {badge.label}
                      </span>
                      <span className="px-2 py-1 rounded-full text-[11px] font-black bg-gray-100 text-gray-700 border border-gray-200">
                        {getTypeLabel(t)}
                      </span>
                      {tx.payment_method && (
                        <span className="px-2 py-1 rounded-full text-[11px] font-black bg-white text-gray-600 border border-gray-200">
                          {String(tx.payment_method)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={cn('text-lg font-black', isIncome(t) ? 'text-green-600' : 'text-rose-600')}>
                      {isIncome(t) ? '+' : '-'}
                      {formatCurrency(amount)}
                    </p>
                    {tx.related_id && (
                      <p className="text-[11px] text-gray-400 font-bold mt-1">
                        Ref: {String(tx.related_id).slice(0, 8)}…
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
              initial={{ y: 30, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <p className="font-black text-gray-900">Chi tiết giao dịch</p>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Mô tả</p>
                  <p className="mt-1 font-bold text-gray-900">{String(selected.description || '') || '—'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Mã giao dịch', value: String(selected.id) },
                    { label: 'Loại', value: getTypeLabel(String(selected.type) as TxType) },
                    { label: 'Trạng thái', value: getStatusBadge(String(selected.status) as TxStatus).label },
                    { label: 'Số tiền', value: formatCurrency(Number(selected.amount || 0)) },
                    { label: 'Phương thức', value: String(selected.payment_method || '—') },
                    { label: 'Thời gian', value: formatRelativeTime(String(selected.created_at || selected.completed_at || '')) },
                  ].map((row) => (
                    <div key={row.label} className="bg-white border border-gray-200 rounded-2xl p-4">
                      <p className="text-xs font-black text-gray-500 uppercase tracking-wider">{row.label}</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="font-bold text-gray-900 break-all">{row.value}</p>
                        {row.label === 'Mã giao dịch' && (
                          <button
                            onClick={() => copy(String(selected.id), 'Mã giao dịch')}
                            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
                          >
                            {copied === 'Mã giao dịch' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {selected.related_id && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Related ID</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="font-mono font-bold text-gray-900 break-all">{String(selected.related_id)}</p>
                      <button
                        onClick={() => copy(String(selected.related_id), 'Related ID')}
                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
                      >
                        {copied === 'Related ID' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelected(null)}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-black hover:bg-gray-200 transition"
                  >
                    Đóng
                  </button>
                  <Link href="/wallet" className="flex-1">
                    <button className="w-full py-3 rounded-2xl bg-gradient-primary text-white font-black hover:opacity-90 transition shadow-primary">
                      Về Ví
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}