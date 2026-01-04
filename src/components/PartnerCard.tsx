'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, BadgeCheck, Sparkles, Zap } from 'lucide-react';
import { User } from '@/types';
import { cn, getVIPBadgeColor, isNewPartner, isQualityPartner } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

function PartnerCard({ partner, distance }: { partner: User; distance?: number }) {
  const { user: currentUser } = useAuth();
  const isOnline = !!partner.onlineStatus?.isOnline;
  const isVip = partner.vipStatus?.tier && partner.vipStatus.tier !== 'free';
  const imageSrc = partner.images?.[0] || partner.avatar;

  const isNew = isNewPartner(partner.createdAt);
  const isQuality = isQualityPartner(partner.rating, partner.reviewCount);

  // VIP Logic to see age
  const canSeeAge = currentUser?.vipStatus.tier === 'vip' || currentUser?.vipStatus.tier === 'svip';
  const displayAge = canSeeAge && partner.age ? `, ${partner.age}` : '';

  return (
    <Link href={`/user/${partner.id}`} className="block group">
      <div className="card-premium p-3 flex gap-4 items-center bg-white group-hover:border-primary-100 transition-all">
        {/* Avatar Section */}
        <div className="relative flex-shrink-0">
          <div className="w-[88px] h-[88px] rounded-[20px] overflow-hidden bg-gray-100 relative">
            <Image 
                src={imageSrc} 
                alt={partner.name} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500" 
            />
          </div>

          {/* Status Badge */}
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 bg-white p-[2px] rounded-full">
                <span className="block w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0 py-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="text-[17px] font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                    {partner.name}{displayAge}
                </h3>
                {isVip && (
                    <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-50 flex-shrink-0" />
                )}
                {isNew && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-600 flex-shrink-0">
                      Mới
                    </span>
                )}
                {isQuality && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-orange-100 text-orange-600 flex items-center gap-0.5 flex-shrink-0">
                      <Zap className="w-2.5 h-2.5 fill-orange-600" /> Uy tín
                    </span>
                )}
            </div>
            
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg flex-shrink-0">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-bold text-yellow-700">{(partner.rating ?? 5.0).toFixed(1)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2.5">
            <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="truncate max-w-[100px]">{partner.location?.split(',')[0] || 'TP.HCM'}</span>
            </div>
            {typeof distance === 'number' && (
                <>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span>{distance.toFixed(1)}km</span>
                </>
            )}
          </div>

          {partner.bio ? (
            <p className="text-[13px] text-gray-600 line-clamp-2 leading-relaxed font-medium text-opacity-80">
              {partner.bio}
            </p>
          ) : (
            <div className="flex gap-2 mt-1">
                {partner.personalityTags?.slice(0, 2).map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-50 rounded-lg text-[11px] font-medium text-gray-500">
                        #{tag}
                    </span>
                ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default memo(PartnerCard);