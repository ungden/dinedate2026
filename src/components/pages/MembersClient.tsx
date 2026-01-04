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
  Navigation,
  Loader2,
  X
} from 'lucide-react';
import { ActivityType, User } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import PartnerCard from '@/components/PartnerCard';
import SmartFilter from '@/components/SmartFilter';
import { useDbPartners } from '@/hooks/useDbPartners';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const LOCATIONS = [
  'Tất cả',
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Cần Thơ',
  'Hải Phòng',
  'Quận 1, TP.HCM',
  'Quận 3, TP.HCM',
  'Quận 7, TP.HCM',
  'Quận 2, TP.HCM',
  'Quận Bình Thạnh, TP.HCM',
];

type SortMode = 'recommended' | 'distance' | 'available' | 'price_low' | 'rating_high';

function getBaseHourly(u: User) {
  if (u.hourlyRate && u.hourlyRate > 0) return u.hourlyRate;
  const minServicePrice =
    u.services && u.services.length > 0
      ? Math.min(...u.services.map((s) => s.price || 0).filter(Boolean))
      : 0;
  return minServicePrice || 0;
}

export default function MembersClient() {
  const { user: authUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Tất cả');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>([]);
  const [availableNow, setAvailableNow] = useState(false);
  const [availableTonight, setAvailableTonight] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('recommended');

  const { users: dbPartners, loading } = useDbPartners({
    search: searchQuery,
    location: selectedLocation,
    coords: gpsCoords
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ định vị');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setSelectedLocation('Gần tôi (50km)');
        setSortMode('distance'); // Tự động chuyển sang sắp xếp gần nhất
        setIsLocating(false);
        setShowLocationPicker(false);
      },
      (err) => {
        console.error(err);
        toast.error('Không thể lấy vị trí. Hãy kiểm tra quyền truy cập.');
        setIsLocating(false);
        // Nếu lỗi, quay về mặc định
        if (sortMode === 'distance') setSortMode('recommended');
      }
    );
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value as SortMode;
    setSortMode(mode);

    if (mode === 'distance') {
      if (!gpsCoords) {
        handleGetLocation();
      }
    }
  };

  const clearGps = () => {
    setGpsCoords(null);
    setSelectedLocation('Tất cả');
    if (sortMode === 'distance') setSortMode('recommended');
  };

  const partners = useMemo(() => {
    const filtered = dbPartners.filter((user) => {
      if (selectedActivities.length > 0) {
        const hasMatchingService = user.services?.some((s) => selectedActivities.includes(s.activity));
        if (!hasMatchingService) return false;
      }

      if (availableNow && !user.availableNow && !user.onlineStatus?.isOnline) return false;
      if (availableTonight && !user.availableTonight) return false;

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortMode === 'distance') {
        // Ưu tiên khoảng cách nếu có dữ liệu distance
        const distA = a.distance ?? 999999;
        const distB = b.distance ?? 999999;
        if (distA !== distB) return distA - distB;
      }

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
    dbPartners,
    selectedActivities,
    availableNow,
    availableTonight,
    sortMode
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
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-black tap-highlight transition-colors border",
                gpsCoords 
                  ? "bg-blue-50 border-blue-200 text-blue-600" 
                  : "bg-white/60 border-rose-100 text-gray-900 hover:bg-white"
              )}
            >
              {gpsCoords ? <Navigation className="w-3.5 h-3.5 fill-blue-600" /> : <MapPin className="w-4 h-4 text-rose-500" />}
              <span className="max-w-[120px] truncate">{selectedLocation}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform text-rose-400', showLocationPicker && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {showLocationPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-64 bg-white rounded-3xl shadow-xl shadow-rose-500/10 border border-rose-100 py-2 z-50 overflow-hidden"
                >
                  <button
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="w-full px-5 py-3 text-left text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 flex items-center gap-2 transition-colors border-b border-rose-50"
                  >
                    {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                    Tìm quanh đây
                  </button>

                  <div className="max-h-[300px] overflow-y-auto">
                    {gpsCoords && (
                      <button
                        onClick={clearGps}
                        className="w-full px-5 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-2"
                      >
                        <X className="w-4 h-4" /> Bỏ định vị GPS
                      </button>
                    )}
                    
                    {LOCATIONS.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => {
                          setSelectedLocation(loc);
                          setGpsCoords(null);
                          setShowLocationPicker(false);
                        }}
                        className={cn(
                          'w-full px-5 py-2.5 text-left text-sm hover:bg-rose-50 transition-colors',
                          selectedLocation === loc && !gpsCoords ? 'text-rose-600 font-black bg-rose-50' : 'text-gray-600 font-medium'
                        )}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 border border-rose-100 rounded-full text-rose-600 text-[13px] font-black shadow-sm">
            <Wallet className="w-3.5 h-3.5" />
            <span>{formatCurrency(authUser?.wallet.balance || 0)}</span>
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
            {sortMode === 'distance' ? 'Gần bạn nhất' : 'Partner nổi bật'}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs font-black text-rose-400">
              <ArrowUpDown className="w-4 h-4" />
              Sắp xếp:
            </div>

            <select
              value={sortMode}
              onChange={handleSortChange}
              className="h-9 px-3 rounded-xl bg-white/50 border border-rose-100 text-rose-900 text-xs font-bold outline-none focus:border-rose-300"
            >
              <option value="recommended">Gợi ý</option>
              <option value="distance">📍 Gần nhất</option>
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
          {loading ? (
            <div className="py-20 text-center text-gray-500 font-medium flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-2" />
              Đang tải Partner...
            </div>
          ) : partners.length > 0 ? (
            partners.map((partner, idx) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <PartnerCard partner={partner} distance={partner.distance ?? undefined} />
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-black text-rose-900">Không có kết quả</h3>
              <p className="text-rose-400 text-sm mt-1">
                {gpsCoords ? 'Không tìm thấy ai trong bán kính 50km.' : 'Thử bỏ bớt bộ lọc xem sao nhé!'}
              </p>
              {gpsCoords && (
                <button 
                  onClick={clearGps}
                  className="mt-4 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-sm shadow-sm"
                >
                  Xem tất cả khu vực
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}