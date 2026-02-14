import { User, VIPTier } from '@/types';
import { getDiceBearAvatar } from './dicebear';

type DbUserRow = Record<string, any>;

function toVipTier(tier: any): VIPTier {
  const t = String(tier).toLowerCase();
  if (t === 'svip') return 'svip';
  if (t === 'vip' || t === 'gold' || t === 'silver' || t === 'bronze') return 'vip';
  return 'free';
}

function isUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function mapDbUserToUser(row: DbUserRow): User {
  const gallery: string[] = Array.isArray(row.gallery_images)
    ? row.gallery_images.filter(Boolean)
    : [];

  const reviewCount = Number(row.review_count ?? row.reviewCount ?? 0);
  const rating = reviewCount > 0
    ? Number(row.average_rating ?? row.rating ?? 0)
    : 5.0;

  let displayName = row.name;
  if (!displayName || isUUID(displayName)) {
    displayName = row.email ? row.email.split('@')[0] : 'Người dùng mới';
  }

  let username = row.username;
  if (!username || username.trim() === '') {
    username = undefined;
  }

  // DiceBear anime avatar as default public avatar
  const diceBearAvatar = getDiceBearAvatar(row.id);
  const realAvatar = row.avatar ?? row.avatar_url ?? undefined;

  return {
    id: row.id,
    username,
    name: displayName,
    age: row.birth_year ? new Date().getFullYear() - Number(row.birth_year) : 0,
    avatar: diceBearAvatar,                    // Always DiceBear for public display
    realAvatar: realAvatar,                    // Real photo (VIP only or after connection)
    bio: row.bio ?? '',
    location: row.location ?? 'Hà Nội',
    locationDetail: row.location_detail ?? undefined,
    coordinates:
      typeof row.latitude === 'number' && typeof row.longitude === 'number'
        ? { latitude: row.latitude, longitude: row.longitude }
        : undefined,
    onlineStatus: {
      isOnline: !!row.is_online,
      lastSeen: row.last_seen ?? undefined,
    },
    wallet: {
      balance: Number(row.wallet_balance ?? 0),
      escrowBalance: Number(row.wallet_escrow ?? 0),
      currency: 'VND',
    },
    vipStatus: {
      tier: toVipTier(row.vip_tier),
      expiryDate: row.vip_expiry ?? row.vip_expires_at ?? undefined,
      benefits: [],
    },
    totalSpending: Number(row.total_spending || 0),
    images: gallery.length > 0 ? gallery : realAvatar ? [realAvatar] : [],
    phone: row.phone ?? undefined,
    phoneVerified: !!row.phone_verified,
    phoneVerifiedAt: row.phone_verified_at ?? undefined,
    email: row.email ?? undefined,
    occupation: row.occupation ?? undefined,
    rating,
    reviewCount,
    gender: row.gender ?? undefined,
    height: row.height ?? undefined,
    zodiac: row.zodiac ?? undefined,
    personalityTags: Array.isArray(row.personality_tags) ? row.personality_tags : undefined,
    foodPreferences: Array.isArray(row.food_preferences) ? row.food_preferences : undefined,
    birthYear: row.birth_year ?? undefined,
    createdAt: row.created_at ?? undefined,
    bankInfo: row.bank_info || undefined,
    onboardingCompleted: row.onboarding_completed ?? false,
    onboardingCompletedAt: row.onboarding_completed_at ?? undefined,
    role: row.role === 'admin' ? 'admin' : 'user',
    isBanned: !!row.is_banned,
    vipSubscribedAt: row.vip_subscribed_at ?? undefined,
    vipExpiresAt: row.vip_expires_at ?? undefined,
    totalDates: Number(row.total_dates ?? 0),
    totalConnections: Number(row.total_connections ?? 0),
    referralCode: row.referral_code ?? undefined,
    referredBy: row.referred_by ?? undefined,
  };
}
