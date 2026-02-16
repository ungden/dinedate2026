'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from '@/lib/motion';
import { ArrowLeft, Crown, Check, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, cn } from '@/lib/utils';
import { SubscriptionPlan, VIP_PLAN_PRICES, VIP_BENEFITS } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

const PLANS: { plan: SubscriptionPlan; label: string; period: string; perMonth: string }[] = [
  { plan: 'monthly', label: 'Hàng tháng', period: '1 tháng', perMonth: '199k/tháng' },
  { plan: 'quarterly', label: 'Hàng quý', period: '3 tháng', perMonth: '~166k/tháng' },
  { plan: 'yearly', label: 'Hàng năm', period: '12 tháng', perMonth: '~125k/tháng' },
];

export default function VIPSubscriptionClient() {
  const { user, refreshProfile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('monthly');
  const [isSubscribing, setIsSubscribing] = useState(false);

  if (!user) return null;

  const currentTier = user.vipStatus.tier;
  const isVipActive = currentTier === 'vip' || currentTier === 'svip';
  const expiresAt = user.vipExpiresAt ? new Date(user.vipExpiresAt) : null;
  const isExpired = expiresAt ? expiresAt < new Date() : true;

  const handleSubscribe = async () => {
    if (!user) return;
    const price = VIP_PLAN_PRICES[selectedPlan];

    if ((user.wallet.balance || 0) < price) {
      toast.error(`Số dư không đủ. Cần ${formatCurrency(price)}, hiện có ${formatCurrency(user.wallet.balance)}`);
      return;
    }

    if (!confirm(`Xác nhận đăng ký VIP gói ${selectedPlan}? Trừ ${formatCurrency(price)} từ ví.`)) return;

    setIsSubscribing(true);
    try {
      const { data, error: upgradeError } = await supabase.rpc('upgrade_vip', {
        target_tier: 'vip',
        plan_type: selectedPlan,
      });

      if (upgradeError) {
        toast.error('Lỗi nâng cấp VIP: ' + upgradeError.message);
        return;
      }

      if (!data?.success) {
        toast.error(data?.error || 'Không thể nâng cấp VIP');
        return;
      }

      toast.success('Đăng ký VIP thành công!');
      await refreshProfile();
    } catch (err: any) {
      console.error('VIP subscription error:', err);
      toast.error('Lỗi đăng ký VIP: ' + (err.message || 'Không xác định'));
    } finally {
      setIsSubscribing(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Đăng ký VIP</h1>
          <p className="text-gray-500 text-sm">Mở khóa đặc quyền hẹn hò cao cấp</p>
        </div>
      </div>

      {/* Current Status */}
      {isVipActive && !isExpired && (
        <motion.div
          className="relative rounded-3xl p-6 text-white overflow-hidden shadow-xl bg-gradient-to-r from-yellow-500 to-orange-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-sm">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Hạng hiện tại</p>
                <p className="text-3xl font-black uppercase tracking-wide">{currentTier}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-xs uppercase font-bold tracking-widest">Hết hạn</p>
              <p className="text-lg font-bold">
                {expiresAt ? expiresAt.toLocaleDateString('vi-VN') : '--'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Plan Selection */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 px-2 text-lg">Chọn gói đăng ký</h3>

        <div className="space-y-3">
          {PLANS.map((p) => {
            const price = VIP_PLAN_PRICES[p.plan];
            const isSelected = selectedPlan === p.plan;
            const isBestValue = p.plan === 'yearly';

            return (
              <button
                key={p.plan}
                onClick={() => setSelectedPlan(p.plan)}
                className={cn(
                  'w-full text-left p-5 rounded-2xl border-2 transition-all relative overflow-hidden',
                  isSelected
                    ? 'bg-pink-50 border-pink-500 ring-1 ring-pink-500 shadow-md'
                    : 'bg-white border-gray-100 hover:border-gray-300'
                )}
              >
                {isBestValue && (
                  <span className="absolute top-0 right-0 px-3 py-1 bg-green-500 text-white text-[10px] font-black rounded-bl-xl uppercase">
                    Tiết kiệm nhất
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-gray-900 text-lg">{p.label}</p>
                    <p className="text-sm text-gray-500">{p.period} • {p.perMonth}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-pink-600">{formatCurrency(price)}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute top-4 left-4">
                    <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Benefits */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 px-2 text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Đặc quyền VIP
        </h3>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <ul className="space-y-3">
            {VIP_BENEFITS.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700 font-medium">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Subscribe Button */}
      <div className="sticky bottom-4 bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">Tổng thanh toán</p>
            <p className="text-2xl font-black text-gray-900">{formatCurrency(VIP_PLAN_PRICES[selectedPlan])}</p>
          </div>
          <p className="text-xs text-gray-400">Trừ từ ví • Số dư: {formatCurrency(user.wallet.balance)}</p>
        </div>
        <button
          onClick={handleSubscribe}
          disabled={isSubscribing || (isVipActive && !isExpired)}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-black text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubscribing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isVipActive && !isExpired ? (
            'Đang là thành viên VIP'
          ) : (
            <>
              <Crown className="w-5 h-5" />
              Đăng ký VIP ngay
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
