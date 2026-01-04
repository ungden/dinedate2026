export type VIPTier = 'free' | 'vip' | 'svip';

export interface VIPStatus {
  tier: VIPTier;
  expiryDate?: string; // Legacy support or optional
  benefits: string[];
}

export interface Wallet {
  balance: number;
  escrowBalance: number;
  currency: string;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface UserOnlineStatus {
  isOnline: boolean;
  lastSeen?: string;
}

export type TransactionType =
  | 'top_up'
  | 'booking_payment'
  | 'booking_earning'
  | 'vip_payment'
  | 'refund'
  | 'withdrawal'
  | 'escrow_hold'
  | 'escrow_release';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  relatedId?: string;
  paymentMethod?: string;
  createdAt: string;
  completedAt?: string;
}

export type PaymentMethod = 'wallet' | 'momo' | 'zalopay' | 'banking' | 'visa';

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  type: TransactionType;
  status: TransactionStatus;
  relatedId?: string;
  createdAt: string;
}

// Enhanced Activity Types for DineDate
export type ActivityType =
  | 'dining'
  | 'drinking'
  | 'movies'
  | 'travel'
  | 'cafe'
  | 'karaoke'
  | 'tour_guide';

// Zodiac signs in Vietnamese
export type ZodiacType =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export const ZODIAC_LABELS: Record<ZodiacType, string> = {
  aries: '♈ Bạch Dương',
  taurus: '♉ Kim Ngưu',
  gemini: '♊ Song Tử',
  cancer: '♋ Cự Giải',
  leo: '♌ Sư Tử',
  virgo: '♍ Xử Nữ',
  libra: '♎ Thiên Bình',
  scorpio: '♏ Bọ Cạp',
  sagittarius: '♐ Nhân Mã',
  capricorn: '♑ Ma Kết',
  aquarius: '♒ Bảo Bình',
  pisces: '♓ Song Ngư',
};

// Personality tags
export type PersonalityTag =
  | 'fun'
  | 'listener'
  | 'extrovert'
  | 'introvert'
  | 'adventurous'
  | 'creative'
  | 'romantic'
  | 'friendly'
  | 'caring'
  | 'humorous'
  | 'intellectual'
  | 'sporty';

export const PERSONALITY_TAG_LABELS: Record<PersonalityTag, string> = {
  fun: '🎉 Vui vẻ',
  listener: '👂 Biết lắng nghe',
  extrovert: '🗣️ Hướng ngoại',
  introvert: '🤫 Hướng nội',
  adventurous: '🏔️ Thích phiêu lưu',
  creative: '🎨 Sáng tạo',
  romantic: '💕 Lãng mạn',
  friendly: '🤝 Thân thiện',
  caring: '💝 Chu đáo',
  humorous: '😄 Hài hước',
  intellectual: '📚 Trí thức',
  sporty: '⚽ Thể thao',
};

export type Gender = 'male' | 'female' | 'other';

export type ServiceDuration = 'session' | 'day';

export interface ServiceOffering {
  id: string;
  activity: ActivityType;
  title: string;
  description: string;
  price: number;
  available: boolean;
  duration: ServiceDuration; // New field
}

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface User {
  id: string;
  username?: string; 
  name: string;
  age: number;
  avatar: string;
  bio: string;
  location: string;
  locationDetail?: string;
  coordinates?: LocationCoords;
  onlineStatus?: UserOnlineStatus;
  services?: ServiceOffering[];
  isServiceProvider?: boolean;
  isPro?: boolean;
  wallet: Wallet;
  vipStatus: VIPStatus;
  totalSpending?: number; // New field
  images?: string[];
  phone?: string;
  email?: string;
  isBanned?: boolean;
  role?: 'user' | 'partner' | 'admin';
  occupation?: string;
  interests?: string[];
  rating?: number;
  reviewCount?: number;
  gender?: Gender;
  height?: number;
  zodiac?: ZodiacType;
  personalityTags?: PersonalityTag[];
  restrictions?: string[];
  voiceIntroUrl?: string;
  hourlyRate?: number;
  availableNow?: boolean;
  availableTonight?: boolean;
  birthYear?: number;
  partner_agreed_at?: string;
  partner_agreed_version?: string;
  createdAt?: string; 
  bankInfo?: BankInfo; 
}

export interface DateRequest {
  id: string;
  userId: string;
  user: User;
  activity: ActivityType;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  hiringAmount: number;
  hiringOption: string;
  maxParticipants: number;
  currentParticipants: number;
  applicants: User[];
  status: 'active' | 'matched' | 'expired' | 'completed';
  createdAt: string;
  expiresAt?: string;
  recommendedPartnerId?: string;
}

export type HiringAmount = 0 | 300000 | 500000 | 700000 | 1000000;

export interface Application {
  id: string;
  requestId: string;
  userId: string;
  user: User;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  updatedAt: string;
}

export type NotificationType =
  | 'application'
  | 'accepted'
  | 'rejected'
  | 'message'
  | 'reminder'
  | 'booking'
  | 'booking_accepted'
  | 'booking_rejected'
  | 'review_request'
  | 'payment'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  reviewerId: string;
  revieweeId: string;
  reviewer: User;
  rating: number;
  comment: string;
  dateRequestId?: string;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  type: 'movie' | 'restaurant' | 'bar' | 'cafe';
  name: string;
  description: string;
  location: string;
  rating: number;
  price: string;
  image: string;
  category: string;
  tags: string[];
}

export interface MatchScore {
  userId: string;
  requestId: string;
  score: number;
  factors: {
    locationMatch: number;
    activityMatch: number;
    priceMatch: number;
    ratingScore: number;
    vipBonus: number;
    availabilityScore: number;
  };
  compatibility: 'excellent' | 'good' | 'moderate' | 'low';
}

export interface MatchingPreferences {
  preferredActivities: ActivityType[];
  preferredLocations: string[];
  minBudget: number;
  maxBudget: number;
  preferredAgeRange: { min: number; max: number };
  preferVIP: boolean;
}

export interface SmartMatch {
  request: DateRequest;
  user: User;
  matchScore: MatchScore;
  reasons: string[];
}

export interface ServiceBooking {
  id: string;
  serviceId: string;
  providerId: string;
  provider: User;
  bookerId: string;
  booker: User;
  service: ServiceOffering;
  date: string;
  time: string;
  location: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'paid' | 'in_progress';
  isPaid: boolean;
  escrowAmount: number;
  providerPhone?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

export interface UserBan {
  userId: string;
  reason: string;
  bannedAt: string;
  expiresAt?: string;
}