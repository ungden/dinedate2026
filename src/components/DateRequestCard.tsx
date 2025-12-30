'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from '@/lib/motion';
import { Calendar, Clock, MapPin, Users, Heart, Sparkles } from 'lucide-react';
import { DateRequest } from '@/types';
import {
  formatCurrency,
  formatDate,
  getActivityIcon,
  getActivityLabel,
  cn,
} from '@/lib/utils';

export default function DateRequestCard({ request }: { request: DateRequest }) {
  return (
    <Link href={`/request/${request.id}`} className="block tap-highlight">
      <div className="ios-card bg-white">
        {/* 1. Immersive Image Area */}
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={request.user.images?.[0] || request.user.avatar}
            alt={request.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Top Overlays */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
             <div className="flex items-center gap-2 p-1.5 bg-white/90 backdrop-blur-md rounded-2xl pr-3 shadow-lg">
                <Image
                    src={request.user.avatar}
                    alt={request.user.name}
                    width={28}
                    height={28}
                    className="rounded-xl object-cover"
                />
                <span className="text-[12px] font-bold text-gray-900">{request.user.name}</span>
             </div>
             
             <button className="w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                <Heart className="w-5 h-5" />
             </button>
          </div>

          {/* Bottom Overlays */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-primary-500 text-white text-[10px] font-black uppercase rounded-lg shadow-sm">
                    {getActivityLabel(request.activity)}
                </span>
                {/* Thay thế hiển thị số lượng 1/3 bằng trạng thái */}
                {request.status === 'active' && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/80 backdrop-blur-md rounded-lg text-white text-[10px] font-bold">
                        <Sparkles className="w-3 h-3" />
                        Đang tìm người
                    </div>
                )}
             </div>
             <h3 className="text-white font-bold text-[18px] leading-tight drop-shadow-md">
                {request.title}
             </h3>
          </div>
        </div>

        {/* 2. Compact Info Bar */}
        <div className="p-4 flex items-center justify-between bg-white">
            <div className="space-y-1">
                <div className="flex items-center gap-3 text-gray-500 text-[12px] font-medium">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-primary-500" />
                        <span>{formatDate(request.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-primary-500" />
                        <span>{request.time}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-[11px]">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[140px]">{request.location}</span>
                </div>
            </div>

            <div className="text-right">
                <p className="text-[11px] text-gray-400 font-medium mb-0.5">Mức chi trả</p>
                <p className="text-[16px] font-black text-gray-900 leading-none">
                    {request.hiringAmount > 0 ? formatCurrency(request.hiringAmount) : 'Miễn phí'}
                </p>
            </div>
        </div>
      </div>
    </Link>
  );
}