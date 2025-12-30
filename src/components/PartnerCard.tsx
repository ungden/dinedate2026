'use client';

import { motion } from '@/lib/motion';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Crown, ChevronRight, Clock } from 'lucide-react';
import { User } from '@/types';
import { cn, getVIPBadgeColor, formatCurrency } from '@/lib/utils';

interface PartnerCardProps {
    partner: User;
    distance?: number;
}

export default function PartnerCard({ partner, distance }: PartnerCardProps) {
    const isOnline = partner.onlineStatus?.isOnline;

    return (
        <Link href={`/user/${partner.id}`} className="block tap-highlight">
            <div className="ios-card p-4 flex gap-4 bg-white relative">
                {/* 1. Image Holder with High-end Badge */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
                    <Image
                        src={partner.images?.[0] || partner.avatar}
                        alt={partner.name}
                        fill
                        className="object-cover rounded-2xl shadow-sm"
                    />
                    {isOnline && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full z-10 shadow-sm" />
                    )}
                </div>

                {/* 2. Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[17px] font-bold text-gray-900 truncate pr-2">
                                {partner.name}
                            </h3>
                            {partner.vipStatus.tier !== 'free' && (
                                <span className={cn(
                                    "px-2 py-0.5 rounded-lg text-[10px] font-black text-white uppercase tracking-tighter",
                                    getVIPBadgeColor(partner.vipStatus.tier)
                                )}>
                                    {partner.vipStatus.tier}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 rounded-lg">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                <span className="text-[12px] font-bold text-yellow-700">{partner.rating?.toFixed(1) || '5.0'}</span>
                            </div>
                            <span className="text-[12px] text-gray-400">•</span>
                            <div className="flex items-center gap-1 text-gray-500">
                                <MapPin className="w-3 h-3" />
                                <span className="text-[12px] truncate">{partner.location.split(',')[0]}</span>
                            </div>
                        </div>

                        <p className="text-[13px] text-gray-500 line-clamp-1 italic mb-2">
                            &quot;{partner.bio}&quot;
                        </p>
                    </div>

                    {/* 3. Bottom Row: Price & Action */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                            <span className="text-[16px] font-black text-primary-600">
                                {formatCurrency(partner.hourlyRate || 0)}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium">/giờ</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-primary-600 font-bold text-[13px]">
                            Chi tiết <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}