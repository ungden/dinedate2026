'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from '@/lib/motion';
import { Search, ArrowLeft, Loader2, MapPin, UtensilsCrossed, Clock, Users } from 'lucide-react';
import { useDateOrders } from '@/hooks/useDateOrders';
import { useRestaurants } from '@/hooks/useRestaurants';
import { CUISINE_LABELS, CUISINE_ICONS, CuisineType } from '@/types';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

type TabType = 'date_orders' | 'restaurants';

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabType>('date_orders');
  const [cuisineFilter, setCuisineFilter] = useState<CuisineType | ''>('');
  const [cityFilter, setCityFilter] = useState('');

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Sync URL
  useEffect(() => {
    if (debouncedQuery) {
      router.replace(`/search?q=${encodeURIComponent(debouncedQuery)}`);
    } else {
      router.replace('/search');
    }
  }, [debouncedQuery, router]);

  const { dateOrders, loading: loadingOrders } = useDateOrders({ status: 'active' });
  const { restaurants, loading: loadingRestaurants } = useRestaurants();

  const loading = activeTab === 'date_orders' ? loadingOrders : loadingRestaurants;

  // Filter date orders
  const filteredOrders = useMemo(() => {
    let results = dateOrders;
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      results = results.filter(
        (o) =>
          o.description?.toLowerCase().includes(q) ||
          o.restaurant?.name?.toLowerCase().includes(q) ||
          o.combo?.name?.toLowerCase().includes(q) ||
          o.creator?.name?.toLowerCase().includes(q)
      );
    }
    if (cuisineFilter) {
      results = results.filter(
        (o) => o.restaurant?.cuisineTypes?.includes(cuisineFilter)
      );
    }
    if (cityFilter) {
      results = results.filter(
        (o) => o.restaurant?.city?.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }
    return results;
  }, [dateOrders, debouncedQuery, cuisineFilter, cityFilter]);

  // Filter restaurants
  const filteredRestaurants = useMemo(() => {
    let results = restaurants;
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      results = results.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.area?.toLowerCase().includes(q)
      );
    }
    if (cuisineFilter) {
      results = results.filter(
        (r) => r.cuisineTypes?.includes(cuisineFilter)
      );
    }
    if (cityFilter) {
      results = results.filter(
        (r) => r.city?.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }
    return results;
  }, [restaurants, debouncedQuery, cuisineFilter, cityFilter]);

  const cuisineOptions = Object.entries(CUISINE_LABELS) as [CuisineType, string][];

  return (
    <div className="max-w-2xl mx-auto space-y-6 min-h-screen pb-20">
      {/* Header with Search Input */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 -mx-4 px-4 py-3 safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tim nha hang, mon an, date order..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setActiveTab('date_orders')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              activeTab === 'date_orders'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Date Orders
          </button>
          <button
            onClick={() => setActiveTab('restaurants')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              activeTab === 'restaurants'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Nha hang
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar">
          <select
            value={cuisineFilter}
            onChange={(e) => setCuisineFilter(e.target.value as CuisineType | '')}
            className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none"
          >
            <option value="">Tat ca mon</option>
            {cuisineOptions.map(([key, label]) => (
              <option key={key} value={key}>
                {CUISINE_ICONS[key]} {label}
              </option>
            ))}
          </select>
          <input
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            placeholder="Thanh pho..."
            className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none w-32"
          />
        </div>
      </div>

      {/* Results */}
      <div className="px-1">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
            <p className="text-gray-500 mt-2 text-sm">Dang tim kiem...</p>
          </div>
        ) : activeTab === 'date_orders' ? (
          /* Date Orders Results */
          filteredOrders.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-500 px-2">
                Tim thay {filteredOrders.length} date order
              </p>
              {filteredOrders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link href={`/date-order/${order.id}`}>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        {order.restaurant?.logoUrl && (
                          <img
                            src={order.restaurant.logoUrl}
                            alt={order.restaurant.name}
                            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">
                            {order.restaurant?.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                            {order.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <UtensilsCrossed className="w-3.5 h-3.5" />
                              {order.combo?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {order.restaurant?.area}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {order.applicantCount} ung vien
                            </span>
                          </div>
                          <p className="text-sm font-bold text-primary-600 mt-2">
                            {formatCurrency(order.comboPrice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🍽️</div>
              <h3 className="text-lg font-bold text-gray-900">Khong tim thay date order</h3>
              <p className="text-gray-500 text-sm mt-1">Thu tu khoa khac hoac tao date order moi!</p>
            </div>
          )
        ) : (
          /* Restaurants Results */
          filteredRestaurants.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-500 px-2">
                Tim thay {filteredRestaurants.length} nha hang
              </p>
              {filteredRestaurants.map((restaurant, idx) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link href={`/restaurant/${restaurant.id}`}>
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                      {restaurant.coverImageUrl && (
                        <img
                          src={restaurant.coverImageUrl}
                          alt={restaurant.name}
                          className="w-full h-36 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900">{restaurant.name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                          {restaurant.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {restaurant.cuisineTypes?.map((ct) => (
                            <span
                              key={ct}
                              className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600"
                            >
                              {CUISINE_ICONS[ct]} {CUISINE_LABELS[ct]}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {restaurant.area}, {restaurant.city}
                          </span>
                          {restaurant.averageRating && (
                            <span className="text-yellow-500 font-bold">
                              ★ {restaurant.averageRating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🏪</div>
              <h3 className="text-lg font-bold text-gray-900">Khong tim thay nha hang</h3>
              <p className="text-gray-500 text-sm mt-1">Thu tu khoa hoac bo loc khac nhe!</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
