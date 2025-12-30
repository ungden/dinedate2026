'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Search,
  MapPin,
  Filter,
  X,
  ChevronDown,
  Wallet
} from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore'
import { ActivityType } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import PartnerCard from '@/components/PartnerCard';
import SmartFilter from '@/components/SmartFilter';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3 },
  },
};

// Location options
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

  // Filter only service providers (Partners)
  const partners = useMemo(() => {
    return allUsers.filter((user) => {
      // Only show service providers
      if (!user.isServiceProvider) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !user.name.toLowerCase().includes(query) &&
          !user.location.toLowerCase().includes(query) &&
          !user.bio.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Location filter
      if (selectedLocation !== 'Tất cả' && !user.location.includes(selectedLocation.split(',')[0])) {
        return false;
      }

      // Activity filter
      if (selectedActivities.length > 0) {
        const hasMatchingService = user.services?.some((s) =>
          selectedActivities.includes(s.activity)
        );
        if (!hasMatchingService) return false;
      }

      // Availability filters
      if (availableNow && !user.availableNow && !user.onlineStatus?.isOnline) {
        return false;
      }
      if (availableTonight && !user.availableTonight) {
        return false;
      }

      return true;
    });
  }, [allUsers, searchQuery, selectedLocation, selectedActivities, availableNow, availableTonight]);

  const activeFiltersCount = selectedActivities.length + (availableNow ? 1 : 0) + (availableTonight ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedActivities([]);
    setAvailableNow(false);
    setAvailableTonight(false);
    setSelectedLocation('Tất cả');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header with Location & Wallet */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Location Picker */}
        <div className="relative">
          <button
            onClick={() => setShowLocationPicker(!showLocationPicker)}
            className="flex items-center gap-2 text-gray-900 font-semibold hover:text-primary-600 transition-colors"
          >
            <MapPin className="w-5 h-5 text-primary-500" />
            <span>{selectedLocation}</span>
            <ChevronDown className={cn(
              'w-4 h-4 transition-transform',
              showLocationPicker && 'rotate-180'
            )} />
          </button>

          <AnimatePresence>
            {showLocationPicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
              >
                {LOCATIONS.map((location) => (
                  <button
                    key={location}
                    onClick={() => {
                      setSelectedLocation(location);
                      setShowLocationPicker(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors',
                      selectedLocation === location && 'bg-primary-50 text-primary-600 font-medium'
                    )}
                  >
                    {location}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Wallet Balance */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl">
          <Wallet className="w-4 h-4" />
          <span className="font-semibold">{formatCurrency(currentUser.wallet.balance)}</span>
        </div>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'relative flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium transition-all',
              showFilters || activeFiltersCount > 0
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            )}
            whileTap={{ scale: 0.95 }}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Bộ lọc</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 bg-white text-primary-600 text-xs font-bold rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </motion.button>
        </div>

        {/* Smart Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <SmartFilter
                  selectedActivities={selectedActivities}
                  onActivitiesChange={setSelectedActivities}
                  availableNow={availableNow}
                  onAvailableNowChange={setAvailableNow}
                  availableTonight={availableTonight}
                  onAvailableTonightChange={setAvailableTonight}
                  onClear={clearAllFilters}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results Count */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-gray-600">
          Tìm thấy <span className="font-semibold text-gray-900">{partners.length}</span> Partner
        </p>
      </motion.div>

      {/* Partners List - Single Column */}
      {partners.length > 0 ? (
        <motion.div
          className="flex flex-col gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {partners.map((partner, index) => (
            <motion.div
              key={partner.id}
              variants={itemVariants}
              style={{
                transitionDelay: `${index * 0.05}s`
              }}
            >
              <PartnerCard
                partner={partner}
                distance={Math.random() * 10} // Mock distance
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="text-center py-16 bg-white rounded-2xl border border-gray-100"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💫
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Không tìm thấy Partner phù hợp
          </h3>
          <p className="text-gray-600 mb-4 max-w-sm mx-auto">
            Thử điều chỉnh bộ lọc hoặc mở rộng phạm vi tìm kiếm
          </p>
          {activeFiltersCount > 0 && (
            <motion.button
              onClick={clearAllFilters}
              className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Xóa tất cả bộ lọc
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
}