'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from '@/lib/motion';
import { Calendar, Clock, MapPin, Users, Wallet, Heart, ChevronRight } from 'lucide-react';
import { DateRequest } from '@/types';
import {
  formatCurrency,
  formatDate,
  getActivityIcon,
  getActivityLabel,
  getActivityColor,
  getVIPBadgeColor,
  cn,
} from '@/lib/utils';

interface DateRequestCardProps {
  request: DateRequest;
}

export default function DateRequestCard({ request }: DateRequestCardProps) {
  return (
    <Link href={`/request/${request.id}`}>
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group"
        whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        {/* Cover Image */}
        <div className="relative h-36 overflow-hidden">
          <Image
            src={request.user.avatar}
            alt={request.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Activity Badge */}
          <motion.div
            className={cn(
              'absolute top-3 left-3 px-3 py-1.5 rounded-full text-white text-sm font-medium flex items-center gap-1.5 backdrop-blur-sm',
              getActivityColor(request.activity)
            )}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span>{getActivityIcon(request.activity)}</span>
            <span>{getActivityLabel(request.activity)}</span>
          </motion.div>

          {/* Price Badge */}
          <div className="absolute top-3 right-3">
            <motion.div
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm',
                request.hiringAmount > 0
                  ? 'bg-green-500/90 text-white'
                  : 'bg-white/90 text-gray-700'
              )}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {request.hiringAmount > 0
                ? formatCurrency(request.hiringAmount)
                : 'Miễn phí'}
            </motion.div>
          </div>

          {/* User Info on Image */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
            <div className="relative">
              <Image
                src={request.user.avatar}
                alt={request.user.name}
                width={36}
                height={36}
                className="rounded-full border-2 border-white object-cover"
              />
              {request.user.onlineStatus?.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm truncate">
                  {request.user.name}
                </span>
                {request.user.vipStatus.tier !== 'free' && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 text-[10px] font-bold text-white rounded uppercase',
                      getVIPBadgeColor(request.user.vipStatus.tier)
                    )}
                  >
                    VIP
                  </span>
                )}
              </div>
              <span className="text-white/80 text-xs">{request.user.location}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {request.title}
          </h3>
          <p className="text-gray-500 text-sm line-clamp-2 mb-4 min-h-[2.5rem]">
            {request.description}
          </p>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary-500" />
              </div>
              <span className="truncate">{formatDate(request.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary-500" />
              </div>
              <span>{request.time}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 col-span-2">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary-500" />
              </div>
              <span className="truncate">{request.location}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Participants */}
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {request.currentParticipants}/{request.maxParticipants}
              </span>
            </div>

            {/* Applicants */}
            {request.applicants.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-2">
                  {request.applicants.slice(0, 3).map((applicant, index) => (
                    <Image
                      key={applicant.id}
                      src={applicant.avatar}
                      alt={applicant.name}
                      width={22}
                      height={22}
                      className="rounded-full border-2 border-white"
                      style={{ zIndex: 3 - index }}
                    />
                  ))}
                </div>
                {request.applicants.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{request.applicants.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          <motion.div
            className="flex items-center gap-1 text-primary-500 text-sm font-medium"
            whileHover={{ x: 3 }}
          >
            <span>Chi tiết</span>
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
}
