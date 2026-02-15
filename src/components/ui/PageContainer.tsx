import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  /** max-w class for the container */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  className?: string;
  /** Remove bottom padding that's meant for mobile bottom nav */
  noPadBottom?: boolean;
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

export default function PageContainer({ children, maxWidth = '6xl', className, noPadBottom }: PageContainerProps) {
  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthMap[maxWidth],
      noPadBottom ? 'pb-4 md:pb-0' : 'pb-24 md:pb-6',
      className
    )}>
      {children}
    </div>
  );
}
