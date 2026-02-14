// ============================================================
// DineDate 2026 - Blind Date x Restaurant Discovery
// ============================================================

// --- VIP & Wallet ---

export type VIPTier = 'free' | 'vip' | 'svip';

export interface VIPStatus {
  tier: VIPTier;
  expiryDate?: string;
  benefits: string[];
}

export interface Wallet {
  balance: number;
  escrowBalance: number;
  currency: string;
}

// --- Location ---

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface UserOnlineStatus {
  isOnline: boolean;
  lastSeen?: string;
}

// --- Transactions ---

export type TransactionType =
  | 'top_up'
  | 'date_order_payment'    // User pays platform fee + combo share
  | 'date_order_refund'     // Refund when no match or cancellation
  | 'vip_payment'
  | 'refund'
  | 'escrow_hold'
  | 'escrow_release'
  | 'referral_bonus'
  | 'restaurant_commission'; // Platform receives commission from restaurant

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

// --- Cuisine Types (replaces ActivityType) ---

export type CuisineType =
  | 'vietnamese'
  | 'japanese'
  | 'korean'
  | 'chinese'
  | 'italian'
  | 'thai'
  | 'bbq'
  | 'hotpot'
  | 'seafood'
  | 'vegetarian'
  | 'fusion'
  | 'other';

export const CUISINE_LABELS: Record<CuisineType, string> = {
  vietnamese: 'Việt Nam',
  japanese: 'Nhật Bản',
  korean: 'Hàn Quốc',
  chinese: 'Trung Hoa',
  italian: 'Ý',
  thai: 'Thái Lan',
  bbq: 'BBQ/Nướng',
  hotpot: 'Lẩu',
  seafood: 'Hải sản',
  vegetarian: 'Chay',
  fusion: 'Fusion',
  other: 'Khác',
};

export const CUISINE_ICONS: Record<CuisineType, string> = {
  vietnamese: '🍜',
  japanese: '🍣',
  korean: '🥘',
  chinese: '🥟',
  italian: '🍝',
  thai: '🍛',
  bbq: '🥩',
  hotpot: '🫕',
  seafood: '🦞',
  vegetarian: '🥗',
  fusion: '🍽️',
  other: '🍴',
};

// --- Zodiac ---

export type ZodiacType =
  | 'aries' | 'taurus' | 'gemini' | 'cancer'
  | 'leo' | 'virgo' | 'libra' | 'scorpio'
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export const ZODIAC_LABELS: Record<ZodiacType, string> = {
  aries: 'Bạch Dương',
  taurus: 'Kim Ngưu',
  gemini: 'Song Tử',
  cancer: 'Cự Giải',
  leo: 'Sư Tử',
  virgo: 'Xử Nữ',
  libra: 'Thiên Bình',
  scorpio: 'Bọ Cạp',
  sagittarius: 'Nhân Mã',
  capricorn: 'Ma Kết',
  aquarius: 'Bảo Bình',
  pisces: 'Song Ngư',
};

// --- Personality ---

export type PersonalityTag =
  | 'fun' | 'listener' | 'extrovert' | 'introvert'
  | 'adventurous' | 'creative' | 'romantic' | 'friendly'
  | 'caring' | 'humorous' | 'intellectual' | 'sporty'
  | 'foodie' | 'coffee_lover' | 'traveler';

export const PERSONALITY_TAG_LABELS: Record<PersonalityTag, string> = {
  fun: 'Vui vẻ',
  listener: 'Biết lắng nghe',
  extrovert: 'Hướng ngoại',
  introvert: 'Hướng nội',
  adventurous: 'Thích phiêu lưu',
  creative: 'Sáng tạo',
  romantic: 'Lãng mạn',
  friendly: 'Thân thiện',
  caring: 'Chu đáo',
  humorous: 'Hài hước',
  intellectual: 'Trí thức',
  sporty: 'Thể thao',
  foodie: 'Mê ẩm thực',
  coffee_lover: 'Ghiền cà phê',
  traveler: 'Thích đi đây đó',
};

export type Gender = 'male' | 'female' | 'other';

// --- Bank Info ---

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

// --- User (no more partner/service provider distinction) ---

export interface User {
  id: string;
  username?: string;
  name: string;
  age: number;
  avatar: string;          // DiceBear anime avatar URL (public)
  realAvatar?: string;     // Real photo (only visible to VIP or after mutual match)
  bio: string;
  location: string;
  locationDetail?: string;
  coordinates?: LocationCoords;
  onlineStatus?: UserOnlineStatus;
  wallet: Wallet;
  vipStatus: VIPStatus;
  totalSpending?: number;
  images?: string[];       // Real gallery photos (hidden by default)
  phone?: string;
  phoneVerified?: boolean;
  phoneVerifiedAt?: string;
  email?: string;
  isBanned?: boolean;
  role?: 'user' | 'admin';  // No more 'partner' role
  occupation?: string;
  interests?: string[];
  rating?: number;
  reviewCount?: number;
  gender?: Gender;
  height?: number;
  zodiac?: ZodiacType;
  personalityTags?: PersonalityTag[];
  foodPreferences?: CuisineType[];  // Favorite cuisine types
  birthYear?: number;
  createdAt?: string;
  bankInfo?: BankInfo;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string;
  // Subscription
  vipSubscribedAt?: string;
  vipExpiresAt?: string;
  // Stats
  totalDates?: number;
  totalConnections?: number;
  referralCode?: string;
  referredBy?: string;
}

// --- Restaurant ---

export type RestaurantStatus = 'active' | 'inactive' | 'pending';

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  area: string;           // District / area name
  city: string;
  cuisineTypes: CuisineType[];
  phone?: string;
  email?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  images?: string[];
  coordinates?: LocationCoords;
  commissionRate: number;  // e.g. 0.15 = 15%
  status: RestaurantStatus;
  averageRating?: number;
  reviewCount?: number;
  openingHours?: string;   // e.g. "10:00-22:00"
  maxCapacity?: number;
  createdAt: string;
  updatedAt?: string;
}

// --- Combo (Set menu for 2 people) ---

export interface Combo {
  id: string;
  restaurantId: string;
  restaurant?: Restaurant;
  name: string;
  description: string;
  items: string[];         // List of dishes in the combo
  price: number;           // Total price for 2 people (VND)
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt?: string;
}

// --- Date Order (core entity - replaces DateRequest + ServiceBooking) ---

export type DateOrderStatus =
  | 'active'           // Waiting for applicants
  | 'matched'          // Both users matched, table booked
  | 'confirmed'        // Restaurant confirmed table
  | 'completed'        // Date happened
  | 'expired'          // No match before expiry
  | 'cancelled'        // Creator cancelled
  | 'no_show';         // One or both didn't show

export type PaymentSplit = 'split' | 'creator_pays' | 'applicant_pays';

export interface DateOrder {
  id: string;
  creatorId: string;
  creator?: User;
  restaurantId: string;
  restaurant?: Restaurant;
  comboId: string;
  combo?: Combo;
  dateTime: string;          // ISO datetime for the date
  description: string;       // "Looking for someone fun to try Korean BBQ tonight"
  preferredGender?: Gender;  // Optional gender preference
  paymentSplit: PaymentSplit;
  // Pricing
  comboPrice: number;
  platformFee: number;       // 100,000 VND per person
  creatorTotal: number;      // platformFee + combo share (based on split)
  applicantTotal: number;    // platformFee + combo share (based on split)
  restaurantCommission: number;
  // Status
  status: DateOrderStatus;
  matchedUserId?: string;
  matchedUser?: User;
  matchedAt?: string;
  tableBookingId?: string;
  // Metadata
  maxApplicants: number;
  applicantCount: number;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

// --- Date Order Application ---

export interface DateOrderApplication {
  id: string;
  orderId: string;
  applicantId: string;
  applicant?: User;
  message: string;           // Short intro message
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// --- Table Booking (auto-created on match) ---

export type TableBookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface TableBooking {
  id: string;
  dateOrderId: string;
  restaurantId: string;
  restaurant?: Restaurant;
  dateTime: string;
  partySize: number;          // Always 2
  status: TableBookingStatus;
  confirmationCode?: string;
  confirmedAt?: string;
  createdAt: string;
}

// --- Reviews ---

// Person Review (after a date)
export interface PersonReview {
  id: string;
  dateOrderId: string;
  reviewerId: string;
  reviewer?: User;
  reviewedId: string;
  reviewed?: User;
  rating: number;            // 1-5
  comment: string;
  wantToMeetAgain: boolean;
  createdAt: string;
}

// Restaurant Review (after a date)
export interface RestaurantReview {
  id: string;
  dateOrderId: string;
  reviewerId: string;
  reviewer?: User;
  restaurantId: string;
  restaurant?: Restaurant;
  foodRating: number;        // 1-5
  ambianceRating: number;    // 1-5
  serviceRating: number;     // 1-5
  overallRating: number;     // 1-5
  comment: string;
  images?: string[];
  createdAt: string;
}

// --- Mutual Connection (when both say "want to meet again") ---

export interface MutualConnection {
  id: string;
  user1Id: string;
  user1?: User;
  user2Id: string;
  user2?: User;
  dateOrderId: string;
  connectedAt: string;
  // After connection, users can see each other's real photos and chat
}

// --- Notifications ---

export type NotificationType =
  | 'date_order_application'    // Someone applied to your order
  | 'date_order_matched'        // You got matched
  | 'date_order_expired'        // Your order expired
  | 'table_confirmed'           // Restaurant confirmed table
  | 'review_request'            // Please review after date
  | 'mutual_connection'         // Both want to meet again!
  | 'payment'                   // Payment related
  | 'refund'                    // Refund processed
  | 'vip'                       // VIP subscription
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

// --- Reports & Safety ---

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

// --- Phone Verification ---

export interface PhoneVerification {
  id: string;
  userId: string;
  phone: string;
  otpCode: string;
  expiresAt: string;
  verified: boolean;
  attempts: number;
  createdAt: string;
}

export interface SendOtpRequest { phone: string; }
export interface SendOtpResponse { success: boolean; message: string; expiresAt?: string; }
export interface VerifyOtpRequest { phone: string; otpCode: string; }
export interface VerifyOtpResponse { success: boolean; message: string; verified?: boolean; }
export type PhoneVerificationStatus = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error';

// --- Disputes ---

export type DisputeStatus = 'pending' | 'investigating' | 'resolved';
export type DisputeResolution = 'refund_full' | 'refund_partial' | 'no_action';

export interface Dispute {
  id: string;
  dateOrderId: string;
  userId: string;
  reason: string;
  description: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  resolution?: DisputeResolution;
  resolutionAmount?: number;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// --- Support Tickets ---

export type TicketCategory = 'date_order' | 'payment' | 'account' | 'restaurant' | 'technical' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

// --- VIP Subscription ---

export type SubscriptionPlan = 'monthly' | 'quarterly' | 'yearly';

export interface VIPSubscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  price: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoRenew: boolean;
  createdAt: string;
}

export const VIP_PLAN_PRICES: Record<SubscriptionPlan, number> = {
  monthly: 199000,    // 199k VND/month
  quarterly: 499000,  // 499k VND/quarter (~166k/month)
  yearly: 1499000,    // 1.499M VND/year (~125k/month)
};

export const VIP_BENEFITS = [
  'Xem ảnh thật của đối phương trước khi date',
  'Ưu tiên hiển thị trong danh sách ứng viên',
  'Giảm 50% phí nền tảng (50k thay vì 100k)',
  'Huy hiệu VIP trên profile',
  'Xem ai đã xem profile của bạn',
  'Filter nâng cao (zodiac, sở thích ẩm thực)',
];
