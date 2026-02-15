import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({ icon, emoji, title, description, actionLabel, actionHref, onAction, className }: EmptyStateProps) {
  const ActionButton = actionLabel ? (
    actionHref ? (
      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold rounded-2xl shadow-primary hover:shadow-primary-lg hover:opacity-95 active:scale-[0.98] transition-all"
      >
        {actionLabel}
      </Link>
    ) : onAction ? (
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold rounded-2xl shadow-primary hover:shadow-primary-lg hover:opacity-95 active:scale-[0.98] transition-all"
      >
        {actionLabel}
      </button>
    ) : null
  ) : null;

  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}>
      {icon && <div className="mb-4 text-pink-300">{icon}</div>}
      {emoji && <div className="text-5xl mb-4">{emoji}</div>}
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      {description && <p className="text-gray-500 text-sm max-w-sm mb-6 leading-relaxed">{description}</p>}
      {ActionButton}
    </div>
  );
}
