'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          onClick={scrollToTop}
          className={cn(
            "fixed z-40 flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-transform active:scale-90",
            "bg-white/90 backdrop-blur-md border border-gray-100 text-primary-600",
            "right-6 bottom-24 md:bottom-10" // Tránh đè lên Bottom Navigation trên mobile
          )}
          whileHover={{ y: -5 }}
        >
          <ChevronUp className="w-6 h-6 stroke-[3px]" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}