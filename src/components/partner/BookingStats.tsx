'use client';

import { motion } from '@/lib/motion';
import { BookingStatsData } from '@/hooks/usePartnerAnalytics';
import { Inbox, CheckCircle, Award, ArrowRight } from 'lucide-react';

interface BookingStatsProps {
  data: BookingStatsData | null;
  loading?: boolean;
}

export default function BookingStats({ data, loading }: BookingStatsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const funnelSteps = [
    {
      icon: Inbox,
      label: 'Nhan',
      value: data.received,
      color: 'bg-blue-100 text-blue-600',
      barColor: 'bg-blue-500',
    },
    {
      icon: CheckCircle,
      label: 'Chap nhan',
      value: data.accepted,
      color: 'bg-purple-100 text-purple-600',
      barColor: 'bg-purple-500',
    },
    {
      icon: Award,
      label: 'Hoan thanh',
      value: data.completed,
      color: 'bg-green-100 text-green-600',
      barColor: 'bg-green-500',
    },
  ];

  const maxValue = Math.max(data.received, 1);

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-100 p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Award className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Quy trinh don</h3>
          <p className="text-xs text-gray-500">Ti le chuyen doi</p>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="space-y-4">
        {/* Funnel Steps */}
        <div className="flex items-center justify-between gap-2">
          {funnelSteps.map((step, index) => {
            const Icon = step.icon;
            const widthPercentage = maxValue > 0 ? (step.value / maxValue) * 100 : 0;

            return (
              <motion.div
                key={step.label}
                className="flex-1 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center ${step.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-2xl font-black text-gray-900 mt-2">{step.value}</p>
                <p className="text-xs text-gray-500 font-medium">{step.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Flow Arrows */}
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="flex-1 flex items-center gap-2">
            <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded" />
            <ArrowRight className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex-1 flex items-center gap-2">
            <div className="h-0.5 flex-1 bg-gradient-to-r from-purple-500 to-green-500 rounded" />
            <ArrowRight className="w-4 h-4 text-green-500" />
          </div>
        </div>

        {/* Conversion Rates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-3 border border-purple-100">
            <p className="text-xs text-gray-600 font-medium">Ti le chap nhan</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-purple-600">{data.acceptanceRate.toFixed(0)}</span>
              <span className="text-sm font-bold text-purple-500">%</span>
            </div>
            <div className="mt-2 h-1.5 bg-purple-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${data.acceptanceRate}%` }}
                transition={{ delay: 0.3, duration: 0.5 }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-3 border border-green-100">
            <p className="text-xs text-gray-600 font-medium">Ti le hoan thanh</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-green-600">{data.completionRate.toFixed(0)}</span>
              <span className="text-sm font-bold text-green-500">%</span>
            </div>
            <div className="mt-2 h-1.5 bg-green-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-green-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${data.completionRate}%` }}
                transition={{ delay: 0.4, duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
