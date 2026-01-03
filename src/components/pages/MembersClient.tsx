'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Search,
  MapPin,
  Filter,
  ChevronDown,
  Wallet,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { ActivityType, User } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import PartnerCard from '@/components/PartnerCard';
import SmartFilter from '@/components/SmartFilter';

const LOCATIONS = [
  'Tất cả',
  'Quận 1, TP.HCM',
  'Quận 3, TP.HCM',
  'Quận 7, TP.HCM',
  'Quận 2, TP.HCM',
  'Quận Bình Thạnh, TP.HCM',
  'Quận Phú Nhuận, TP.HCM',
];

type SortMode = 'recommended' | 'available' | 'price_low' | 'rating_high';

function getBaseHourly(u: User) {
  if (u.hourlyRate && u.hourlyRate > 0) return u.hourlyRate;
  const minServicePrice =
    u.services && u.services.length > 0
      ? Math.min(...u.services.map((s) => s.price || 0).filter(Boolean))
      : 0;
  return minServicePrice || 0;
}

export default function MembersClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Tất cả');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>([]);
  const [availableNow, setAvailableNow] = useState(false);
  const [availableTonight, setAvailableTonight] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('recommended');

  const { getAllUsers, currentUser } = useDateStore();
  const allUsers = getAllUsers();

  const partners = useMemo(() => {
    const filtered = allUsers.filter((user) => {
      if (!user.isServiceProvider) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!user.name.toLowerCase().includes(query) && !user.location.toLowerCase().includes(query)) {
          return false;
        }
      }

      if (selectedLocation !== 'Tất cả' && !user.location.includes(selectedLocation.split(',')[0])) return false;

      if (selectedActivities.length > 0) {
        const hasMatchingService = user.services?.some((s) => selectedActivities.includes(s.activity));
        if (!hasMatchingService) return false;
      }

      if (availableNow && !user.availableNow && !user.onlineStatus?.isOnline) return false;
      if (availableTonight && !user.availableTonight) return false;

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortMode === 'available') {
        const aScore = (a.availableNow || a.onlineStatus?.isOnline) ? 1 : 0;
        const bScore = (b.availableNow || b.onlineStatus?.isOnline) ? 1 : 0;
        if (bScore !== aScore) return bScore - aScore;
        return (b.rating ?? 0) - (a.rating ?? 0);
      }

      if (sortMode === 'price_low') {
        return getBaseHourly(a) - getBaseHourly(b);
      }

      if (sortMode === 'rating_high') {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }

      // recommended: VIP first, then rating
      const aVip = a.vipStatus?.tier && a.vipStatus.tier !== 'free' ? 1 : 0;
      const bVip = b.vipStatus?.tier && b.vipStatus.tier !== 'free' ? 1 : 0;
      if (bVip !== aVip) return bVip - aVip;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

    return sorted;
  }, [
    allUsers,
    searchQuery,
    selectedLocation,
    selectedActivities,
    availableNow,
    availableTonight,
    sortMode,
  ]);

  const activeFiltersCount = selectedActivities.length + (availableNow ? 1 : 0) + (availableTonight ? 1 : 0);

  return (
    <div className="space-y-6 pb-24 min-h-screen">
      {/* Sticky header controls - Pink Glass Effect */}
      <div className="sticky top-[60px] z-30 -mx-4 px-4 bg-rose-50/80 backdrop-blur-xl border-b border-rose-200/50 py-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setShowLocationPicker(!showLocationPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 hover:bg-white border border-rose-100 rounded-full text-gray-900 text-[13px] font-black tap-highlight transition-colors"
            >
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>{selectedLocation}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform text-rose-400', showLocationPicker && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {showLocationPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-56 bg-white rounded-3xl shadow-xl shadow-rose-500/10 border border-rose-100 py-3 z-50"
                >
                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setSelectedLocation(loc);
                        setShowLocationPicker(false);
                      }}
                      className={cn(
                        'w-full px-5 py-2.5 text-left text-sm hover:bg-rose-50 transition-colors',
                        selectedLocation === loc ? 'text-rose-600 font-black bg-rose-50' : 'text-gray-600 font-medium'
                      )}
                    >
                      {loc}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 border border-rose-100 rounded-full text-rose-600 text-[13px] font-black shadow-sm">
            <Wallet className="w-3.5 h-3.5" />
            <span>{formatCurrency(currentUser.wallet.balance)}</span>
          </div>
        </div>

        {/* Search + Filter - Pink Theme */}
        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 group-focus-within:text-rose-600 transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm Partner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/70 border border-rose-100 rounded-2xl text-sm focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center transition-all tap-highlight relative',
              showFilters || activeFiltersCount > 0 
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                : 'bg-white border border-rose-100 text-rose-400 hover:bg-rose-50'
            )}
          >
            <Filter className="w-5 h-5 stroke-[2.5px]" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-rose-600 text-[10px] font-black rounded-full border-2 border-rose-500 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Sort row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[12px] font-black text-rose-900/50 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-rose-500" />
            Partner
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs font-black text-rose-400">
              <ArrowUpDown className="w-4 h-4" />
              Sắp xếp:
            </div>

            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="h-9 px-3 rounded-xl bg-white/50 border border-rose-100 text-rose-900 text-xs font-bold outline-none focus:border-rose-300"
            >
              <option value="recommended">Gợi ý</option>
              <option value="available">Rảnh ngay</option>
              <option value="price_low">Giá thấp</option>
              <option value="rating_high">Rating cao</option>
            </select>
          </div>
        </div>

        {/* Smart Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2">
                <SmartFilter
                  selectedActivities={selectedActivities}
                  onActivitiesChange={setSelectedActivities}
                  availableNow={availableNow}
                  onAvailableNowChange={setAvailableNow}
                  availableTonight={availableTonight}
                  onAvailableTonightChange={setAvailableTonight}
                  onClear={() => {
                    setSelectedActivities([]);
                    setAvailableNow(false);
                    setAvailableTonight(false);
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      <div className="px-1 space-y-4">
        <div className="flex flex-col gap-4">
          {partners.length > 0 ? (
            partners.map((partner, idx) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <PartnerCard partner={partner} distance={Math.random() * 5} />
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-black text-rose-900">Không có kết quả</h3>
              <p className="text-rose-400 text-sm mt-1">Thử bỏ bớt bộ lọc xem sao nhé!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}