'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from '@/lib/motion';
import { X, Sparkles, Eye, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { cn } from '@/lib/utils';

const BANNER_DISMISS_KEY = 'dinedate_profile_banner_dismissed';
const BANNER_DISMISS_DURATION = 12 * 60 * 60 * 1000; // 12 hours

interface ProfileCompletionBannerProps {
  showThreshold?: number;
  className?: string;
}

export default function ProfileCompletionBanner({
  showThreshold = 80,
  className,
}: ProfileCompletionBannerProps) {
  const { user } = useAuth();
  const { percentage, missingFields, isCompleteEnoughForBooking } = useProfileCompletion(user);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(BANNER_DISMISS_KEY);
    if (dismissedAt) {
      const dismissTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissTime < BANNER_DISMISS_DURATION) {
        setIsDismissed(true);
        return;
      }
    }
    setIsDismissed(false);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISS_KEY, Date.now().toString());
    setIsDismissed(true);
  };

  if (!user || percentage >= showThreshold || isDismissed) {
    return null;
  }

  const requiredMissingCount = missingFields.filter((f) => f.required).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "relative bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 rounded-2xl p-4 shadow-lg shadow-rose-500/20",
        className
      )}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        aria-label="Dong"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-4 pr-8">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <Eye className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">
            Hoan thien ho so de nhan them luot xem!
          </p>
          <p className="text-white/80 text-xs mt-0.5">
            {requiredMissingCount > 0
              ? `Con ${requiredMissingCount} muc bat buoc chua hoan thanh`
              : `Ho so cua ban da dat ${percentage}%`
            }
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/profile/edit"
          className="flex-shrink-0 px-4 py-2.5 bg-white text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-50 transition-colors flex items-center gap-1.5 shadow-md"
        >
          <Sparkles className="w-4 h-4" />
          Cap nhat
        </Link>
      </div>

      {/* Progress indicator */}
      <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </motion.div>
  );
}

// Sticky version for pages
export function StickyProfileCompletionBanner({
  showThreshold = 80,
  className,
}: ProfileCompletionBannerProps) {
  const { user } = useAuth();
  const { percentage, requiredFieldsMissing } = useProfileCompletion(user);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(BANNER_DISMISS_KEY);
    if (dismissedAt) {
      const dismissTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissTime < BANNER_DISMISS_DURATION) {
        setIsDismissed(true);
        return;
      }
    }
    setIsDismissed(false);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISS_KEY, Date.now().toString());
    setIsDismissed(true);
  };

  if (!user || percentage >= showThreshold || isDismissed || !isScrolled) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={cn(
        "fixed top-[60px] left-0 right-0 z-40 px-4 py-2",
        className
      )}
    >
      <div className="max-w-2xl mx-auto bg-gradient-to-r from-rose-500 to-purple-500 rounded-full px-4 py-2 shadow-lg shadow-rose-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xs font-black">{percentage}%</span>
          </div>
          <span className="text-sm font-medium hidden sm:inline">Ho so cua ban chua day du</span>
          <span className="text-sm font-medium sm:hidden">Chua day du</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/profile/edit"
            className="px-3 py-1.5 bg-white text-rose-600 rounded-full font-bold text-xs hover:bg-rose-50 transition-colors flex items-center gap-1"
          >
            Cap nhat
            <ArrowRight className="w-3 h-3" />
          </Link>
          <button
            onClick={handleDismiss}
            className="p-1 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
