import { Platform } from 'react-native';
// DineDate 2026 - Romantic Pink + White Theme
export const Colors = {
  primary: '#EC4899',
  primaryDark: '#DB2777',
  primaryLight: '#F9A8D4',
  secondary: '#F43F5E',
  secondaryDark: '#E11D48',
  accent: '#FDF2F8',
  background: '#FFFFFF',
  backgroundSecondary: '#FFF1F2',
  card: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#FCE7F3',
  borderLight: '#FDF2F8',
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#17A2B8',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  vipGold: '#FFD700',
  vipPurple: '#9B59B6',
  vipGoldBg: '#FFF8E1',
  vipPurpleBg: '#F3E5F5',
  transparent: 'transparent',
  overlayLight: 'rgba(255,255,255,0.15)',
  shadow: '#000000',
  cuisineKorean: '#E74C3C',
  cuisineJapanese: '#E67E22',
  cuisineItalian: '#27AE60',
  cuisineChinese: '#C0392B',
};

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const FontSize = { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 22, xxxl: 28, title: 32 };
export const BorderRadius = { sm: 6, md: 10, lg: 14, xl: 20, full: 9999 };
export const PLATFORM_FEE_PER_PERSON = 100000;
export const APP_VERSION = '1.0.0';

export const Shadows = {
  card: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 } as const,
    android: { elevation: 2 } as const,
    default: {} as const,
  }),
};
