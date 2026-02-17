'use client';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { TransactionBreakdown, exportToCSV } from '@/hooks/useFinancialReports';
import { PieChart, Download, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';

interface TransactionSummaryProps {
  data: TransactionBreakdown[];
  loading?: boolean;
}

export function TransactionSummary({ data, loading }: TransactionSummaryProps) {
  const { totalAmount, totalCount } = useMemo(() => {
    return {
      totalAmount: data.reduce((sum, d) => sum + d.amount, 0),
      totalCount: data.reduce((sum, d) => sum + d.count, 0),
    };
  }, [data]);

  const handleExport = () => {
    exportToCSV(data, 'transaction_breakdown', [
      { key: 'label', label: 'Loại giao dịch' },
      { key: 'count', label: 'Số lượng' },
      { key: 'amount', label: 'Tổng số tiền' },
      { key: 'percentage', label: 'Phần trăm' },
    ]);
  };

  const getIcon = (type: string) => {
    if (['topup', 'refund'].includes(type)) {
      return <ArrowUpCircle className="w-4 h-4" />;
    }
    if (['payment', 'escrow', 'withdraw'].includes(type)) {
      return <ArrowDownCircle className="w-4 h-4" />;
    }
    return <RefreshCw className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-50 rounded-xl">
            <PieChart className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Phân bổ giao dịch</h3>
            <p className="text-sm text-gray-500">Theo loại giao dịch</p>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 rounded-xl">
            <PieChart className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Phân bổ giao dịch</h3>
            <p className="text-sm text-gray-500">Theo loại giao dịch</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        >
          <Download className="w-4 h-4" />
          CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-xs text-purple-600 font-medium uppercase tracking-wider">Tổng giá trị</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-xs text-purple-600 font-medium uppercase tracking-wider">Tổng số giao dịch</p>
          <p className="text-lg font-bold text-gray-900">{totalCount.toLocaleString()}</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-gray-400">
          Chưa có dữ liệu giao dịch
        </div>
      ) : (
        <>
          {/* Visual pie representation using CSS */}
          <div className="relative h-48 mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Center circle with total */}
              <div className="absolute w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow-inner z-10">
                <p className="text-xs text-gray-500">Tổng</p>
                <p className="text-sm font-bold text-gray-900">{totalCount}</p>
              </div>

              {/* Pie segments using conic gradient */}
              <div
                className="w-40 h-40 rounded-full"
                style={{
                  background: `conic-gradient(${data.map((d, i) => {
                    const startAngle = data.slice(0, i).reduce((sum, item) => sum + item.percentage, 0);
                    return `${d.color} ${startAngle}% ${startAngle + d.percentage}%`;
                  }).join(', ')})`,
                }}
              />
            </div>
          </div>

          {/* Breakdown list */}
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.type} className="flex items-center gap-3">
                {/* Color indicator and icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: item.color }}
                >
                  {getIcon(item.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 truncate">{item.label}</p>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(item.amount)}</p>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">{item.count} giao dịch</p>
                    <p className="text-xs font-medium" style={{ color: item.color }}>
                      {item.percentage}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
