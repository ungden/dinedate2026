export type VIPTier = 'free' | 'vip' | 'svip';
export interface Wallet { balance: number; escrowBalance: number; currency: string; }

export type CuisineType =
  | 'vietnamese' | 'japanese' | 'korean' | 'chinese'
  | 'italian' | 'thai' | 'bbq' | 'hotpot'
  | 'seafood' | 'vegetarian' | 'fusion' | 'other';

export const CUISINE_LABELS: Record<CuisineType, string> = {
  vietnamese: 'Việt Nam', japanese: 'Nhật Bản', korean: 'Hàn Quốc',
  chinese: 'Trung Hoa', italian: 'Ý', thai: 'Thái Lan',
  bbq: 'BBQ/Nướng', hotpot: 'Lẩu', seafood: 'Hải sản',
  vegetarian: 'Chay', fusion: 'Fusion', other: 'Khác',
};

export const CUISINE_ICONS: Record<CuisineType, string> = {
  vietnamese: '🍜', japanese: '🍣', korean: '🥘', chinese: '🥟',
  italian: '🍝', thai: '🍛', bbq: '🥩', hotpot: '🫕',
  seafood: '🦞', vegetarian: '🥗', fusion: '🍽️', other: '🍴',
};

export type Gender = 'male' | 'female' | 'other';

export interface User {
  id: string; name: string; age: number; avatar: string; realAvatar?: string;
  bio: string; location: string; wallet: Wallet;
  vipStatus: { tier: VIPTier; benefits: string[] };
  gender?: Gender; rating?: number; reviewCount?: number;
  role?: 'user' | 'admin'; email?: string; phone?: string;
  onlineStatus?: { isOnline: boolean };
}

export interface Restaurant {
  id: string; name: string; description: string; address: string;
  area: string; city: string; cuisineTypes: CuisineType[];
  logoUrl?: string; coverImageUrl?: string; commissionRate: number;
  status: 'active' | 'inactive' | 'pending'; averageRating?: number;
  reviewCount?: number; openingHours?: string; createdAt: string;
}

export interface Combo {
  id: string; restaurantId: string; restaurant?: Restaurant;
  name: string; description: string; items: string[];
  price: number; imageUrl?: string; isAvailable: boolean; createdAt: string;
}

export type DateOrderStatus = 'active' | 'matched' | 'confirmed' | 'completed' | 'expired' | 'cancelled' | 'no_show';
export type PaymentSplit = 'split' | 'creator_pays' | 'applicant_pays';

export interface DateOrder {
  id: string; creatorId: string; creator?: User;
  restaurantId: string; restaurant?: Restaurant;
  comboId: string; combo?: Combo;
  dateTime: string; description: string; preferredGender?: Gender;
  paymentSplit: PaymentSplit; comboPrice: number; platformFee: number;
  creatorTotal: number; applicantTotal: number;
  status: DateOrderStatus; matchedUserId?: string; matchedUser?: User;
  applicantCount: number; createdAt: string; expiresAt: string;
}

export interface DateOrderApplication {
  id: string; orderId: string; applicantId: string; applicant?: User;
  message: string; status: 'pending' | 'accepted' | 'rejected'; createdAt: string;
}


