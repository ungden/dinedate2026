'use client';

import Link from 'next/link';
import { motion } from '@/lib/motion';
import { ArrowLeft, Crown, Check, Star, Zap, Shield, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, getVIPBadgeColor, cn } from '@/lib/utils';

export default function VIPSubscriptionClient() {
  const { user } = useAuth();

  if (!user) return null;

  const spending = user.totalSpending || 0;
  const currentTier = user.vipStatus.tier;

  const milestones = [
    { tier: 'free', amount: 0, label: 'Thành viên' },
    { tier: 'vip', amount: 1_000_000, label: 'VIP' },
    { tier: 'svip', amount: 100_000_000, label: 'SVIP' }
  ];

  let nextMilestone = milestones.find(m => m.amount > spending);
  if (!nextMilestone && spending >= 100000000) {
      nextMilestone = { tier: 'max', amount: spending, label: 'Max Level' };
  }

  const progress = nextMilestone && nextMilestone.tier !== 'max'
    ? Math.min(100, (spending / nextMilestone.amount) * 100)
    : 100;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hạng thành viên</h1>
          <p className="text-gray-500 text-sm">Tích lũy chi tiêu để thăng hạng</p>
        </div>
      </div>

      {/* Card Status */}
      <motion.div
        className={cn(
            "relative rounded-3xl p-6 text-white overflow-hidden shadow-xl",
            currentTier === 'svip' ? "bg-gradient-to-r from-purple-600 to-indigo-600" :
            currentTier === 'vip' ? "bg-gradient-to-r from-yellow-500 to-orange-500" :
            "bg-gradient-to-r from-gray-700 to-gray-900"
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-sm",
                )}>
                    <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                    <p className="text-white/80 text-sm font-medium">Hạng hiện tại</p>
                    <p className="text-3xl font-black uppercase tracking-wide">{currentTier}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-white/80 text-xs uppercase font-bold tracking-widest">Tổng chi tiêu</p>
                <p className="text-xl font-bold">{formatCurrency(spending)}</p>
            </div>
        </div>

        {/* Progress Bar */}
        {nextMilestone && nextMilestone.tier !== 'max' && (
            <div className="mt-6">
                <div className="flex justify-between text-xs font-bold text-white/90 mb-2">
                    <span>{formatCurrency(spending)}</span>
                    <span>Mục tiêu: {formatCurrency(nextMilestone.amount)}</span>
                </div>
                <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-white/90 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </div>
                <p className="mt-2 text-xs text-center text-white/80">
                    Chi tiêu thêm <b>{formatCurrency(nextMilestone.amount - spending)}</b> để lên hạng <b>{nextMilestone.label}</b>
                </p>
            </div>
        )}
      </motion.div>

      {/* Benefits List */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 px-2">Đặc quyền hạng thành viên</h3>
        
        {/* VIP */}
        <div className={cn("rounded-2xl border p-5 transition-colors", currentTier === 'vip' ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-100")}>
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-gray-900">VIP</h4>
                    <p className="text-xs text-gray-500">Chi tiêu trên 1.000.000đ</p>
                </div>
                {currentTier === 'vip' && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded font-bold">Hiện tại</span>}
            </div>
            <ul className="space-y-2 text-sm text-gray-600 pl-2">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Xem tuổi của Partner</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Huy hiệu VIP vàng nổi bật</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Ưu tiên hỗ trợ CSKH</li>
            </ul>
        </div>

        {/* SVIP */}
        <div className={cn("rounded-2xl border p-5 transition-colors", currentTier === 'svip' ? "bg-purple-50 border-purple-200" : "bg-white border-gray-100")}>
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 text-purple-600 fill-purple-600" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-gray-900">SVIP</h4>
                    <p className="text-xs text-gray-500">Chi tiêu trên 100.000.000đ</p>
                </div>
                {currentTier === 'svip' && <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded font-bold">Hiện tại</span>}
            </div>
            <ul className="space-y-2 text-sm text-gray-600 pl-2">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Tất cả quyền lợi VIP</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Huy hiệu SVIP tím quyền lực</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Tham gia sự kiện độc quyền</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Quà tặng sinh nhật đặc biệt</li>
            </ul>
        </div>
      </div>
    </motion.div>
  );
}