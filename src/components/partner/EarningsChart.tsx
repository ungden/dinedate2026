'use client';

import { useState } from 'react';
import { motion } from '@/lib/motion';
import { DailyEarning } from '@/hooks/usePartnerAnalytics';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, DollarSign } from 'lucide-react';

interface EarningsChartProps {
  data: DailyEarning[];
  total: number;
  completedBookings: number;
  loading?: boolean;
}

export default function EarningsChart({ data, total, completedBookings, loading }: EarningsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  // Show last 7 or 14 days depending on data length
  const displayData = data.slice(-14);

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-100 p-5 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Thu nhap</h3>
            <p className="text-xs text-gray-500">{displayData.length} ngay gan nhat</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-green-600">{formatCurrency(total)}</p>
          <p className="text-xs text-gray-500">{completedBookings} don hoan thanh</p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-40 mt-6">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-b border-gray-100 border-dashed" />
          ))}
        </div>

        {/* Bars */}
        <div className="relative h-full flex items-end gap-1">
          {displayData.map((item, index) => {
            const height = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={item.date}
                className="flex-1 relative flex flex-col items-center"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {isHovered && item.amount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap z-10 shadow-lg"
                  >
                    <div className="font-bold">{formatCurrency(item.amount)}</div>
                    <div className="text-gray-300">{item.bookings} don</div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                  </motion.div>
                )}

                {/* Bar */}
                <motion.div
                  className={`w-full rounded-t-md transition-all duration-200 cursor-pointer ${
                    isHovered
                      ? 'bg-gradient-to-t from-primary-600 to-primary-400'
                      : item.amount > 0
                      ? 'bg-gradient-to-t from-primary-500 to-primary-300'
                      : 'bg-gray-100'
                  }`}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, 4)}%` }}
                  transition={{ delay: index * 0.03, duration: 0.4 }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-[10px] text-gray-400">
        <span>{formatDateLabel(displayData[0]?.date || '')}</span>
        <span>{formatDateLabel(displayData[Math.floor(displayData.length / 2)]?.date || '')}</span>
        <span>{formatDateLabel(displayData[displayData.length - 1]?.date || '')}</span>
      </div>

      {/* Legend */}
      {total === 0 && (
        <div className="mt-4 text-center text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-gray-400" />
          <p>Chua co thu nhap trong giai doan nay</p>
        </div>
      )}
    </motion.div>
  );
}
