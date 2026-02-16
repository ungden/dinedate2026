'use client';

import { cn } from '@/lib/utils';
import { getDiceBearAvatar } from '@/lib/dicebear';
/* eslint-disable @next/next/no-img-element */
import { Crown } from 'lucide-react';

interface DiceBearAvatarProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showVipBadge?: boolean;
  vipTier?: string;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
} as const;

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
} as const;

const badgeSizeClasses = {
  sm: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
  md: 'w-4 h-4 -bottom-0.5 -right-0.5',
  lg: 'w-5 h-5 -bottom-1 -right-1',
  xl: 'w-6 h-6 -bottom-1 -right-1',
} as const;

const badgeIconSizes = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
} as const;

function getBadgeColor(tier?: string): string {
  switch (tier) {
    case 'vip':
      return 'bg-yellow-500';
    case 'svip':
      return 'bg-gradient-to-r from-purple-500 to-indigo-600';
    default:
      return 'bg-gray-400';
  }
}

export default function DiceBearAvatar({
  userId,
  size = 'md',
  className,
  showVipBadge = false,
  vipTier,
}: DiceBearAvatarProps) {
  const avatarUrl = getDiceBearAvatar(userId);
  const pixelSize = sizeMap[size];

  return (
    <div className={cn('relative inline-block flex-shrink-0', className)}>
      <img
        src={avatarUrl}
        alt="Avatar"
        width={pixelSize}
        height={pixelSize}
        className={cn(
          sizeClasses[size],
          'rounded-full object-cover border-2 border-white shadow-sm'
        )}
      />
      {showVipBadge && vipTier && vipTier !== 'free' && (
        <span
          className={cn(
            'absolute flex items-center justify-center rounded-full border-2 border-white',
            badgeSizeClasses[size],
            getBadgeColor(vipTier)
          )}
        >
          <Crown className={cn('text-white', badgeIconSizes[size])} />
        </span>
      )}
    </div>
  );
}
