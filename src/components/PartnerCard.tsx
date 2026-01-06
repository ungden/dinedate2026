'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Zap, User } from 'lucide-react';
import { User as UserType } from '@/types';
import { cn, getVIPBadgeColor, isNewPartner, isQualityPartner } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

function PartnerCard({ partner, distance }: { partner: UserType; distance?: number }) {
  const { user: currentUser } = useAuth();
  const isOnline = !!partner.onlineStatus?.isOnline;
  const isVip = partner.vipStatus?.tier && partner.vipStatus.tier !== 'free';
  const imageSrc = partner.images?.[0] || partner.avatar;

  const isNew = isNewPartner(partner.createdAt);
  const isQuality = isQualityPartner(partner.rating, partner.reviewCount);

  // VIP Logic to see age
  const canSeeAge = currentUser?.vipStatus.tier === 'vip' || currentUser?.vipStatus.tier === 'svip';
  const displayAge = canSeeAge && partner.age ? `, ${partner.age}` : '';

  // Use username if available, else ID
  const profileLink = `/user/${partner.username || partner.id}`;

  return (
    <Link href={profileLink} className="block group h-full">
      <div className="relative h-full overflow-hidden rounded-[24px] bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:border-rose-200 hover:-translate-y-1">
        
        {/* Image Container - SQUARE (1:1) */}
        <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
          <Image 
            src={imageSrc} 
            alt={partner.name} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          {/* Online Indicator */}
          {isOnline && (
            <div className="absolute top-3 right-3 z-10">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-white shadow-sm"></span>
              </span>
            </div>
          )}

          {/* Badges Top Left */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
             {isVip && (
                <div className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-wider shadow-sm backdrop-blur-md border border-white/20 flex items-center gap-1",
                  getVIPBadgeColor(partner.vipStatus.tier)
                )}>
                  {partner.vipStatus.tier}
                </div>
             )}
             {isNew && (
                <div className="px-2.5 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-wider bg-blue-500/90 shadow-sm backdrop-blur-md border border-white/10">
                  Mới
                </div>
             )}
          </div>

          {/* Gradient Overlay for Text Visibility */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
             <div className="flex items-end justify-between gap-2">
                <div className="min-w-0 flex-1">
                   <h3 className="text-lg font-black leading-tight truncate pr-1 text-shadow-sm">
                      {partner.name}<span className="font-medium text-white/90 text-base">{displayAge}</span>
                   </h3>
                   
                   <div className="flex items-center gap-2 text-xs font-medium text-white/80 mt-1">
                      <div className="flex items-center gap-0.5">
                         <MapPin className="w-3 h-3" />
                         <span className="truncate max-w-[80px]">{partner.location?.split(',')[0]}</span>
                      </div>
                      {typeof distance === 'number' && (
                        <>
                           <span className="text-white/40">•</span>
                           <span>{distance.toFixed(1)}km</span>
                        </>
                      )}
                   </div>
                </div>

                <div className="flex flex-col items-end gap-1 mb-0.5">
                   <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20 shadow-sm">
                      <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                      <span className="text-xs font-bold">{(partner.rating ?? 5.0).toFixed(1)}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Bottom Info - Tags */}
        <div className="p-3 bg-white h-[68px] flex flex-col justify-center">
           <div className="flex flex-wrap gap-1.5 mb-1.5 h-6 overflow-hidden">
              {partner.personalityTags && partner.personalityTags.length > 0 ? (
                partner.personalityTags.slice(0, 2).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-50 rounded-md text-[10px] font-bold text-gray-500 border border-gray-100 truncate max-w-[100px]">
                        #{tag}
                    </span>
                ))
              ) : (
                 <span className="text-[10px] text-gray-400 italic flex items-center gap-1">
                    <User className="w-3 h-3" /> Chưa cập nhật tags
                 </span>
              )}
           </div>
           
           <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 border-t border-gray-50 pt-1.5">
              <div className="flex items-center gap-1">
                 {isQuality ? (
                    <span className="flex items-center gap-1 text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                       <Zap className="w-3 h-3 fill-orange-500" /> Uy tín
                    </span>
                 ) : (
                    <span>{partner.reviewCount || 0} đánh giá</span>
                 )}
              </div>
              <div className="text-rose-500 group-hover:underline">
                 Xem hồ sơ
              </div>
           </div>
        </div>
      </div>
    </Link>
  );
}

export default memo(PartnerCard);