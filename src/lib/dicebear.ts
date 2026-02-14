// DiceBear Anime Avatar Generator
// Uses DiceBear API to generate consistent anime-style avatars from user ID

const DICEBEAR_BASE = 'https://api.dicebear.com/7.x';

// Available anime-like styles
export type DiceBearStyle = 'adventurer' | 'adventurer-neutral' | 'avataaars' | 'lorelei' | 'notionists';

const DEFAULT_STYLE: DiceBearStyle = 'adventurer';

/**
 * Generate a DiceBear anime avatar URL from a seed (usually user ID)
 */
export function getDiceBearAvatar(seed: string, style: DiceBearStyle = DEFAULT_STYLE): string {
  return `${DICEBEAR_BASE}/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9,b6e3f4`;
}

/**
 * Generate avatar with specific gender hint
 */
export function getDiceBearAvatarByGender(
  seed: string,
  gender?: 'male' | 'female' | 'other',
  style: DiceBearStyle = DEFAULT_STYLE
): string {
  const base = `${DICEBEAR_BASE}/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9,b6e3f4`;
  // DiceBear doesn't have explicit gender param, but seed determines appearance
  // We append gender to seed for variety
  if (gender) {
    return `${DICEBEAR_BASE}/${style}/svg?seed=${encodeURIComponent(seed + '-' + gender)}&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9,b6e3f4`;
  }
  return base;
}

/**
 * Check if a URL is a DiceBear avatar
 */
export function isDiceBearAvatar(url: string): boolean {
  return url.includes('dicebear.com');
}
