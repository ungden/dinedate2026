'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X, Sparkles, Calendar, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  isPushSupported,
  getNotificationPermission,
  hasAskedForPushPermission,
  hasSkippedPushNotifications,
  setAskedForPushPermission,
  setSkippedPushNotifications,
} from '@/lib/push-notifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

interface PushNotificationPromptProps {
  show?: boolean;
  onClose?: () => void;
  forceShow?: boolean;
}

export default function PushNotificationPrompt({
  show: showProp,
  onClose,
  forceShow = false,
}: PushNotificationPromptProps) {
  const { user } = useAuth();
  const { subscribe, isSupported, permission, isSubscribed } = usePushNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  // Determine if we should show the prompt
  useEffect(() => {
    // If explicitly controlled by prop
    if (typeof showProp === 'boolean') {
      setIsVisible(showProp);
      return;
    }

    // Don't show if not logged in
    if (!user) {
      setIsVisible(false);
      return;
    }

    // Don't show if not supported
    if (!isSupported) {
      setIsVisible(false);
      return;
    }

    // Don't show if already subscribed
    if (isSubscribed) {
      setIsVisible(false);
      return;
    }

    // Don't show if permission is denied
    if (permission === 'denied') {
      setIsVisible(false);
      return;
    }

    // Don't show if already asked (unless forceShow)
    if (!forceShow && hasAskedForPushPermission()) {
      setIsVisible(false);
      return;
    }

    // Don't show if user skipped (unless forceShow)
    if (!forceShow && hasSkippedPushNotifications()) {
      setIsVisible(false);
      return;
    }

    // Show the prompt after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, isSupported, isSubscribed, permission, showProp, forceShow]);

  const handleEnable = async () => {
    setIsEnabling(true);

    try {
      const success = await subscribe();

      if (success) {
        toast.success('Da bat thong bao thanh cong!');
        setAskedForPushPermission(true);
        setSkippedPushNotifications(false);
        handleClose();
      } else {
        const perm = getNotificationPermission();
        if (perm === 'denied') {
          toast.error('Quyen thong bao bi tu choi. Vui long bat trong cai dat trinh duyet.');
        } else {
          toast.error('Khong the bat thong bao. Vui long thu lai.');
        }
      }
    } catch (error) {
      console.error('[PushPrompt] Error enabling:', error);
      toast.error('Co loi xay ra khi bat thong bao');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleSkip = () => {
    setAskedForPushPermission(true);
    setSkippedPushNotifications(true);
    handleClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  // Don't render if not visible or not supported
  if (!isSupported || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-x-4 bottom-20 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full z-[95]"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition z-10"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>

              {/* Gradient header */}
              <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-rose-500 px-6 py-8 text-center relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />

                <motion.div
                  className="w-20 h-20 bg-white/20 rounded-2xl mx-auto flex items-center justify-center mb-4 backdrop-blur-sm"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  <Bell className="w-10 h-10 text-white" />
                </motion.div>

                <motion.h2
                  className="text-xl font-black text-white mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Bat thong bao
                </motion.h2>

                <motion.p
                  className="text-white/80 text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Khong bo lo bat ky co hoi nao!
                </motion.p>
              </div>

              {/* Benefits */}
              <div className="p-6 space-y-4">
                <motion.div
                  className="flex items-start gap-3 p-3 bg-primary-50 rounded-2xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Nhan thong bao khi co booking moi</p>
                    <p className="text-gray-500 text-xs mt-0.5">Tra loi nhanh de tang co hoi duoc chap nhan</p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start gap-3 p-3 bg-rose-50 rounded-2xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Tin nhan & cap nhat quan trong</p>
                    <p className="text-gray-500 text-xs mt-0.5">Khong bo lo tin nhan tu khach hang va doi tac</p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start gap-3 p-3 bg-amber-50 rounded-2xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Uu dai & khuyen mai doc quyen</p>
                    <p className="text-gray-500 text-xs mt-0.5">Nhan thong tin som nhat ve cac chuong trinh dac biet</p>
                  </div>
                </motion.div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 space-y-3">
                <motion.button
                  onClick={handleEnable}
                  disabled={isEnabling}
                  className={cn(
                    'w-full py-4 rounded-2xl font-black text-white transition flex items-center justify-center gap-2',
                    isEnabling
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-500 to-rose-500 hover:from-primary-600 hover:to-rose-600 shadow-lg shadow-primary-500/30'
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isEnabling ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Dang bat...
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      Bat thong bao ngay
                    </>
                  )}
                </motion.button>

                <motion.button
                  onClick={handleSkip}
                  className="w-full py-3 rounded-2xl font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition flex items-center justify-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <BellOff className="w-4 h-4" />
                  De sau
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
