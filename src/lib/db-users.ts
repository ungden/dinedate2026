import { User } from '@/types';

export function mapUserUpdatesToDb(updates: Partial<User>) {
  const db: Record<string, unknown> = {};

  if (updates.name !== undefined) db.name = updates.name;
  if (updates.username !== undefined) db.username = updates.username;
  if (updates.bio !== undefined) db.bio = updates.bio;
  if (updates.location !== undefined) db.location = updates.location;
  if ((updates as any).locationDetail !== undefined) db.location_detail = (updates as any).locationDetail;
  if (updates.phone !== undefined) db.phone = updates.phone;
  if (updates.occupation !== undefined) db.occupation = updates.occupation;
  if (updates.birthYear !== undefined) db.birth_year = updates.birthYear;
  if (updates.height !== undefined) db.height = updates.height;
  if (updates.zodiac !== undefined) db.zodiac = updates.zodiac;
  if (updates.personalityTags !== undefined) db.personality_tags = updates.personalityTags;
  if (updates.foodPreferences !== undefined) db.food_preferences = updates.foodPreferences;
  if (updates.images !== undefined) db.gallery_images = updates.images;
  if (updates.gender !== undefined) db.gender = updates.gender;

  // Real avatar (uploaded photo) - stored separately from DiceBear
  if (updates.realAvatar !== undefined) db.avatar = updates.realAvatar;

  // Online status
  if ((updates as any).onlineStatus?.isOnline !== undefined) {
    db.is_online = !!(updates as any).onlineStatus.isOnline;
  }

  // Bank info
  if (updates.bankInfo !== undefined) db.bank_info = updates.bankInfo;

  return db;
}
