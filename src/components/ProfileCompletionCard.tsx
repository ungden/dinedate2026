'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  X,
  Camera,
  Phone,
  MapPin,
  FileText,
  Images,
  Tags,
  Star,
  User,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileCompletion, ProfileField } from '@/hooks/useProfileCompletion';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'dinedate_profile_card_dismissed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getFieldIcon(iconKey: string) {
  const iconMap: Record<string, React.ReactNode> = {
    'user': <User className="w-4 h-4" />,
    'camera': <Camera className="w-4 h-4" />,
    'phone': <Phone className="w-4 h-4" />,
    'map-pin': <MapPin className="w-4 h-4" />,
    'file-text': <FileText className="w-4 h-4" />,
    'images': <Images className="w-4 h-4" />,
    'tags': <Tags className="w-4 h-4" />,
    'star': <Star className="w-4 h-4" />,
  };
  return iconMap[iconKey] || <Circle className="w-4 h-4" />;
}

interface ProfileCompletionCardProps {
  showThreshold?: number; // Only show if percentage < threshold (default 80)
  variant?: 'full' | 'compact';
  className?: string;
  onDismiss?: () => void;
}

export default function ProfileCompletionCard({
  showThreshold = 80,
  variant = 'full',
  className,
  onDismiss,
}: ProfileCompletionCardProps) {
  const { user } = useAuth();
  const { percentage, missingFields, isCompleteEnoughForBooking } = useProfileCompletion(user);
  const [isDismissed, setIsDismissed] = useState(true);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  // Check if card was recently dismissed
  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissTime < DISMISS_DURATION) {
        setIsDismissed(true);
        return;
      }
    }
    setIsDismissed(false);
  }, []);

  // Animate percentage on mount
  useEffect(() => {
    if (isDismissed) return;

    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);

    return () => clearTimeout(timer);
  }, [percentage, isDismissed]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsDismissed(true);
    onDismiss?.();
  };

  // Don't show if profile is complete enough or dismissed
  if (!user || percentage >= showThreshold || isDismissed) {
    return null;
  }

  const requiredMissing = missingFields.filter((f) => f.required);
  const recommendedMissing = missingFields.filter((f) => !f.required);

  // Get encouraging message based on percentage
  const getMessage = () => {
    if (percentage < 30) return 'Bat dau hoan thien ho so cua ban!';
    if (percentage < 50) return 'Tot lam! Them vai buoc nua thoi!';
    if (percentage < 70) return 'Gan xong roi! Co len!';
    return 'Chi con mot chut nua la hoan thanh!';
  };

  // Get color based on percentage
  const getProgressColor = () => {
    if (percentage < 30) return 'from-red-500 to-orange-500';
    if (percentage < 50) return 'from-orange-500 to-yellow-500';
    if (percentage < 70) return 'from-yellow-500 to-green-400';
    return 'from-green-400 to-emerald-500';
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "bg-gradient-to-r from-rose-50 to-purple-50 border border-rose-100 rounded-2xl p-4",
          className
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg className="w-12 h-12 -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={125.6}
                  initial={{ strokeDashoffset: 125.6 }}
                  animate={{ strokeDashoffset: 125.6 - (125.6 * animatedPercentage) / 100 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black text-gray-900">{percentage}%</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">Ho so chua hoan thien</p>
              <p className="text-xs text-gray-500 truncate">{getMessage()}</p>
            </div>
          </div>
          <Link
            href="/profile/edit"
            className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 transition-all flex items-center gap-1"
          >
            Hoan thien
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "relative overflow-hidden bg-white rounded-[28px] shadow-xl shadow-rose-500/10 border border-rose-100",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-rose-100/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-100/50 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
        aria-label="Dong"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <motion.div
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-rose-200"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <span className="text-xs font-black text-rose-600">{percentage}%</span>
            </motion.div>
          </div>
          <div className="flex-1 pt-1">
            <h3 className="text-lg font-black text-gray-900 mb-1">Hoan thien ho so</h3>
            <p className="text-sm text-gray-500">{getMessage()}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full bg-gradient-to-r", getProgressColor())}
              initial={{ width: 0 }}
              animate={{ width: `${animatedPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium">
            <span>Bat dau</span>
            <span>Hoan thanh</span>
          </div>
        </div>

        {/* Missing Fields */}
        <div className="space-y-4 mb-6">
          {/* Required fields */}
          {requiredMissing.length > 0 && (
            <div>
              <p className="text-xs font-black text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Circle className="w-2 h-2 fill-red-500" /> Bat buoc
              </p>
              <div className="space-y-2">
                {requiredMissing.map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                      {getFieldIcon(field.icon)}
                    </div>
                    <span className="text-sm font-medium text-red-800 flex-1">{field.labelVi}</span>
                    <Circle className="w-4 h-4 text-red-300" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended fields */}
          {recommendedMissing.length > 0 && (
            <div>
              <p className="text-xs font-black text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Star className="w-2 h-2 fill-amber-500" /> Goi y
              </p>
              <div className="space-y-2">
                {recommendedMissing.slice(0, 3).map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl"
                  >
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                      {getFieldIcon(field.icon)}
                    </div>
                    <span className="text-sm font-medium text-amber-800 flex-1">{field.labelVi}</span>
                    <Circle className="w-4 h-4 text-amber-300" />
                  </div>
                ))}
                {recommendedMissing.length > 3 && (
                  <p className="text-xs text-gray-400 text-center py-1">
                    +{recommendedMissing.length - 3} muc khac
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Booking Warning */}
        {!isCompleteEnoughForBooking && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-xl">
            <p className="text-xs text-rose-700 font-medium text-center">
              <span className="font-bold">Luu y:</span> Ban can hoan thien cac muc bat buoc de co the dat lich hen voi Partner.
            </p>
          </div>
        )}

        {/* CTA Button */}
        <Link href="/profile/edit" className="block">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 text-white rounded-2xl font-black text-base shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 transition-all flex items-center justify-center gap-2"
          >
            Hoan thien ho so
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}
