import { User, VIPTier, ServiceOffering } from '@/types';

type DbUserRow = Record<string, any>;
type DbServiceRow = Record<string, any>;

function toVipTier(tier: any): VIPTier {
  if (tier === 'bronze' || tier === 'silver' || tier === 'gold' || tier === 'platinum') return tier;
  return 'free';
}

function mapDbServiceToService(row: DbServiceRow): ServiceOffering {
  return {
    id: row.id,
    activity: row.activity as any,
    title: row.title,
    description: row.description ?? '',
    price: Number(row.price ?? 0),
    available: !!row.available,
    duration: row.duration === 'day' ? 'day' : 'session',
  };
}

export function mapDbUserToUser(row: DbUserRow): User {
  const gallery: string[] = Array.isArray(row.gallery_images) ? row.gallery_images.filter(Boolean) : [];

  const services = Array.isArray(row.services) 
    ? row.services.map(mapDbServiceToService)
    : undefined;

  const reviewCount = Number(row.review_count ?? row.reviewCount ?? 0);
  // Default to 5.0 stars if no reviews yet
  const rating = reviewCount > 0 
    ? (Number(row.average_rating ?? row.rating ?? 0)) 
    : 5.0;

  return {
    id: row.id,
    name: row.name ?? 'Người dùng',
    age: row.birth_year ? new Date().getFullYear() - Number(row.birth_year) : 25,
    avatar: row.avatar ?? row.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.id}`,
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
    services: services, // loaded via join or passed in
    isServiceProvider: row.role === 'partner' || !!row.is_partner_verified,
    isPro: !!row.is_pro,
    role: row.role ?? 'user', 
    wallet: {
      balance: Number(row.wallet_balance ?? 0),
      escrowBalance: Number(row.wallet_escrow ?? 0),
      currency: 'VND',
    },
    vipStatus: {
      tier: toVipTier(row.vip_tier),
      expiryDate: row.vip_expiry ?? undefined,
      benefits: [],
    },
    images: gallery.length > 0 ? gallery : row.avatar ? [row.avatar] : [],
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    occupation: row.occupation ?? undefined,
    rating: rating,
    reviewCount: reviewCount,

    gender: row.gender ?? undefined,
    height: row.height ?? undefined,
    zodiac: row.zodiac ?? undefined,
    personalityTags: Array.isArray(row.personality_tags) ? row.personality_tags : undefined,
    restrictions: Array.isArray(row.partner_rules) ? row.partner_rules : undefined,
    voiceIntroUrl: row.voice_intro_url ?? undefined,
    hourlyRate: row.hourly_rate ?? undefined,
    availableNow: row.available_now ?? undefined,
    availableTonight: row.available_tonight ?? undefined,
    birthYear: row.birth_year ?? undefined,

    partner_agreed_at: row.partner_agreed_at ?? undefined,
    partner_agreed_version: row.partner_agreed_version ?? undefined,
    createdAt: row.created_at ?? undefined,
    
    // Map JSONB bank_info
    bankInfo: row.bank_info || undefined,
  };
}