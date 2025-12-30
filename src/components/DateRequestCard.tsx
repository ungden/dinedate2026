'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { DateRequest } from '@/types';
import {
  formatCurrency,
  formatDate,
  getActivityLabel,
} from '@/lib/utils';

export default function DateRequestCard({ request }: { request: DateRequest }) {
  return (
    <Link href={`/request/${request.id}`} className="block group">
      <div className="bg-white rounded-[32px] overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 border border-gray-100/50">
        {/* Immersive Image Area */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={request.user.images?.[0] || request.user.avatar}
            alt={request.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          {/* Cinematic Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Top Badge */}
          <div className="absolute top-4 left-4">
             <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white text-xs font-bold shadow-lg">
                {getActivityLabel(request.activity)}
             </div>
          </div>

          {/* User Floating Badge */}
          <div className="absolute top-4 right-4 p-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-full">
             <Image
                src={request.user.avatar}
                alt={request.user.name}
                width={32}
                height={32}
                className="rounded-full border border-white"
             />
          </div>

          {/* Bottom Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
             <h3 className="text-xl font-black leading-tight mb-2 drop-shadow-md line-clamp-2">
                {request.title}
             </h3>
             
             <div className="flex items-center gap-3 text-white/90 text-xs font-medium mb-3">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 opacity-80" />
                    <span>{formatDate(request.date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 opacity-80" />
                    <span>{request.time}</span>
                </div>
             </div>

             <div className="flex items-center justify-between pt-3 border-t border-white/20">
                <div className="flex items-center gap-1.5 text-white/80 text-xs max-w-[60%]">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{request.location}</span>
                </div>
                <div className="text-right">
                    <span className="block text-[10px] text-white/70 font-bold uppercase tracking-wider">Chi trả</span>
                    <span className="text-sm font-black text-white">
                        {request.hiringAmount > 0 ? formatCurrency(request.hiringAmount) : 'Miễn phí'}
                    </span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </Link>
  );
}