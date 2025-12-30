'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Zap, Crown } from 'lucide-react';
import { User } from '@/types';
import { cn, formatCurrency, getVIPBadgeColor, getActivityIcon } from '@/lib/utils';

type PackageKey = '3h' | '5h' | '1d';

const PACKAGES: { key: PackageKey; label: string; hours: number }[] = [
  { key: '3h', label: '3 giờ', hours: 3 },
  { key: '5h', label: '5 giờ', hours: 5 },
  { key: '1d', label: '1 ngày', hours: 10 },
];

function getFeaturedService(user: User) {
  const available = (user.services || []).filter((s) => s.available);
  if (available.length === 0) return null;
  return [...available].sort((a, b) => (a.price || 0) - (b.price || 0))[0];
}

function getBaseHourly(user: User, featuredServicePrice?: number) {
  if (user.hourlyRate && user.hourlyRate > 0) return user.hourlyRate;
  return featuredServicePrice || 0;
}

function calcPackageTotal(baseHourly: number, hours: number) {
  const subTotal = baseHourly * hours;
  const fee = Math.round(subTotal * 0.1);
  return subTotal + fee;
}

export default function PartnerCard({ partner, distance }: { partner: User; distance?: number }) {
  const isOnline = !!partner.onlineStatus?.isOnline;
  const isVip = partner.vipStatus?.tier && partner.vipStatus.tier !== 'free';

  const featuredService = getFeaturedService(partner);
  const baseHourly = getBaseHourly(partner, featuredService?.price || 0);

  const imageSrc = partner.images?.[0] || partner.avatar;

  // On list, keep it simple: always show 3h as the primary displayed price.
  const primaryPackage = PACKAGES[0];
  const primaryTotal = baseHourly > 0 ? calcPackageTotal(baseHourly, primaryPackage.hours) : 0;

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

          {/* Main */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[16px] font-black text-gray-900 truncate">{partner.name}</h3>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-500" />
                    <span className="truncate max-w-[150px]">
                      {partner.location?.split(',')?.[0] || partner.location}
                    </span>
                  </span>

                  {typeof distance === 'number' && (
                    <span className="text-gray-400 font-bold">• {distance.toFixed(1)}km</span>
                  )}

                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="font-black text-yellow-700">{(partner.rating ?? 0).toFixed(1)}</span>
                    <span className="text-gray-400">({partner.reviewCount ?? 0})</span>
                  </span>
                </div>
              </div>

              {(partner.availableNow || isOnline) && (
                <div className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[11px] font-black">
                  <Zap className="w-4 h-4" />
                  Rảnh
                </div>
              )}
            </div>

            {/* Featured service + packages */}
            {featuredService && baseHourly > 0 ? (
              <div className="mt-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getActivityIcon(featuredService.activity)}</span>
                      <p className="text-[13px] font-black text-gray-900 truncate">{featuredService.title}</p>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                      Combo nhanh (đã gồm phí)
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-[18px] font-black text-gray-900 leading-none">{formatCurrency(primaryTotal)}</p>
                    <p className="text-[11px] text-gray-500 font-bold">{primaryPackage.label}</p>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {PACKAGES.map((p) => (
                    <span
                      key={p.key}
                      className="px-3 py-1 rounded-full bg-white border border-gray-200 text-[12px] font-black text-gray-700"
                    >
                      {p.label}
                      <span className="text-gray-300 mx-2">•</span>
                      {formatCurrency(calcPackageTotal(baseHourly, p.hours))}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex justify-end">
                  <span className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-primary text-white text-[13px] font-black shadow-primary">
                    Đặt
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-[12px] text-gray-500 font-medium">
                Chưa có dịch vụ để hiển thị
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}