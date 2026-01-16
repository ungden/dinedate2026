'use client';

import { motion } from '@/lib/motion';
import { TopService } from '@/hooks/usePartnerAnalytics';
import { formatCurrency } from '@/lib/utils';
import { Flame, Package, TrendingUp } from 'lucide-react';

interface TopServicesCardProps {
  data: TopService[];
  loading?: boolean;
}

const serviceColors = [
  { bg: 'bg-primary-100', text: 'text-primary-600', bar: 'bg-primary-500' },
  { bg: 'bg-purple-100', text: 'text-purple-600', bar: 'bg-purple-500' },
  { bg: 'bg-blue-100', text: 'text-blue-600', bar: 'bg-blue-500' },
  { bg: 'bg-green-100', text: 'text-green-600', bar: 'bg-green-500' },
  { bg: 'bg-orange-100', text: 'text-orange-600', bar: 'bg-orange-500' },
];

export default function TopServicesCard({ data, loading }: TopServicesCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <motion.div
        className="bg-white rounded-2xl border border-gray-100 p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Dich vu noi bat</h3>
            <p className="text-xs text-gray-500">Duoc dat nhieu nhat</p>
          </div>
        </div>

        <div className="text-center py-6 text-gray-500">
          <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Chua co du lieu dich vu</p>
        </div>
      </motion.div>
    );
  }

  const maxBookings = Math.max(...data.map((s) => s.bookings), 1);

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-100 p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <Flame className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Dich vu noi bat</h3>
          <p className="text-xs text-gray-500">Duoc dat nhieu nhat</p>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {data.map((service, index) => {
          const colors = serviceColors[index % serviceColors.length];
          const barWidth = (service.bookings / maxBookings) * 100;

          return (
            <motion.div
              key={service.serviceId}
              className="relative"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 ${colors.bg} rounded-lg flex items-center justify-center text-xs font-bold ${colors.text}`}>
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[140px]">{service.title}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">{service.bookings}</span>
                  <span className="text-xs text-gray-500 ml-1">don</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${colors.bar} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                />
              </div>

              {/* Earnings */}
              <div className="flex justify-between mt-1 text-xs">
                <span className="text-gray-400">{service.percentage}% tong don</span>
                <span className={colors.text + ' font-medium'}>{formatCurrency(service.earnings)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-gray-500">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>Dich vu tot nhat</span>
            </div>
            <span className="font-bold text-primary-600">{data[0]?.title}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
