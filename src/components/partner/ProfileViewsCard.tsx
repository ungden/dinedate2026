'use client';

import { motion } from '@/lib/motion';
import { ProfileViewsData } from '@/hooks/usePartnerAnalytics';
import { Eye, TrendingUp, TrendingDown, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ProfileViewsCardProps {
  data: ProfileViewsData | null;
  loading?: boolean;
}

export default function ProfileViewsCard({ data, loading }: ProfileViewsCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const TrendIcon = data.isUp ? TrendingUp : TrendingDown;
  const trendColor = data.isUp ? 'text-green-600' : 'text-red-500';
  const trendBg = data.isUp ? 'bg-green-100' : 'bg-red-100';

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      {/* Main Content */}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Luot xem profile</p>
              <div className="flex items-baseline gap-2">
                <motion.span
                  className="text-3xl font-black text-gray-900"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {data.current}
                </motion.span>
                <span className="text-sm text-gray-400">luot</span>
              </div>
            </div>
          </div>

          {/* Trend Indicator */}
          <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full ${trendBg}`}>
            <TrendIcon className={`w-4 h-4 ${trendColor}`} />
            <span className={`text-sm font-bold ${trendColor}`}>
              {data.trendPercentage > 0 ? '+' : ''}
              {data.trendPercentage}%
            </span>
          </div>
        </div>

        {/* Comparison */}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <span>Ky truoc: {data.previous} luot</span>
          <span className="text-gray-300">|</span>
          <span className={data.isUp ? 'text-green-600' : 'text-red-500'}>
            {data.isUp ? 'Tang' : 'Giam'} {Math.abs(data.current - data.previous)} luot
          </span>
        </div>
      </div>

      {/* CTA Banner */}
      <Link href="/vip" className="block">
        <motion.div
          className="bg-gradient-to-r from-primary-500 via-primary-600 to-purple-600 p-4 relative overflow-hidden group"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-purple-300 rounded-full blur-2xl" />
          </div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Mua goi noi bat</p>
                <p className="text-white/80 text-xs">Tang view, tang don hang!</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-white/90 group-hover:text-white transition-colors">
              <span className="text-sm font-medium">Xem ngay</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
