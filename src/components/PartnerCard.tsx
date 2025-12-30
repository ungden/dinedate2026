'use client';

import { motion } from '@/lib/motion';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Clock, Volume2, Crown } from 'lucide-react';
import { User, ZODIAC_LABELS, PERSONALITY_TAG_LABELS } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';

interface PartnerCardProps {
    partner: User;
    distance?: number; // in km
    className?: string;
}

export default function PartnerCard({ partner, distance, className }: PartnerCardProps) {
    const isOnline = partner.onlineStatus?.isOnline;
    const hourlyRate = partner.hourlyRate || partner.services?.[0]?.price || 0;

    return (
        <Link href={`/user/${partner.id}`}>
            <motion.div
                className={cn(
                    'group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100',
                    className
                )}
                whileHover={{ y: -4 }}
            >
                {/* Image Container - 3:4 Aspect Ratio */}
                <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                        src={partner.images?.[0] || partner.avatar}
                        alt={partner.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                        {/* Online Status */}
                        {isOnline && (
                            <motion.div
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/90 backdrop-blur-sm rounded-full"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                            >
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                <span className="text-white text-xs font-medium">Đang rảnh</span>
                            </motion.div>
                        )}

                        {/* VIP Badge */}
                        {partner.vipStatus.tier !== 'free' && (
                            <div className={cn(
                                'flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm',
                                partner.vipStatus.tier === 'gold' && 'bg-yellow-500/90',
                                partner.vipStatus.tier === 'silver' && 'bg-gray-400/90',
                                partner.vipStatus.tier === 'bronze' && 'bg-orange-600/90',
                                partner.vipStatus.tier === 'platinum' && 'bg-purple-500/90'
                            )}>
                                <Crown className="w-3 h-3 text-white" />
                                <span className="text-white text-xs font-medium capitalize">
                                    {partner.vipStatus.tier}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Voice Intro Badge */}
                    {partner.voiceIntroUrl && (
                        <motion.div
                            className="absolute top-3 right-3 w-8 h-8 bg-primary-500/90 backdrop-blur-sm rounded-full flex items-center justify-center"
                            whileHover={{ scale: 1.1 }}
                        >
                            <Volume2 className="w-4 h-4 text-white" />
                        </motion.div>
                    )}

                    {/* Bottom Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        {/* Name & Age */}
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-bold text-lg">
                                {partner.name}
                            </h3>
                            <span className="text-white/80 text-sm">
                                {partner.birthYear ? new Date().getFullYear() - partner.birthYear : partner.age}
                            </span>
                            {partner.rating && (
                                <div className="flex items-center gap-0.5 ml-auto">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span className="text-white text-sm font-medium">{partner.rating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>

                        {/* Location & Distance */}
                        <div className="flex items-center gap-3 text-white/70 text-sm mb-2">
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate">{partner.location}</span>
                            </div>
                            {distance !== undefined && (
                                <span className="shrink-0">• {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}</span>
                            )}
                        </div>

                        {/* Personality Tags */}
                        {partner.personalityTags && partner.personalityTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {partner.personalityTags.slice(0, 3).map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs"
                                    >
                                        {PERSONALITY_TAG_LABELS[tag]?.split(' ')[0]}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="p-4 bg-white">
                    <div className="flex items-center justify-between">
                        {/* Price */}
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="font-bold text-primary-600">
                                {formatCurrency(hourlyRate)}
                            </span>
                            <span className="text-gray-500 text-sm">/giờ</span>
                        </div>

                        {/* Zodiac */}
                        {partner.zodiac && (
                            <span className="text-sm text-gray-500">
                                {ZODIAC_LABELS[partner.zodiac]?.split(' ')[0]}
                            </span>
                        )}
                    </div>

                    {/* Available tags */}
                    {(partner.availableNow || partner.availableTonight) && (
                        <div className="flex gap-2 mt-2">
                            {partner.availableNow && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                    Rảnh ngay
                                </span>
                            )}
                            {partner.availableTonight && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                    Rảnh tối nay
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </Link>
    );
}
