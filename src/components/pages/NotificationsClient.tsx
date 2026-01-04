'use client';

import { motion, AnimatePresence } from '@/lib/motion';
import {
  Bell,
  Check,
  Heart,
  MessageCircle,
  Calendar,
  Star,
  CreditCard,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';
import { useDbNotifications } from '@/hooks/useDbNotifications';
import { formatRelativeTime, cn } from '@/lib/utils';
import { NotificationType } from '@/types';
import Link from 'next/link';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: { duration: 0.2 },
  },
};

const getNotificationIcon = (type: NotificationType | string) => {
  switch (type) {
    case 'application':
      return { icon: Heart, color: 'bg-pink-100 text-pink-600' };
    case 'accepted':
      return { icon: Check, color: 'bg-green-100 text-green-600' };
    case 'rejected':
      return { icon: AlertCircle, color: 'bg-red-100 text-red-600' };
    case 'message':
      return { icon: MessageCircle, color: 'bg-blue-100 text-blue-600' };
    case 'booking':
    case 'booking_accepted':
    case 'booking_rejected':
      return { icon: Calendar, color: 'bg-purple-100 text-purple-600' };
    case 'review_request':
      return { icon: Star, color: 'bg-yellow-100 text-yellow-600' };
    case 'payment':
      return { icon: CreditCard, color: 'bg-green-100 text-green-600' };
    default:
      return { icon: Bell, color: 'bg-gray-100 text-gray-600' };
  }
};

export default function NotificationsClient() {
  const { notifications, markAsRead, markAllAsRead } = useDbNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          <p className="text-gray-600">Cập nhật hoạt động của bạn</p>
        </div>
        {unreadCount > 0 && (
          <motion.button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-primary-600 font-medium hover:bg-primary-50 rounded-xl transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <CheckCheck className="w-5 h-5" />
            <span className="hidden sm:inline">Đánh dấu đã đọc ({unreadCount})</span>
          </motion.button>
        )}
      </motion.div>

      {/* Filter Tabs - Visual only for now */}
      <motion.div
        className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <button className="px-4 py-2 bg-gray-900 text-white rounded-xl font-medium whitespace-nowrap">
          Tất cả
        </button>
        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl font-medium whitespace-nowrap hover:bg-gray-50">
          Chưa đọc ({unreadCount})
        </button>
      </motion.div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <motion.div
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {notifications.map((notification) => {
              const { icon: Icon, color } = getNotificationIcon(notification.type);

              // Determine redirect link based on type
              let link = '#';
              if (notification.type === 'application' && notification.data?.requestId) {
                link = `/request/${notification.data.requestId}`;
              } else if (notification.type === 'message' && notification.data?.conversationId) {
                link = `/chat/${notification.data.conversationId}`;
              } else if (notification.type.includes('booking') && notification.data?.bookingId) {
                link = '/manage-bookings'; // Or detail page
              }

              const Content = (
                <div className="flex items-start gap-4 p-4">
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', color)}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={cn(
                        'font-semibold text-gray-900',
                        !notification.read && 'text-primary-700'
                      )}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className={cn(
                      'text-sm line-clamp-2',
                      notification.read ? 'text-gray-500' : 'text-gray-700'
                    )}>
                      {notification.message}
                    </p>
                  </div>

                  {!notification.read && (
                    <span className="w-3 h-3 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
              );

              return (
                <motion.div
                  key={notification.id}
                  variants={itemVariants}
                  exit="exit"
                  layout
                  className={cn(
                    'transition-colors',
                    notification.read ? 'bg-white hover:bg-gray-50' : 'bg-primary-50/30'
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  {link !== '#' ? (
                    <Link href={link}>{Content}</Link>
                  ) : (
                    Content
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-primary"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Bell className="w-10 h-10 text-white" />
          </motion.div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Chưa có thông báo nào
          </h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Các thông báo về hoạt động của bạn sẽ xuất hiện ở đây
          </p>
        </motion.div>
      )}
    </div>
  );
}