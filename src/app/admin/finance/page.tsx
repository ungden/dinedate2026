'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Download,
  Calendar
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import {
  useFinancialReports,
  FinancePeriod,
  OverviewMetrics,
  DailyRevenue,
  TransactionBreakdown,
  TopPartner,
  TopUser,
  PendingWithdrawal,
  exportToCSV
} from '@/hooks/useFinancialReports';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { TransactionSummary } from '@/components/admin/TransactionSummary';
import { TopPartnersTable } from '@/components/admin/TopPartnersTable';
import { TopUsersTable } from '@/components/admin/TopUsersTable';
import { WithdrawalQueue } from '@/components/admin/WithdrawalQueue';

const PERIOD_OPTIONS: { value: FinancePeriod; label: string }[] = [
  { value: 'today', label: 'Hom nay' },
  { value: '7d', label: '7 ngay' },
  { value: '30d', label: '30 ngay' },
  { value: 'month', label: 'Thang nay' },
  { value: 'year', label: 'Nam nay' },
];

export default function AdminFinancePage() {
  const [period, setPeriod] = useState<FinancePeriod>('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<DailyRevenue[]>([]);
  const [transactionBreakdown, setTransactionBreakdown] = useState<TransactionBreakdown[]>([]);
  const [topPartners, setTopPartners] = useState<TopPartner[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);

  const {
    fetchOverviewMetrics,
    fetchRevenueData,
    fetchTransactionBreakdown,
    fetchTopPartners,
    fetchTopUsers,
    fetchPendingWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
  } = useFinancialReports();

  const loadAllData = useCallback(async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [
        metricsData,
        revenueResult,
        txBreakdown,
        partnersData,
        usersData,
        withdrawalsData,
      ] = await Promise.all([
        fetchOverviewMetrics(period),
        fetchRevenueData(period),
        fetchTransactionBreakdown(period),
        fetchTopPartners(period, 10),
        fetchTopUsers(period, 10),
        fetchPendingWithdrawals(),
      ]);

      setMetrics(metricsData);
      setRevenueData(revenueResult);
      setTransactionBreakdown(txBreakdown);
      setTopPartners(partnersData);
      setTopUsers(usersData);
      setPendingWithdrawals(withdrawalsData);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, fetchOverviewMetrics, fetchRevenueData, fetchTransactionBreakdown, fetchTopPartners, fetchTopUsers, fetchPendingWithdrawals]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleRefresh = () => {
    loadAllData(true);
  };

  const handlePeriodChange = (newPeriod: FinancePeriod) => {
    setPeriod(newPeriod);
  };

  const handleExportAll = () => {
    // Export overview metrics
    if (metrics) {
      exportToCSV([{
        totalGMV: metrics.totalGMV,
        platformRevenue: metrics.platformRevenue,
        totalTopups: metrics.totalTopups,
        totalWithdrawals: metrics.totalWithdrawals,
        period,
      }], 'financial_overview', [
        { key: 'period', label: 'Ky bao cao' },
        { key: 'totalGMV', label: 'Tong GMV' },
        { key: 'platformRevenue', label: 'Doanh thu Platform' },
        { key: 'totalTopups', label: 'Tong nap tien' },
        { key: 'totalWithdrawals', label: 'Tong rut tien' },
      ]);
    }
  };

  const refreshWithdrawals = async () => {
    const data = await fetchPendingWithdrawals();
    setPendingWithdrawals(data);
  };

  const handleApproveWithdrawal = async (withdrawal: PendingWithdrawal) => {
    await approveWithdrawal(withdrawal);
  };

  const handleRejectWithdrawal = async (withdrawal: PendingWithdrawal, reason: string) => {
    await rejectWithdrawal(withdrawal, reason);
  };

  // Metric cards data
  const metricCards = [
    {
      label: 'Tong GMV',
      value: metrics ? formatCurrency(metrics.totalGMV) : '--',
      description: 'Tong gia tri giao dich',
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      label: 'Doanh thu Platform',
      value: metrics ? formatCurrency(metrics.platformRevenue) : '--',
      description: `${(metrics?.platformFeeRate || 0.15) * 100}% phi dich vu`,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
      borderColor: 'border-green-100',
    },
    {
      label: 'Tong nap tien',
      value: metrics ? formatCurrency(metrics.totalTopups) : '--',
      description: 'User nap vao vi',
      icon: ArrowUpCircle,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      borderColor: 'border-purple-100',
    },
    {
      label: 'Tong rut tien',
      value: metrics ? formatCurrency(metrics.totalWithdrawals) : '--',
      description: 'Da rut thanh cong',
      icon: ArrowDownCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      borderColor: 'border-rose-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bao cao Tai chinh</h1>
          <p className="text-sm text-gray-500 mt-1">Theo doi doanh thu va cac chi so tai chinh</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={cn('w-5 h-5 text-gray-600', refreshing && 'animate-spin')} />
          </button>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium text-sm text-gray-700"
          >
            <Download className="w-4 h-4" />
            Xuat bao cao
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 w-fit">
        <Calendar className="w-5 h-5 text-gray-400 ml-2" />
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handlePeriodChange(option.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-bold transition-all',
              period === option.value
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn(
                'bg-white p-6 rounded-2xl border shadow-sm transition-all hover:shadow-md',
                card.borderColor
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn('p-3 rounded-xl', card.bg)}>
                  <Icon className={cn('w-6 h-6', card.color)} />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                {loading ? (
                  <span className="inline-block w-32 h-8 bg-gray-100 rounded animate-pulse" />
                ) : (
                  card.value
                )}
              </h3>
              <p className="text-xs text-gray-400 mt-2">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} loading={loading} />
        <TransactionSummary data={transactionBreakdown} loading={loading} />
      </div>

      {/* Withdrawal Queue */}
      <WithdrawalQueue
        data={pendingWithdrawals}
        loading={loading}
        onApprove={handleApproveWithdrawal}
        onReject={handleRejectWithdrawal}
        onRefresh={refreshWithdrawals}
      />

      {/* Top Partners & Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPartnersTable data={topPartners} loading={loading} />
        <TopUsersTable data={topUsers} loading={loading} />
      </div>

      {/* Footer note */}
      <div className="text-center py-6 text-sm text-gray-400">
        Du lieu cap nhat luc {new Date().toLocaleString('vi-VN')}
      </div>
    </div>
  );
}
