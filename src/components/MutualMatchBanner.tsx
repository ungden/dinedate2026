'use client';

import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';

interface MutualMatchBannerProps {
  connectionUserName: string;
  onViewProfile?: () => void;
}

export default function MutualMatchBanner({
  connectionUserName,
  onViewProfile,
}: MutualMatchBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-rose-500 to-pink-600 p-6 text-white shadow-lg"
    >
      {/* Decorative elements */}
      <div className="absolute top-2 right-4 opacity-20">
        <Sparkles className="w-16 h-16" />
      </div>
      <div className="absolute bottom-2 left-4 opacity-10">
        <Heart className="w-12 h-12 fill-white" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Heart className="w-6 h-6 fill-white text-white" />
          </motion.div>
          <h3 className="text-lg font-black">Kết nối thành công!</h3>
        </div>

        <p className="text-sm text-white/90 mb-4 leading-relaxed">
          Cả bạn và <span className="font-bold">{connectionUserName}</span> đều
          muốn gặp lại nhau! Giờ bạn có thể xem ảnh thật và profile đầy đủ
          của nhau.
        </p>

        {onViewProfile && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={onViewProfile}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-primary-600 text-sm font-bold hover:bg-white/90 transition-colors shadow-md"
          >
            Xem profile thật
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
