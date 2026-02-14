const DICEBEAR_BASE = 'https://api.dicebear.com/7.x';

export type DiceBearStyle = 'adventurer' | 'adventurer-neutral' | 'avataaars' | 'lorelei' | 'notionists';

const DEFAULT_STYLE: DiceBearStyle = 'adventurer';

export function getDiceBearAvatar(seed: string, style: DiceBearStyle = DEFAULT_STYLE): string {
  return `${DICEBEAR_BASE}/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9,b6e3f4`;
}
