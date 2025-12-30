'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Search,
  MapPin,
  Filter,
  X,
  ChevronDown,
  Wallet,
  Sparkles
} from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore'
import { ActivityType } from '@/types';
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

export default function MembersClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Tất cả');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>([]);
  const [availableNow, setAvailableNow] = useState(false);
  const [availableTonight, setAvailableTonight] = useState(false);

  const { getAllUsers, currentUser } = useDateStore();
  const allUsers = getAllUsers();

  const partners = useMemo(() => {
    return allUsers.filter((user) => {
      if (!user.isServiceProvider) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!user.name.toLowerCase().includes(query) && !user.location.toLowerCase().includes(query)) return false;
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
  }, [allUsers, searchQuery, selectedLocation, selectedActivities, availableNow, availableTonight]);

  const activeFiltersCount = selectedActivities.length + (availableNow ? 1 : 0) + (availableTonight ? 1 : 0);

  return (
    <div className="space-y-6 pb-24 bg-mesh min-h-screen">
      {/* 1. Sticky Header Controls */}
      <div className="sticky top-[60px] z-30 -mx-4 px-4 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 py-4 space-y-4">
        <div className="flex items-center justify-between">
            <div className="relative">
                <button
                    onClick={() => setShowLocationPicker(!showLocationPicker)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-gray-900 text-[13px] font-bold tap-highlight"
                >
                    <MapPin className="w-4 h-4 text-primary-500" />
                    <span>{selectedLocation}</span>
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showLocationPicker && 'rotate-180')} />
                </button>

                <AnimatePresence>
                    {showLocationPicker && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-gray-100 py-3 z-50"
                        >
                            {LOCATIONS.map((loc) => (
                                <button
                                    key={loc}
                                    onClick={() => { setSelectedLocation(loc); setShowLocationPicker(false); }}
                                    className={cn(
                                        'w-full px-5 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors',
                                        selectedLocation === loc ? 'text-primary-600 font-black bg-primary-50/50' : 'text-gray-600 font-medium'
                                    )}
                                >
                                    {loc}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full text-white text-[13px] font-black shadow-lg shadow-primary-500/20">
                <Wallet className="w-3.5 h-3.5" />
                <span>{formatCurrency(currentUser.wallet.balance)}</span>
            </div>
        </div>

        {/* 2. Search Area */}
        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm Partner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ios-input pl-11 py-3 text-sm"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center transition-all tap-highlight relative',
              showFilters || activeFiltersCount > 0 ? 'bg-primary-500 text-white shadow-lg' : 'bg-gray-100 text-gray-500'
            )}
          >
            <Filter className="w-5 h-5 stroke-[2.5px]" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-primary-500 text-[10px] font-black rounded-full border-2 border-primary-500 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* 3. Smart Filter Panel */}
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
                  onClear={() => { setSelectedActivities([]); setAvailableNow(false); setAvailableTonight(false); }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Results */}
      <div className="px-1 space-y-4">
        <div className="flex items-center gap-2 px-2">
            <Sparkles className="w-4 h-4 text-primary-500" />
            <p className="text-[15px] font-black text-gray-900 uppercase tracking-widest">Partner hàng đầu</p>
        </div>

        <div className="flex flex-col gap-4">
          {partners.length > 0 ? (
            partners.map((partner, idx) => (
                <motion.div
                    key={partner.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                >
                    <PartnerCard partner={partner} distance={Math.random() * 5} />
                </motion.div>
            ))
          ) : (
            <div className="py-20 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-black text-gray-900">Không có kết quả</h3>
              <p className="text-gray-400 text-sm mt-1">Thử bỏ bớt bộ lọc xem sao nhé!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}