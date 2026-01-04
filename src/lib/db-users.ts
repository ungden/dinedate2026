import { User } from '@/types';

export function mapUserUpdatesToDb(updates: Partial<User>) {
  const db: Record<string, unknown> = {};

  // public.users columns we actually support from the UI
  if (updates.name !== undefined) db.name = updates.name;
  if (updates.username !== undefined) db.username = updates.username; // Added
  if (updates.avatar !== undefined) db.avatar = updates.avatar;
  if (updates.bio !== undefined) db.bio = updates.bio;

  // IMPORTANT: location is normalized (city/province)
  if (updates.location !== undefined) db.location = updates.location;

  // optional detail
  if ((updates as any).locationDetail !== undefined) db.location_detail = (updates as any).locationDetail;

  if (updates.phone !== undefined) db.phone = updates.phone;
  if (updates.occupation !== undefined) db.occupation = updates.occupation;

  if (updates.birthYear !== undefined) db.birth_year = updates.birthYear;
  if (updates.height !== undefined) db.height = updates.height;
  if (updates.zodiac !== undefined) db.zodiac = updates.zodiac;
  if (updates.personalityTags !== undefined) db.personality_tags = updates.personalityTags;

  // App-only: images -> DB: gallery_images
  if (updates.images !== undefined) db.gallery_images = updates.images;

  // Partner / terms
  if (updates.hourlyRate !== undefined) db.hourly_rate = updates.hourlyRate;
  if (updates.partner_agreed_at !== undefined) db.partner_agreed_at = updates.partner_agreed_at;
  if (updates.partner_agreed_version !== undefined) db.partner_agreed_version = updates.partner_agreed_version;

  // Partner visibility / presence
  if ((updates as any).onlineStatus?.isOnline !== undefined) {
    db.is_online = !!(updates as any).onlineStatus.isOnline;
  }
  if ((updates as any).availableNow !== undefined) db.available_now = !!(updates as any).availableNow;
  if ((updates as any).availableTonight !== undefined) db.available_tonight = !!(updates as any).availableTonight;
  
  // Bank Info
  if (updates.bankInfo !== undefined) db.bank_info = updates.bankInfo;

  return db;
}