'use client';

import { useEffect, useMemo, useState } from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDateStore } from '@/hooks/useDateStore';

function formatMs(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function RequestCountdown({
  expiresAt,
  status,
  className,
}: {
  expiresAt?: string;
  status: 'active' | 'matched' | 'expired' | 'completed';
  className?: string;
}) {
  const { expireRequestsIfNeeded } = useDateStore();
  const [now, setNow] = useState(() => Date.now());

  const remainingMs = useMemo(() => {
    if (!expiresAt) return null;
    return new Date(expiresAt).getTime() - now;
  }, [expiresAt, now]);

  useEffect(() => {
    if (!expiresAt) return;
    if (status !== 'active') return;

    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(id);
  }, [expiresAt, status]);

  useEffect(() => {
    if (!expiresAt) return;
    if (status !== 'active') return;
    if ((remainingMs ?? 0) <= 0) {
      expireRequestsIfNeeded();
    }
  }, [expiresAt, status, remainingMs, expireRequestsIfNeeded]);

  if (!expiresAt) return null;

  if (status === 'expired') {
    return (
      <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-sm font-semibold', className)}>
        <Timer className="w-4 h-4" />
        <span>Đã hết hạn</span>
      </div>
    );
  }

  if (status !== 'active') return null;

  const isUrgent = (remainingMs ?? 0) <= 60_000;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold',
        isUrgent ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700',
        className
      )}
    >
      <Timer className={cn('w-4 h-4', isUrgent && 'animate-pulse')} />
      <span>Còn lại {formatMs(remainingMs ?? 0)}</span>
    </div>
  );
}