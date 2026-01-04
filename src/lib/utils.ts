import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

export function getActivityIcon(activity: string): string {
  const icons: Record<string, string> = {
    dining: '🍽️',
    drinking: '🍺',
    movies: '🎬',
    travel: '✈️',
  };
  return icons[activity] || '📅';
}

export function getActivityLabel(activity: string): string {
  const labels: Record<string, string> = {
    dining: 'Ăn uống',
    drinking: 'Cafe/Bar',
    movies: 'Xem phim',
    travel: 'Du lịch',
  };
  return labels[activity] || activity;
}

export function getActivityColor(activity: string): string {
  const colors: Record<string, string> = {
    dining: 'bg-orange-500',
    drinking: 'bg-purple-500',
    movies: 'bg-blue-500',
    travel: 'bg-green-500',
  };
  return colors[activity] || 'bg-gray-500';
}

export function getVIPBadgeColor(tier: string): string {
  const colors: Record<string, string> = {
    free: 'bg-gray-400',
    bronze: 'bg-amber-600',
    silver: 'bg-gray-400',
    gold: 'bg-yellow-500',
    platinum: 'bg-gradient-to-r from-gray-300 to-gray-500',
  };
  return colors[tier] || 'bg-gray-400';
}

export function getVIPTextColor(tier: string): string {
  const colors: Record<string, string> = {
    free: 'text-gray-600',
    bronze: 'text-amber-700',
    silver: 'text-gray-600',
    gold: 'text-yellow-600',
    platinum: 'text-gray-700',
  };
  return colors[tier] || 'text-gray-600';
}

// Logic for Badges
export function isNewPartner(dateString?: string): boolean {
  if (!dateString) return false;
  const created = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30; // 30 days
}

export function isQualityPartner(rating: number = 5, count: number = 0): boolean {
  return count > 10 && rating > 4.8;
}