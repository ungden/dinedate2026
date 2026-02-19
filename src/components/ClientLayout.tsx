'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/motion';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import OnboardingTutorial from './OnboardingTutorial';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, logout, user, isAuthenticated } = useAuth();
  const { showOnboarding, completeOnboarding, dismissOnboarding } = useOnboarding();
  
  // Các trang không hiển thị Header/Footer
  const isAuthPage = pathname === '/login' || pathname === '/register';

  // Các trang public — cho phép render ngay cả khi auth đang loading
  const publicRoutes = ['/', '/discover', '/restaurants', '/search', '/about', '/safety', '/referral', '/support'];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/restaurants/');

  // Tự động xử lý khi bị kẹt ở màn hình loading — chỉ cho trang protected
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isLoading && !isPublicRoute && !isAuthPage) {
      // Nếu loading quá 10 giây trên trang protected, báo lỗi và redirect
      timer = setTimeout(async () => {
        console.error("[ClientLayout] Loading timeout exceeded (10s). Redirecting to login.");
        toast.error("Phiên đăng nhập quá hạn. Vui lòng đăng nhập lại.", { id: 'auth-timeout' });
        window.location.href = '/login';
      }, 10000);
    }

    return () => clearTimeout(timer);
  }, [isLoading, isPublicRoute, isAuthPage, logout]);

  // Chỉ hiển thị loading spinner cho trang protected (không phải public hay auth)
  if (isLoading && !isPublicRoute && !isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          className="text-center flex flex-col items-center max-w-xs w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 text-sm font-medium animate-pulse">Đang kết nối...</p>
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

  // Handle onboarding skip - redirect to profile edit if profile is incomplete
  const handleOnboardingSkip = () => {
    dismissOnboarding();
    // Check if profile is incomplete (no name set properly or no avatar)
    const isProfileIncomplete = !user?.name || user.name === 'Nguoi dung moi' || !user?.bio;
    if (isProfileIncomplete && isAuthenticated) {
      router.push('/profile/edit');
    }
  };

  // Handle onboarding complete - always redirect to profile edit
  const handleOnboardingComplete = async () => {
    await completeOnboarding();
    // Router push is handled in the OnboardingTutorial component
  };

  // Layout chính cho các trang trong ứng dụng
  return (
    <div className="min-h-screen">
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 pb-4 md:pb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <BottomNavigation />

      {/* Onboarding Tutorial for new users */}
      <OnboardingTutorial
        isOpen={showOnboarding && isAuthenticated && !isAuthPage}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </div>
  );
}