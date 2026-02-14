'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Restaurant } from '@/types';
import RestaurantCard from '@/components/RestaurantCard';
import { Search, Loader2 } from 'lucide-react';

interface RestaurantPickerProps {
  restaurants: Restaurant[];
  selectedId?: string;
  onSelect: (restaurant: Restaurant) => void;
  loading?: boolean;
}

export default function RestaurantPicker({
  restaurants,
  selectedId,
  onSelect,
  loading = false,
}: RestaurantPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return restaurants;
    const query = search.toLowerCase().trim();
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.area.toLowerCase().includes(query) ||
        r.cuisineTypes.some((c) => c.toLowerCase().includes(query))
    );
  }, [restaurants, search]);

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm nhà hàng, khu vực, loại ẩm thực..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        />
      </div>

      {/* Restaurant grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          <span className="ml-2 text-sm text-gray-500">
            Đang tải nhà hàng...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">
            {search.trim()
              ? 'Không tìm thấy nhà hàng phù hợp'
              : 'Chưa có nhà hàng nào'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              selected={selectedId === restaurant.id}
              onClick={() => onSelect(restaurant)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
