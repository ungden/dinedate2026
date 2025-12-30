'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/motion';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';

const authRoutes = ['/login', '/register', '/forgot-password'];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading } = useAuth();
  const isAuthRoute = authRoutes.includes(pathname);

  // Show loading spinner while checking auth
  if (isLoading && !isAuthRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-mesh">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-primary animate-pulse-ring absolute inset-0 opacity-30" />
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-500 mt-4 font-medium">Đang tải...</p>
        </motion.div>
      </div>
    );
  }

  // Auth routes don't have header/nav
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Main routes with header and bottom nav
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          className="main-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <BottomNavigation />
    </div>
  );
}
