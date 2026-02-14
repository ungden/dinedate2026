'use client';

import { cn, getCuisineIcon, getCuisineLabel } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { Restaurant } from '@/types';
import { Star, MapPin } from 'lucide-react';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick?: () => void;
  selected?: boolean;
}

export default function RestaurantCard({
  restaurant,
  onClick,
  selected = false,
}: RestaurantCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl overflow-hidden shadow-sm border cursor-pointer transition-colors',
        selected
          ? 'border-primary-500 ring-2 ring-primary-500/20'
          : 'border-gray-100 hover:border-primary-200'
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
        {restaurant.coverImageUrl ? (
          <img
            src={restaurant.coverImageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
            <span className="text-4xl">
              {restaurant.cuisineTypes[0]
                ? getCuisineIcon(restaurant.cuisineTypes[0])
                : '🍽️'}
            </span>
          </div>
        )}

        {/* Logo overlay */}
        {restaurant.logoUrl && (
          <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl bg-white shadow-md overflow-hidden border border-gray-100">
            <img
              src={restaurant.logoUrl}
              alt={`${restaurant.name} logo`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1 mb-1.5">
          {restaurant.name}
        </h3>

        {/* Cuisine Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {restaurant.cuisineTypes.slice(0, 3).map((cuisine) => (
            <span
              key={cuisine}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium"
            >
              <span className="text-[10px]">{getCuisineIcon(cuisine)}</span>
              {getCuisineLabel(cuisine)}
            </span>
          ))}
        </div>

        {/* Area + Rating row */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">{restaurant.area}</span>
          </div>

          {restaurant.averageRating != null && (
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-gray-700">
                {restaurant.averageRating.toFixed(1)}
              </span>
              {restaurant.reviewCount != null && (
                <span className="text-gray-400">
                  ({restaurant.reviewCount})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
