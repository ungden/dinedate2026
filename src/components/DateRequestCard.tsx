'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, UtensilsCrossed } from 'lucide-react';
import { DateOrder } from '@/types';
import {
  formatCurrency,
  formatDate,
  getCuisineLabel,
  getCuisineIcon,
} from '@/lib/utils';

function DateRequestCard({ order }: { order: DateOrder }) {
  const cuisineType = order.restaurant?.cuisineTypes?.[0];

  return (
    <Link href={`/order/${order.id}`} className="block group">
      <div className="bg-white rounded-[32px] overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 border border-gray-100/50">
        {/* Immersive Image Area */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={order.restaurant?.coverImageUrl || order.creator?.avatar || '/placeholder-restaurant.jpg'}
            alt={order.restaurant?.name || 'Restaurant'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          {/* Cinematic Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Top Badge */}
          <div className="absolute top-4 left-4">
             <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white text-xs font-bold shadow-lg">
                {cuisineType ? `${getCuisineIcon(cuisineType)} ${getCuisineLabel(cuisineType)}` : '🍽️ Ẩm thực'}
             </div>
          </div>

          {/* User Floating Badge */}
          {order.creator && (
            <div className="absolute top-4 right-4 p-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-full">
               <Image
                  src={order.creator.avatar}
                  alt={order.creator.name}
                  width={32}
                  height={32}
                  className="rounded-full border border-white"
               />
            </div>
          )}

          {/* Bottom Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
             <h3 className="text-xl font-black leading-tight mb-2 drop-shadow-md line-clamp-2">
                {order.restaurant?.name || 'Nhà hàng'}
             </h3>
             
             {order.combo && (
               <p className="text-sm text-white/80 mb-2 line-clamp-1">
                 {order.combo.name}
               </p>
             )}

             <div className="flex items-center gap-3 text-white/90 text-xs font-medium mb-3">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 opacity-80" />
                    <span>{formatDate(order.dateTime)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 opacity-80" />
                    <span>{new Date(order.dateTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
             </div>

             <div className="flex items-center justify-between pt-3 border-t border-white/20">
                <div className="flex items-center gap-1.5 text-white/80 text-xs max-w-[60%]">
                    <UtensilsCrossed className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{order.restaurant?.address || ''}</span>
                </div>
                <div className="text-right">
                    <span className="block text-[10px] text-white/70 font-bold uppercase tracking-wider">Combo</span>
                    <span className="text-sm font-black text-white">
                        {formatCurrency(order.comboPrice)}
                    </span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default memo(DateRequestCard);
