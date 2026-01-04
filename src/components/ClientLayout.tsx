'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/motion';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading, logout } = useAuth();
  const [showSlowLoading, setShowSlowLoading] = useState(false);
  
  // Các trang không hiển thị Header/Footer
  const isAuthPage = pathname === '/login' || pathname === '/register';

  // Theo dõi thời gian loading
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      // Nếu loading quá 5 giây thì hiện nút force logout
      timer = setTimeout(() => {
        setShowSlowLoading(true);
      }, 5000);
    } else {
      setShowSlowLoading(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleForceLogout = async () => {
    // Cố gắng logout bình thường, nếu lỗi thì force clear và reload
    try {
      await logout();
    } catch (e) {
      console.error("Force logout error:", e);
      if (typeof window !== 'undefined') localStorage.clear();
    }
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <motion.div
          className="text-center flex flex-col items-center max-w-xs w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">DineDate Loading</p>
          
          {/* Hiển thị tùy chọn giải cứu nếu loading quá lâu */}
          {showSlowLoading && (
             <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 pt-6 border-t border-dashed border-gray-100 w-full"
             >
                <p className="text-xs text-gray-400 mb-3 font-medium">
                    Đang tải hơi lâu... Bạn muốn thử lại?
                </p>
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> Tải lại trang
                    </button>
                    <button 
                        onClick={handleForceLogout}
                        className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                        <LogOut className="w-3.5 h-3.5" /> Đăng xuất & Đăng nhập lại
                    </button>
                </div>
             </motion.div>
          )}
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