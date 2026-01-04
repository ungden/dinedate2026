'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/motion';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading, logout } = useAuth();
  
  // Các trang không hiển thị Header/Footer
  const isAuthPage = pathname === '/login' || pathname === '/register';

  // Tự động xử lý khi bị kẹt ở màn hình loading
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isLoading) {
      // Nếu loading quá 4 giây, tự động reset và đá về login
      timer = setTimeout(async () => {
        console.warn("Loading timeout - Auto resetting session...");
        
        // Xóa sạch local storage để loại bỏ session bị lỗi (nếu có)
        if (typeof window !== 'undefined') {
            localStorage.clear();
        }
        
        // Thử gọi logout nhẹ nhàng (không await để tránh treo tiếp nếu mạng lỗi)
        logout().catch(() => {});

        // Force reload trang về login
        window.location.href = '/login';
      }, 4000);
    }

    return () => clearTimeout(timer);
  }, [isLoading, logout]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <motion.div
          className="text-center flex flex-col items-center max-w-xs w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
          {/* Không hiển thị text lỗi, tự động xử lý ngầm */}
        </motion.div>
      </div>
    );
  }

  // Layout cho trang Login/Register (Full screen, không header/footer)
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-white">
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    );
  }

  // Layout chính cho các trang trong ứng dụng
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