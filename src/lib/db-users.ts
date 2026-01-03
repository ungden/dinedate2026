import { User } from '@/types';

export function mapUserUpdatesToDb(updates: Partial<User>) {
  const db: Record<string, unknown> = {};

  // public.users columns we actually support from the UI
  if (updates.name !== undefined) db.name = updates.name;
  if (updates.avatar !== undefined) db.avatar = updates.avatar;
  if (updates.bio !== undefined) db.bio = updates.bio;
  if (updates.location !== undefined) db.location = updates.location;
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

  return db;
}