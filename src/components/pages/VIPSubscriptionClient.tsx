'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from '@/lib/motion';
import { ArrowLeft, Crown, Check, Star, Sparkles, Zap, Shield, Gift } from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { formatCurrency, getVIPBadgeColor, cn } from '@/lib/utils';
import { VIPTier } from '@/types';

const vipTiers: {
  tier: VIPTier;
  name: string;
  price: number;
  benefits: string[];
  popular?: boolean;
  icon: typeof Crown;
}[] = [
    {
      tier: 'bronze',
      name: 'Bronze',
      price: 99000,
      icon: Shield,
      benefits: [
        'Huy hiệu Verified',
        'Giảm 5% phí dịch vụ',
        'Ưu tiên hiển thị trong tìm kiếm',
      ],
    },
    {
      tier: 'silver',
      name: 'Silver',
      price: 199000,
      icon: Star,
      benefits: [
        'Tất cả quyền lợi Bronze',
        'Ưu tiên danh sách',
        'Giảm 10% phí dịch vụ',
        'Không quảng cáo',
      ],
      popular: true,
    },
    {
      tier: 'gold',
      name: 'Gold',
      price: 399000,
      icon: Zap,
      benefits: [
        'Tất cả quyền lợi Silver',
        'Booking không giới hạn',
        'Giảm 20% phí dịch vụ',
        'Hồ sơ nổi bật',
        'Hỗ trợ ưu tiên',
      ],
    },
    {
      tier: 'platinum',
      name: 'Platinum',
      price: 699000,
      icon: Crown,
      benefits: [
        'Tất cả quyền lợi Gold',
        'Giảm 30% phí dịch vụ',
        'Hỗ trợ VIP 24/7',
        'Sự kiện độc quyền',
        'Trải nghiệm tính năng mới sớm',
      ],
    },
  ];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function VIPSubscriptionClient() {
  const [selectedTier, setSelectedTier] = useState<VIPTier | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { currentUser, purchaseVIP } = useDateStore();

  const handlePurchase = async () => {
    if (!selectedTier) return;
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const result = purchaseVIP(selectedTier);
    setIsProcessing(false);
    if (!result) {
      alert('Số dư không đủ. Vui lòng nạp thêm tiền.');
    } else {
      alert('Nâng cấp VIP thành công! 🎉');
      setSelectedTier(null);
    }
  };

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nâng cấp VIP</h1>
          <p className="text-gray-500 text-sm">Mở khóa tính năng độc quyền</p>
        </div>
      </motion.div>

      {/* Current Status */}
      <motion.div
        className="relative bg-gradient-premium rounded-3xl p-6 text-white overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-4 right-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-12 h-12 text-white/20" />
          </motion.div>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <motion.div
            className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center',
              currentUser.vipStatus.tier === 'free'
                ? 'bg-white/20'
                : getVIPBadgeColor(currentUser.vipStatus.tier)
            )}
            whileHover={{ scale: 1.1, rotate: 10 }}
          >
            <Crown className="w-8 h-8 text-white" />
          </motion.div>
          <div>
            <p className="text-white/70 text-sm">Gói hiện tại</p>
            <p className="text-2xl font-bold uppercase">
              {currentUser.vipStatus.tier === 'free' ? 'Miễn phí' : currentUser.vipStatus.tier}
            </p>
            {currentUser.vipStatus.expiryDate && (
              <p className="text-sm text-white/70">
                Hết hạn: {new Date(currentUser.vipStatus.expiryDate).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Wallet Balance */}
      <motion.div
        className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Gift className="w-5 h-5 text-green-600" />
          </div>
          <span className="text-gray-600 font-medium">Số dư ví</span>
        </div>
        <p className="font-bold text-xl text-gray-900">
          {formatCurrency(currentUser.wallet.balance)}
        </p>
      </motion.div>

      {/* VIP Tiers */}
      <motion.div
        className="grid gap-4 md:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {vipTiers.map((vip, index) => {
          const isCurrentTier = currentUser.vipStatus.tier === vip.tier;
          const isSelected = selectedTier === vip.tier;
          const Icon = vip.icon;

          return (
            <motion.div
              key={vip.tier}
              variants={itemVariants}
              onClick={() => !isCurrentTier && setSelectedTier(vip.tier)}
              className={cn(
                'relative bg-white rounded-3xl border-2 p-6 transition-all cursor-pointer',
                isSelected
                  ? 'border-primary-500 shadow-primary ring-4 ring-primary-100'
                  : 'border-gray-100 hover:border-gray-200 hover:shadow-md',
                isCurrentTier && 'opacity-60 cursor-not-allowed'
              )}
              whileHover={!isCurrentTier ? { y: -4 } : {}}
              whileTap={!isCurrentTier ? { scale: 0.98 } : {}}
            >
              {vip.popular && !isCurrentTier && (
                <motion.div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-primary text-white text-xs font-bold rounded-full shadow-primary flex items-center gap-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Star className="w-3 h-3" />
                  Phổ biến nhất
                </motion.div>
              )}

              <div className="flex items-center gap-4 mb-4">
                <motion.div
                  className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center',
                    getVIPBadgeColor(vip.tier)
                  )}
                  whileHover={{ rotate: 10 }}
                >
                  <Icon className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{vip.name}</h3>
                  <p className="text-primary-600 font-bold text-lg">
                    {formatCurrency(vip.price)}<span className="text-sm font-medium text-gray-500">/tháng</span>
                  </p>
                </div>
              </div>

              <ul className="space-y-3">
                {vip.benefits.map((benefit, idx) => (
                  <motion.li
                    key={idx}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                  >
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{benefit}</span>
                  </motion.li>
                ))}
              </ul>

              {isCurrentTier && (
                <div className="mt-4 py-2.5 bg-gray-100 rounded-xl text-center text-gray-500 font-semibold">
                  ✓ Gói hiện tại
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Purchase Button */}
      <AnimatePresence>
        {selectedTier && (
          <motion.div
            className="sticky bottom-4 bg-white rounded-3xl shadow-xl p-4 border border-gray-100"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  getVIPBadgeColor(selectedTier)
                )}>
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Bạn đã chọn</p>
                  <p className="text-xl font-bold text-gray-900 uppercase">{selectedTier}</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-primary-600">
                {formatCurrency(vipTiers.find((v) => v.tier === selectedTier)?.price || 0)}
              </p>
            </div>
            <motion.button
              onClick={handlePurchase}
              disabled={isProcessing}
              className="w-full py-4 bg-gradient-primary text-white rounded-2xl font-bold text-lg shadow-primary hover:shadow-lg transition-all disabled:opacity-70"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Đang xử lý...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Crown className="w-5 h-5" />
                  Nâng cấp ngay
                </span>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
