'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from '@/lib/motion';
import { Calendar, Clock, MapPin, Users, ChevronRight } from 'lucide-react';
import { DateRequest } from '@/types';
import {
  formatCurrency,
  formatDate,
  getActivityIcon,
  getActivityLabel,
  cn,
} from '@/lib/utils';

interface DateRequestCardProps {
  request: DateRequest;
}

export default function DateRequestCard({ request }: DateRequestCardProps) {
  return (
    <Link href={`/request/${request.id}`} className="block">
      <motion.div
        className="card-modern group"
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header: User Info */}
        <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8">
                    <Image
                        src={request.user.avatar}
                        alt={request.user.name}
                        fill
                        className="rounded-full object-cover border border-gray-100"
                    />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{request.user.name}</p>
                    <p className="text-[10px] text-gray-500">{request.user.location}</p>
                </div>
            </div>
            {/* Activity Badge */}
            <div className="px-2.5 py-1 bg-gray-50 rounded-full flex items-center gap-1.5 border border-gray-100">
                <span className="text-xs">{getActivityIcon(request.activity)}</span>
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                    {getActivityLabel(request.activity)}
                </span>
            </div>
        </div>

        {/* Main Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
          <Image
            src={request.user.images?.[0] || request.user.avatar}
            alt={request.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          {/* Price Tag Overlay */}
          <div className="absolute bottom-3 left-3">
             <div className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-white/50 flex items-center gap-1">
                <span className="text-xs font-bold text-gray-900">
                    {request.hiringAmount > 0 ? formatCurrency(request.hiringAmount) : 'Miễn phí'}
                </span>
             </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-900 mb-1.5 leading-snug">
            {request.title}
          </h3>
          <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">
            {request.description}
          </p>

          {/* Info Pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-medium text-gray-600">
                <Calendar className="w-3.5 h-3.5 text-primary-500" />
                {formatDate(request.date)}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-medium text-gray-600">
                <Clock className="w-3.5 h-3.5 text-primary-500" />
                {request.time}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-medium text-gray-600">
                <Users className="w-3.5 h-3.5 text-primary-500" />
                {request.currentParticipants}/{request.maxParticipants}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
             <div className="flex items-center gap-1 text-gray-400 text-xs">
                <MapPin className="w-3.5 h-3.5" />
                <span className="line-clamp-1 max-w-[150px]">{request.location}</span>
             </div>
             <div className="text-primary-600 text-xs font-bold flex items-center gap-0.5">
                Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
             </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}