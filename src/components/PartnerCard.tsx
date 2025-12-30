'use client';

import { motion } from '@/lib/motion';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Crown } from 'lucide-react';
import { User } from '@/types';
import { cn, getVIPBadgeColor } from '@/lib/utils';

interface PartnerCardProps {
    partner: User;
    distance?: number; // in km
    className?: string;
}

export default function PartnerCard({ partner, distance, className }: PartnerCardProps) {
    const isOnline = partner.onlineStatus?.isOnline;
    // Mock "Earliest" time availability logic based on online status
    const availabilityText = isOnline ? 'Rảnh ngay' : `Sớm nhất ${new Date(new Date().getTime() + 2 * 60 * 60 * 1000).getHours()}:00`;

    return (
        <Link href={`/user/${partner.id}`} className="block">
            <motion.div
                className={cn(
                    'group relative bg-white rounded-2xl p-3 flex gap-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300',
                    className
                )}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
            >
                {/* Image Section */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
                    <Image
                        src={partner.images?.[0] || partner.avatar}
                        alt={partner.name}
                        fill
                        className="object-cover rounded-xl"
                    />
                    
                    {/* VIP Badge */}
                    {partner.vipStatus.tier !== 'free' && (
                        <div className={cn(
                            'absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase flex items-center gap-0.5 shadow-sm',
                            getVIPBadgeColor(partner.vipStatus.tier)
                        )}>
                            <Crown className="w-2.5 h-2.5" />
                            {partner.vipStatus.tier}
                        </div>
                    )}

                    {/* Online Indicator (Optional overlay) */}
                    {isOnline && (
                        <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                </div>

                {/* Content Section */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                                {partner.name}
                            </h3>
                            
                            {/* Rating */}
                            <div className="flex items-center gap-1 mt-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-sm font-bold text-gray-900">{partner.rating?.toFixed(1) || '5.0'}</span>
                                <span className="text-xs text-gray-500">({partner.reviewCount || 0} đánh giá)</span>
                            </div>

                            {/* Distance / Location */}
                            <div className="flex items-center gap-1 mt-2 text-gray-500 text-sm">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate">{partner.location.split(',')[0]}</span>
                                {distance !== undefined && (
                                    <>
                                        <span className="mx-1">•</span>
                                        <span>{distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex flex-col items-end gap-3 pl-2">
                            <span className={cn(
                                "text-xs font-medium whitespace-nowrap",
                                isOnline ? "text-green-600" : "text-gray-500"
                            )}>
                                {availabilityText}
                            </span>
                            
                            <button className="px-5 py-1.5 bg-gradient-primary text-white text-sm font-semibold rounded-full shadow-primary hover:opacity-90 transition-opacity whitespace-nowrap">
                                Đặt
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}