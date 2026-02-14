import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CuisineType, CUISINE_LABELS, CUISINE_ICONS } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'VND'): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTime(timeString: string): string {
  return timeString;
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Vừa xong';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  } else {
    return formatDate(dateString);
  }
}

// --- Cuisine helpers (replace old Activity helpers) ---

export function getCuisineIcon(cuisine: CuisineType | string): string {
  return CUISINE_ICONS[cuisine as CuisineType] || '🍴';
}

export function getCuisineLabel(cuisine: CuisineType | string): string {
  return CUISINE_LABELS[cuisine as CuisineType] || cuisine;
}

export function getCuisineColor(cuisine: CuisineType | string): string {
  const colors: Record<string, string> = {
    vietnamese: 'bg-yellow-500',
    japanese: 'bg-red-500',
    korean: 'bg-orange-500',
    chinese: 'bg-rose-500',
    italian: 'bg-green-500',
    thai: 'bg-amber-500',
    bbq: 'bg-stone-600',
    hotpot: 'bg-red-600',
    seafood: 'bg-blue-500',
    vegetarian: 'bg-emerald-500',
    fusion: 'bg-purple-500',
    other: 'bg-gray-500',
  };
  return colors[cuisine] || 'bg-gray-500';
}

// --- VIP helpers ---

export function getVIPBadgeColor(tier: string): string {
  const colors: Record<string, string> = {
    free: 'bg-gray-400',
    vip: 'bg-yellow-500 shadow-md shadow-yellow-500/20',
    svip: 'bg-gradient-to-r from-purple-500 to-indigo-600 shadow-md shadow-purple-500/20',
  };
  return colors[tier] || 'bg-gray-400';
}

export function getVIPTextColor(tier: string): string {
  const colors: Record<string, string> = {
    free: 'text-gray-600',
    vip: 'text-yellow-600',
    svip: 'text-purple-700',
  };
  return colors[tier] || 'text-gray-600';
}

// --- Date Order helpers ---

export function getDateOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Đang chờ',
    matched: 'Đã ghép đôi',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    expired: 'Hết hạn',
    cancelled: 'Đã hủy',
    no_show: 'Không đến',
  };
  return labels[status] || status;
}

export function getDateOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-blue-100 text-blue-700',
    matched: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-emerald-100 text-emerald-700',
    expired: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-100 text-red-600',
    no_show: 'bg-orange-100 text-orange-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-500';
}

// --- User helpers ---

export function isNewUser(dateString?: string): boolean {
  if (!dateString) return false;
  const created = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30;
}
