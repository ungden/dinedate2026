'use client';

import { useRef } from 'react';
import { motion } from '@/lib/motion';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { User } from '@/types';
import FeaturedPartnerCard from '@/components/FeaturedPartnerCard';

interface FeaturedPartnerSectionProps {
  partners: User[];
  loading?: boolean;
}

export default function FeaturedPartnerSection({ partners, loading }: FeaturedPartnerSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Don't render if no featured partners and not loading
  if (!loading && partners.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative -mx-4 px-4 py-4 bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-rose-50/80 border-b border-amber-200/30"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Partner noi bat</h2>
            <p className="text-[10px] text-amber-600 font-medium">Duoc de xuat hang dau</p>
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 bg-white/80 hover:bg-white border border-amber-200 rounded-full flex items-center justify-center text-amber-600 hover:text-amber-700 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 bg-white/80 hover:bg-white border border-amber-200 rounded-full flex items-center justify-center text-amber-600 hover:text-amber-700 transition-colors shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Container */}
      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[160px] sm:w-[180px] h-[240px] bg-white/50 rounded-[24px] animate-pulse border-2 border-amber-200/30"
            />
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mb-2 scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {partners.map((partner, idx) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <FeaturedPartnerCard partner={partner} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Custom scrollbar hide CSS */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </motion.div>
  );
}
