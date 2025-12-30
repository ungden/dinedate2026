'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Zap, Crown } from 'lucide-react';
import { User } from '@/types';
import { cn, getVIPBadgeColor } from '@/lib/utils';

export default function PartnerCard({ partner, distance }: { partner: User; distance?: number }) {
  const isOnline = !!partner.onlineStatus?.isOnline;
  const isVip = partner.vipStatus?.tier && partner.vipStatus.tier !== 'free';

  const imageSrc = partner.images?.[0] || partner.avatar;

  return (
    <Link href={`/user/${partner.id}`} className="block tap-highlight">
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="p-4 flex gap-4">
          {/* Avatar/Image */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image src={imageSrc} alt={partner.name} fill className="object-cover rounded-2xl" />

            {isOnline && (
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-green-500 text-white shadow">
                LIVE
              </span>
            )}

            {isVip && (
              <span
                className={cn(
                  'absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black text-white uppercase shadow',
                  getVIPBadgeColor(partner.vipStatus.tier)
                )}
              >
                <Crown className="w-3 h-3" />
                VIP
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[16px] font-black text-gray-900 truncate">{partner.name}</h3>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-500" />
                    <span className="truncate max-w-[170px]">
                      {partner.location?.split(',')?.[0] || partner.location}
                    </span>
                  </span>

                  {typeof distance === 'number' && (
                    <span className="text-gray-400 font-bold">• {distance.toFixed(1)}km</span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-2 text-[12px]">
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="font-black text-yellow-700">{(partner.rating ?? 0).toFixed(1)}</span>
                    <span className="text-gray-400">({partner.reviewCount ?? 0})</span>
                  </span>

                  {(partner.availableNow || isOnline) && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[11px] font-black">
                      <Zap className="w-4 h-4" />
                      Rảnh
                    </span>
                  )}
                </div>
              </div>
            </div>

            {partner.bio ? (
              <p className="mt-2 text-[12px] text-gray-500 line-clamp-2">
                {partner.bio}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}