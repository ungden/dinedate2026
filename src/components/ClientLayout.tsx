'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/motion';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 mt-4 font-bold uppercase tracking-widest text-[10px]">DineDate Loading</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 safe-bottom"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <BottomNavigation />
    </div>
  );
}