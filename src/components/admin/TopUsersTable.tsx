'use client';

import { formatCurrency } from '@/lib/utils';
import { TopUser, exportToCSV } from '@/hooks/useFinancialReports';
import { ShoppingBag, Download, Users, Crown, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface TopUsersTableProps {
  data: TopUser[];
  loading?: boolean;
}

export function TopUsersTable({ data, loading }: TopUsersTableProps) {
  const handleExport = () => {
    exportToCSV(data, 'top_users', [
      { key: 'name', label: 'Ten User' },
      { key: 'totalBookings', label: 'Tong Booking' },
      { key: 'totalSpent', label: 'Tong chi tieu' },
      { key: 'vipTier', label: 'VIP Tier' },
    ]);
  };

  const getVIPBadge = (tier: string) => {
    switch (tier) {
      case 'svip':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold rounded-full">
            <Sparkles className="w-3 h-3" />
            SVIP
          </span>
        );
      case 'vip':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
            <Crown className="w-3 h-3" />
            VIP
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
            Free
          </span>
        );
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
          <Crown className="w-4 h-4 text-white" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
          <span className="text-sm font-bold text-white">2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
          <span className="text-sm font-bold text-white">3</span>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-500">{rank}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-rose-50 rounded-xl">
            <ShoppingBag className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Top User</h3>
            <p className="text-sm text-gray-500">Theo chi tieu</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 rounded-xl">
            <ShoppingBag className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Top 10 User</h3>
            <p className="text-sm text-gray-500">Theo chi tieu</p>
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

      {data.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p>Chua co du lieu User</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                index < 3 ? 'bg-gradient-to-r from-rose-50 to-transparent' : 'hover:bg-gray-50'
              }`}
            >
              {/* Rank */}
              {getRankBadge(index + 1)}

              {/* Avatar */}
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 relative flex-shrink-0">
                <Image
                  src={user.avatar}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 truncate">{user.name}</p>
                  {getVIPBadge(user.vipTier)}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{user.totalDateOrders} đơn hẹn</p>
              </div>

              {/* Spent */}
              <div className="text-right flex-shrink-0">
                <p className="font-black text-gray-900">{formatCurrency(user.totalSpent)}</p>
                <p className="text-xs text-gray-500">Chi tieu</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
