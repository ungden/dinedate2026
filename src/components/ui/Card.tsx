import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'premium' | 'glass' | 'outline';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({ className, variant = 'default', hover = false, padding = 'md', children, ...props }: CardProps) {
  const variants = {
    default: 'bg-white rounded-2xl shadow-card border border-gray-100/60',
    premium: 'bg-white rounded-2xl shadow-card border border-gray-100/80 hover:shadow-card-hover hover:border-pink-100 hover:-translate-y-0.5',
    glass: 'bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm',
    outline: 'bg-white/50 rounded-2xl border-2 border-dashed border-pink-200',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5 md:p-6',
    lg: 'p-6 md:p-8',
  };

  return (
    <div
      className={cn(
        variants[variant],
        paddings[padding],
        hover && 'transition-all duration-300 cursor-pointer',
        'overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
