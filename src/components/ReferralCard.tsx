'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from '@/lib/motion';
import {
  Gift,
  Copy,
  Share2,
  Users,
  Wallet,
  ChevronRight,
  Check,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useReferral } from '@/hooks/useReferral';
import toast from 'react-hot-toast';

interface ReferralCardProps {
  compact?: boolean;
  className?: string;
}

export default function ReferralCard({ compact = false, className }: ReferralCardProps) {
  const { referralCode, stats, loading, copyReferralCode, copyReferralLink, shareReferral, getReferralLink } = useReferral();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  if (loading) {
    return (
      <div className={cn('bg-white rounded-2xl border border-gray-100 p-4 animate-pulse', className)}>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-10 bg-gray-200 rounded mb-4" />
        <div className="flex gap-2">
          <div className="h-10 bg-gray-200 rounded flex-1" />
          <div className="h-10 bg-gray-200 rounded flex-1" />
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <Link href="/referral">
        <motion.div
          className={cn(
            'bg-gradient-to-r from-primary-50 to-pink-50 rounded-2xl border border-primary-100 p-4 cursor-pointer hover:shadow-md transition-shadow',
            className
          )}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Gioi thieu ban be</h3>
                <p className="text-sm text-gray-600">Nhan 50k moi nguoi</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.div
      className={cn('bg-white rounded-2xl border border-gray-100 p-5 shadow-sm', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center">
          <Gift className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Gioi thieu ban be</h3>
          <p className="text-sm text-gray-500">Nhan thuong khi ban be tham gia</p>
        </div>
      </div>

      {/* Referral Code */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-500 font-medium mb-1">Ma gioi thieu cua ban</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-primary-600 tracking-wider flex-1">
            {referralCode || '---'}
          </span>
          <button
            onClick={handleCopyCode}
            className={cn(
              'p-2 rounded-lg transition-colors',
              copiedCode ? 'bg-green-100 text-green-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
            )}
          >
            {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4">
        <p className="text-xs text-gray-500 font-medium mb-1">Link gioi thieu</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 truncate flex-1">
            {getReferralLink() || 'dinedate.vn/ref/---'}
          </span>
          <button
            onClick={handleCopyLink}
            className={cn(
              'p-2 rounded-lg transition-colors text-xs font-bold whitespace-nowrap',
              copiedLink ? 'bg-green-100 text-green-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
            )}
          >
            {copiedLink ? 'Da chep!' : 'Sao chep'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">Da gioi thieu</span>
          </div>
          <p className="text-xl font-black text-blue-800">{stats.totalReferred}</p>
        </div>

        <div className="bg-green-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700 font-medium">Tong thuong</span>
          </div>
          <p className="text-xl font-black text-green-800">{formatCurrency(stats.totalEarned)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-primary text-white rounded-xl font-bold hover:opacity-90 transition shadow-primary"
        >
          <Share2 className="w-4 h-4" />
          Chia se ngay
        </button>

        <Link href="/referral" className="flex-1">
          <button className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition">
            Chi tiet
          </button>
        </Link>
      </div>
    </motion.div>
  );
}
