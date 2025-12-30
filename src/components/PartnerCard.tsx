'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Zap, Crown, ChevronRight } from 'lucide-react';
import { User } from '@/types';
import { cn, formatCurrency, getVIPBadgeColor } from '@/lib/utils';

type PackageKey = '3h' | '5h' | '1d';

const PACKAGES: { key: PackageKey; label: string; hours: number }[] = [
  { key: '3h', label: '3 giờ', hours: 3 },
  { key: '5h', label: '5 giờ', hours: 5 },
  { key: '1d', label: '1 ngày', hours: 10 },
];

function getBaseHourly(partner: User) {
  if (partner.hourlyRate && partner.hourlyRate > 0) return partner.hourlyRate;

  const minServicePrice =
    partner.services && partner.services.length > 0
      ? Math.min(...partner.services.map((s) => s.price || 0).filter(Boolean))
      : 0;

  return minServicePrice || 0;
}

function calcPackageTotal(baseHourly: number, hours: number) {
  const subTotal = baseHourly * hours;
  const fee = Math.round(subTotal * 0.1);
  return subTotal + fee;
}

export default function PartnerCard({ partner, distance }: { partner: User; distance?: number }) {
  const isOnline = !!partner.onlineStatus?.isOnline;
  const isVip = partner.vipStatus?.tier && partner.vipStatus.tier !== 'free';

  const baseHourly = getBaseHourly(partner);
  const packages = PACKAGES.map((p) => ({
    ...p,
    total: calcPackageTotal(baseHourly, p.hours),
  }));

  const imageSrc = partner.images?.[0] || partner.avatar;

  return (
    <Link href={`/user/${partner.id}`} className="block tap-highlight">
      <div className="bg-white rounded-[28px] border border-gray-100 shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="p-4 sm:p-5 flex gap-4">
          {/* Image */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
            <Image
              src={imageSrc}
              alt={partner.name}
              fill
              className="object-cover rounded-2xl"
            />

            {isOnline && (
              <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-black bg-green-500 text-white shadow">
                LIVE
              </span>
            )}

            {isVip && (
              <span
                className={cn(
                  'absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black text-white uppercase shadow',
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
                <h3 className="text-[17px] sm:text-[18px] font-black text-gray-900 truncate">
                  {partner.name}
                </h3>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-gray-500">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded-lg">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="font-black text-yellow-700">
                      {(partner.rating ?? 0).toFixed(1) || '0.0'}
                    </span>
                    <span className="text-gray-400">
                      ({partner.reviewCount ?? 0})
                    </span>
                  </span>

                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-500" />
                    <span className="truncate max-w-[160px]">
                      {partner.location?.split(',')?.[0] || partner.location}
                    </span>
                  </span>

                  {typeof distance === 'number' && (
                    <span className="text-gray-400 font-bold">
                      • {distance.toFixed(1)}km
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center gap-1 text-primary-600 font-black text-[12px]">
                Chi tiết <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Bio */}
            {partner.bio ? (
              <p className="mt-2 text-[13px] text-gray-500 line-clamp-2">
                “{partner.bio}”
              </p>
            ) : null}

            {/* Pricing */}
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  Giá từ
                </p>
                <p className="text-[16px] sm:text-[18px] font-black text-gray-900 leading-none">
                  {formatCurrency(baseHourly)}
                  <span className="text-[11px] text-gray-400 font-bold">/giờ</span>
                </p>
              </div>

              {partner.availableNow || isOnline ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-[12px] font-black">
                  <Zap className="w-4 h-4" />
                  Rảnh ngay
                </span>
              ) : null}
            </div>

            {/* Package combos */}
            {baseHourly > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {packages.map((p) => (
                  <div
                    key={p.key}
                    className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-[12px] font-black"
                    title="Đã gồm phí nền tảng"
                  >
                    {p.label}
                    <span className="text-gray-300 mx-2">•</span>
                    {formatCurrency(p.total)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}