'use client';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { DailyRevenue } from '@/hooks/useFinancialReports';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface RevenueChartProps {
  data: DailyRevenue[];
  loading?: boolean;
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  const { maxRevenue, totalRevenue, avgRevenue, trend } = useMemo(() => {
    if (!data.length) return { maxRevenue: 0, totalRevenue: 0, avgRevenue: 0, trend: 0 };

    const max = Math.max(...data.map(d => d.revenue), 1);
    const total = data.reduce((sum, d) => sum + d.revenue, 0);
    const avg = Math.round(total / data.length);

    // Calculate trend (compare last half vs first half)
    const midPoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midPoint).reduce((sum, d) => sum + d.revenue, 0);
    const secondHalf = data.slice(midPoint).reduce((sum, d) => sum + d.revenue, 0);
    const trendPct = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

    return { maxRevenue: max, totalRevenue: total, avgRevenue: avg, trend: trendPct };
  }, [data]);

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-50 rounded-xl">
            <BarChart3 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Doanh thu Platform</h3>
            <p className="text-sm text-gray-500">Phi dich vu theo ngay</p>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Dang tai du lieu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-50 rounded-xl">
            <BarChart3 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Doanh thu Platform</h3>
            <p className="text-sm text-gray-500">Phi dich vu theo ngay</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-gray-900">{formatCurrency(totalRevenue)}</p>
          <div className={`flex items-center gap-1 justify-end text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{trend >= 0 ? '+' : ''}{trend}%</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Trung binh/ngay</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(avgRevenue)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Cao nhat</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(maxRevenue)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400">
            Chua co du lieu doanh thu
          </div>
        ) : (
          <div className="h-48 flex items-end gap-1">
            {data.map((day, index) => {
              const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              const isLastWeek = index >= data.length - 7;

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                      <p className="font-bold">{formatCurrency(day.revenue)}</p>
                      <p className="text-gray-300">{day.dateOrders} đơn hẹn</p>
                      <p className="text-gray-400">{formatShortDate(day.date)}</p>
                    </div>
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      isLastWeek ? 'bg-green-500 hover:bg-green-600' : 'bg-green-200 hover:bg-green-300'
                    }`}
                    style={{
                      height: `${Math.max(height, 2)}%`,
                      minHeight: day.revenue > 0 ? '4px' : '2px',
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* X-axis labels */}
        {data.length > 0 && (
          <div className="flex mt-2 border-t border-gray-100 pt-2">
            {data.length <= 14 ? (
              // Show all labels for <= 14 days
              data.map((day) => (
                <div key={day.date} className="flex-1 text-center">
                  <span className="text-xs text-gray-400">{formatShortDate(day.date)}</span>
                </div>
              ))
            ) : (
              // Show selected labels for > 14 days
              <>
                <div className="flex-1 text-left">
                  <span className="text-xs text-gray-400">{formatShortDate(data[0].date)}</span>
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-gray-400">{formatShortDate(data[Math.floor(data.length / 2)].date)}</span>
                </div>
                <div className="flex-1 text-right">
                  <span className="text-xs text-gray-400">{formatShortDate(data[data.length - 1].date)}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>7 ngay gan nhat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-200" />
          <span>Truoc do</span>
        </div>
      </div>
    </div>
  );
}
