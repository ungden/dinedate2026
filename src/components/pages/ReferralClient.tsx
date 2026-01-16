'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  ArrowLeft,
  Gift,
  Copy,
  Share2,
  Users,
  Wallet,
  Check,
  UserPlus,
  CheckCircle,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { useReferral, ReferralReward } from '@/hooks/useReferral';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

const REFERRER_REWARD = 50000; // 50k cho nguoi gioi thieu
const REFERRED_REWARD = 30000; // 30k cho nguoi moi

const howItWorksSteps = [
  {
    icon: Share2,
    title: 'Chia se ma gioi thieu',
    description: 'Gui ma hoac link gioi thieu den ban be cua ban',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: UserPlus,
    title: 'Ban be dang ky',
    description: 'Ban be dang ky tai khoan va nhap ma gioi thieu cua ban',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Sparkles,
    title: 'Nhan thuong ngay',
    description: 'Ca hai nhan thuong khi ban be hoan thanh booking dau tien',
    color: 'bg-green-100 text-green-600',
  },
];

export default function ReferralClient() {
  const {
    referralCode,
    referredUsers,
    stats,
    loading,
    copyReferralCode,
    copyReferralLink,
    shareReferral,
    getReferralLink,
  } = useReferral();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');

  const handleCopyCode = async () => {
    const success = await copyReferralCode();
    if (success) {
      setCopiedCode(true);
      toast.success('Da sao chep ma gioi thieu!');
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      toast.error('Khong the sao chep');
    }
  };

  const handleCopyLink = async () => {
    const success = await copyReferralLink();
    if (success) {
      setCopiedLink(true);
      toast.success('Da sao chep link gioi thieu!');
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      toast.error('Khong the sao chep');
    }
  };

  const handleShare = async () => {
    const success = await shareReferral();
    if (success) {
      toast.success('Da chia se thanh cong!');
    }
  };

  const filteredUsers = referredUsers.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/profile">
          <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Gioi thieu ban be</h1>
          <p className="text-sm text-gray-500 font-medium">Nhan thuong khi moi ban be tham gia</p>
        </div>
      </div>

      {/* Reward Banner */}
      <div className="bg-gradient-to-br from-primary-500 to-pink-500 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Gift className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black">Nhan ngay {formatCurrency(REFERRER_REWARD)}</h2>
              <p className="text-primary-100">Moi nguoi ban gioi thieu</p>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-3 mb-4">
            <p className="text-sm text-primary-100 mb-1">Ban be cua ban cung duoc</p>
            <p className="text-lg font-bold">{formatCurrency(REFERRED_REWARD)} khi dang ky</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-black">{stats.totalReferred}</p>
              <p className="text-xs text-primary-100">Da gioi thieu</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-black">{stats.completedRewards}</p>
              <p className="text-xs text-primary-100">Da nhan</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-black">{formatCurrency(stats.totalEarned).replace('d', '')}</p>
              <p className="text-xs text-primary-100">Tong thuong</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Ma gioi thieu cua ban</h3>

        {/* Code Box */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-primary-600 tracking-widest">
              {referralCode || '---'}
            </span>
            <button
              onClick={handleCopyCode}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors',
                copiedCode
                  ? 'bg-green-100 text-green-600'
                  : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
              )}
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? 'Da chep!' : 'Sao chep'}
            </button>
          </div>
        </div>

        {/* Link Box */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-500 font-medium mb-2">Link gioi thieu</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 truncate">
              {getReferralLink() || 'dinedate.vn/ref/---'}
            </div>
            <button
              onClick={handleCopyLink}
              className={cn(
                'px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap',
                copiedLink
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              )}
            >
              {copiedLink ? 'Da chep!' : 'Sao chep'}
            </button>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-primary text-white rounded-xl font-bold hover:opacity-90 transition shadow-primary"
        >
          <Share2 className="w-5 h-5" />
          Chia se ngay
        </button>
      </div>

      {/* How it Works */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Cach thuc hoat dong</h3>

        <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
          {howItWorksSteps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex items-start gap-4"
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', step.color)}>
                <step.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-400">Buoc {index + 1}</span>
                </div>
                <h4 className="font-bold text-gray-900">{step.title}</h4>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
              {index < howItWorksSteps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-gray-300 mt-3" />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Reward Details */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h4 className="font-bold text-gray-900 mb-3">Chi tiet phan thuong</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-sm font-bold text-green-700">Nguoi gioi thieu</span>
              </div>
              <p className="text-2xl font-black text-green-800">{formatCurrency(REFERRER_REWARD)}</p>
              <p className="text-xs text-green-600 mt-1">Moi nguoi duoc gioi thieu</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-bold text-blue-700">Nguoi moi</span>
              </div>
              <p className="text-2xl font-black text-blue-800">{formatCurrency(REFERRED_REWARD)}</p>
              <p className="text-xs text-blue-600 mt-1">Bonus khi dang ky</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3 text-center">
            * Thuong se duoc cong vao vi khi nguoi duoc gioi thieu hoan thanh booking dau tien
          </p>
        </div>
      </div>

      {/* Referred Users List */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Danh sach gioi thieu</h3>
          <span className="text-sm text-gray-500">{referredUsers.length} nguoi</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {(['all', 'pending', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors',
                activeTab === tab
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {tab === 'all' && 'Tat ca'}
              {tab === 'pending' && `Cho xu ly (${stats.pendingRewards})`}
              {tab === 'completed' && `Da nhan (${stats.completedRewards})`}
            </button>
          ))}
        </div>

        {/* User List */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-bold">Chua co ai</p>
            <p className="text-gray-400 text-sm mt-1">
              Chia se ma gioi thieu de nhan thuong
            </p>
          </div>
        ) : (
          <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
            <AnimatePresence>
              {filteredUsers.map((reward) => (
                <ReferredUserItem key={reward.id} reward={reward} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function ReferredUserItem({ reward }: { reward: ReferralReward }) {
  const isCompleted = reward.status === 'completed';
  const isPending = reward.status === 'pending';

  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
      layout
    >
      {/* Avatar */}
      <div className="relative">
        <Image
          src={reward.referredUser?.avatar || '/default-avatar.png'}
          alt={reward.referredUser?.name || 'User'}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover"
        />
        {isCompleted && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 truncate">
          {reward.referredUser?.name || 'Nguoi dung moi'}
        </p>
        <p className="text-sm text-gray-500">{formatRelativeTime(reward.createdAt)}</p>
      </div>

      {/* Status & Reward */}
      <div className="text-right">
        {isCompleted ? (
          <>
            <div className="flex items-center gap-1 text-green-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-bold">Da nhan</span>
            </div>
            <p className="text-lg font-black text-green-600">+{formatCurrency(reward.referrerReward)}</p>
          </>
        ) : isPending ? (
          <>
            <div className="flex items-center gap-1 text-amber-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold">Cho booking</span>
            </div>
            <p className="text-sm font-bold text-gray-400">+{formatCurrency(reward.referrerReward)}</p>
          </>
        ) : (
          <span className="text-xs text-gray-400">Da huy</span>
        )}
      </div>
    </motion.div>
  );
}
