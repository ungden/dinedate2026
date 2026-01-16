'use client';

import { formatCurrency } from '@/lib/utils';
import { TopPartner, exportToCSV } from '@/hooks/useFinancialReports';
import { Crown, Star, Download, Users, TrendingUp } from 'lucide-react';
import Image from 'next/image';

interface TopPartnersTableProps {
  data: TopPartner[];
  loading?: boolean;
}

export function TopPartnersTable({ data, loading }: TopPartnersTableProps) {
  const handleExport = () => {
    exportToCSV(data, 'top_partners', [
      { key: 'name', label: 'Ten Partner' },
      { key: 'totalBookings', label: 'Tong Booking' },
      { key: 'totalEarnings', label: 'Tong Thu nhap' },
      { key: 'rating', label: 'Danh gia' },
      { key: 'reviewCount', label: 'So review' },
    ]);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
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
          <div className="p-3 bg-amber-50 rounded-xl">
            <TrendingUp className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Top Partner</h3>
            <p className="text-sm text-gray-500">Theo doanh thu</p>
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
          <div className="p-3 bg-amber-50 rounded-xl">
            <TrendingUp className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Top 10 Partner</h3>
            <p className="text-sm text-gray-500">Theo doanh thu</p>
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
            <p>Chua co du lieu Partner</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((partner, index) => (
            <div
              key={partner.id}
              className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                index < 3 ? 'bg-gradient-to-r from-amber-50 to-transparent' : 'hover:bg-gray-50'
              }`}
            >
              {/* Rank */}
              {getRankBadge(index + 1)}

              {/* Avatar */}
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 relative flex-shrink-0">
                <Image
                  src={partner.avatar}
                  alt={partner.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{partner.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-500">{partner.totalBookings} booking</span>
                  {partner.rating > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-amber-600">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {partner.rating} ({partner.reviewCount})
                    </span>
                  )}
                </div>
              </div>

              {/* Earnings */}
              <div className="text-right flex-shrink-0">
                <p className="font-black text-gray-900">{formatCurrency(partner.totalEarnings)}</p>
                <p className="text-xs text-gray-500">Thu nhap</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
