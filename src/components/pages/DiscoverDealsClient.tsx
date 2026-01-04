'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from '@/lib/motion';
import { Search, Filter, X, Clock, MapPin, Calendar, Loader2 } from 'lucide-react';
import { ActivityType, DateRequest } from '@/types';
import { cn, formatCurrency, formatDate, getActivityIcon, getActivityLabel } from '@/lib/utils';
import RequestCountdown from '@/components/RequestCountdown';
import { useDbDateRequests } from '@/hooks/useDbDateRequests';

const ACTIVITY_OPTIONS: { type: ActivityType; label: string; emoji: string }[] = [
  { type: 'dining', label: 'Ăn uống', emoji: '🍽️' },
  { type: 'cafe', label: 'Cafe', emoji: '☕' },
  { type: 'drinking', label: 'Cafe/Bar', emoji: '🍸' },
  { type: 'movies', label: 'Xem phim', emoji: '🍿' },
  { type: 'karaoke', label: 'Karaoke', emoji: '🎤' },
  { type: 'travel', label: 'Du lịch', emoji: '✈️' },
  { type: 'tour_guide', label: 'Tour guide', emoji: '🗺️' },
];

function DealRowCard({ request }: { request: DateRequest }) {
  return (
    <Link href={`/request/${request.id}`} className="block">
      <motion.div
        className="bg-white rounded-[24px] border border-rose-100 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all p-4"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-2xl flex-shrink-0">
            {getActivityIcon(request.activity)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] font-black text-gray-900 truncate">{request.title}</p>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5 truncate">
                  {getActivityLabel(request.activity)} • {request.user.name}
                </p>
              </div>

              <div className="flex-shrink-0 text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Chi trả</p>
                <p className="text-[14px] font-black text-rose-600">
                  {request.hiringAmount > 0 ? formatCurrency(request.hiringAmount) : 'Miễn phí'}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] font-medium text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-400" />
                {formatDate(request.date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-400" />
                {request.time}
              </span>
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span className="truncate">{request.location}</span>
              </span>
            </div>

            <div className="mt-3">
              <RequestCountdown expiresAt={request.expiresAt} status={request.status} />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function DiscoverDealsClient() {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | 'all'>('all');
  const { requests, loading } = useDbDateRequests(selectedActivity === 'all' ? undefined : selectedActivity);

  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    // Client-side text filter only, DB already filtered by activity
    if (!query.trim()) return requests;
    
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      const hay = `${r.title} ${r.description} ${r.location} ${r.user?.name || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [requests, query]);

  const activeFiltersCount = (selectedActivity !== 'all' ? 1 : 0) + (query.trim() ? 1 : 0);

  return (
    <div className="space-y-6 pb-24 min-h-screen">
      {/* Sticky controls */}
      <div className="sticky top-[60px] z-30 -mx-4 px-4 bg-rose-50/80 backdrop-blur-xl border-b border-rose-200/50 py-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-black text-rose-900/50 uppercase tracking-wider">
            Khám phá deal
          </div>

          {!loading && (
            <div className="text-[12px] font-black text-rose-600 bg-white/60 border border-rose-100 px-3 py-1.5 rounded-full">
              {filtered.length} kết quả
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 group-focus-within:text-rose-600 transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề, địa điểm..."
              className="w-full pl-11 pr-10 py-3 bg-white/70 border border-rose-100 rounded-2xl text-sm focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
            />
            {query.trim() && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl hover:bg-rose-50 flex items-center justify-center text-rose-400 hover:text-rose-600 transition"
                aria-label="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center transition-all relative',
              showFilters || activeFiltersCount > 0
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-white border border-rose-100 text-rose-400 hover:bg-rose-50'
            )}
            aria-label="Bộ lọc"
          >
            <Filter className="w-5 h-5 stroke-[2.5px]" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-rose-600 text-[10px] font-black rounded-full border-2 border-rose-500 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedActivity('all')}
                    className={cn(
                      'px-4 py-2 rounded-2xl font-black text-sm transition border',
                      selectedActivity === 'all'
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-rose-100 hover:bg-rose-50'
                    )}
                  >
                    🌟 Tất cả
                  </button>

                  {ACTIVITY_OPTIONS.map((a) => {
                    const active = selectedActivity === a.type;
                    return (
                      <button
                        key={a.type}
                        onClick={() => setSelectedActivity(active ? 'all' : a.type)}
                        className={cn(
                          'px-4 py-2 rounded-2xl font-black text-sm transition border',
                          active
                            ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/30'
                            : 'bg-white text-gray-700 border-rose-100 hover:bg-rose-50'
                        )}
                      >
                        {a.emoji} {a.label}
                      </button>
                    );
                  })}
                </div>

                {(selectedActivity !== 'all' || query.trim()) && (
                  <button
                    onClick={() => {
                      setSelectedActivity('all');
                      setQuery('');
                    }}
                    className="mt-3 text-sm font-black text-rose-600 hover:text-rose-700 transition"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
            <p className="text-gray-500 mt-2">Đang tải deal...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((r, idx) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <DealRowCard request={r} />
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center">
            <div className="text-6xl mb-4">🔎</div>
            <h3 className="text-lg font-black text-rose-900">Không có deal phù hợp</h3>
            <p className="text-rose-400 text-sm mt-1">Thử đổi từ khóa hoặc bỏ bớt bộ lọc nhé!</p>
          </div>
        )}
      </div>
    </div>
  );
}