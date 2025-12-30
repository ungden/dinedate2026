'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from '@/lib/motion';
import {
  Settings,
  Wallet,
  Crown,
  Calendar,
  Briefcase,
  Star,
  ChevronRight,
  MapPin,
  Edit2,
  Camera,
  Heart,
  MessageCircle,
  Award,
} from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import {
  formatCurrency,
  getVIPBadgeColor,
  getVIPTextColor,
  cn,
  getActivityIcon,
} from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export default function ProfileClient() {
  const {
    currentUser,
    getMyRequests,
    getMyApplications,
    getMyBookings,
    getUserAverageRating,
    getUserReviews,
  } = useDateStore();

  const myRequests = getMyRequests();
  const myApplications = getMyApplications();
  const myBookings = getMyBookings();
  const rating = getUserAverageRating(currentUser.id);
  const reviews = getUserReviews(currentUser.id);

  const menuItems = [
    {
      href: '/wallet',
      icon: Wallet,
      label: 'Ví của tôi',
      value: formatCurrency(currentUser.wallet.balance),
      color: 'green',
      description: 'Quản lý số dư & giao dịch',
    },
    {
      href: '/vip-subscription',
      icon: Crown,
      label: 'Nâng cấp VIP',
      value: currentUser.vipStatus.tier.toUpperCase(),
      color: 'yellow',
      description: 'Mở khóa tính năng độc quyền',
    },
    {
      href: '/manage-bookings',
      icon: Calendar,
      label: 'Quản lý Booking',
      value: `${myBookings.length} booking`,
      color: 'purple',
      description: 'Xem và quản lý lịch hẹn',
    },
    {
      href: '/manage-services',
      icon: Briefcase,
      label: 'Quản lý Dịch vụ',
      value: `${currentUser.services?.length || 0} dịch vụ`,
      color: 'blue',
      description: 'Thêm hoặc chỉnh sửa dịch vụ',
    },
  ];

  const colorMap: Record<string, { bg: string; text: string }> = {
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Profile Header */}
      <motion.div
        className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm"
        variants={itemVariants}
      >
        {/* Cover Photo */}
        <div className="relative h-32 sm:h-40 bg-gradient-premium">
          <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
          <motion.button
            className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-sm rounded-xl text-white hover:bg-black/30 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Camera className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-12">
            {/* Avatar */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.02 }}
            >
              <Image
                src={currentUser.avatar}
                alt={currentUser.name}
                width={100}
                height={100}
                className="rounded-3xl border-4 border-white object-cover shadow-lg"
              />
              {currentUser.vipStatus.tier !== 'free' && (
                <motion.span
                  className={cn(
                    'absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold text-white rounded-full uppercase whitespace-nowrap shadow-lg flex items-center gap-1',
                    getVIPBadgeColor(currentUser.vipStatus.tier)
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  <Crown className="w-3 h-3" />
                  {currentUser.vipStatus.tier}
                </motion.span>
              )}

              {/* Edit Avatar Button */}
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100">
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            </motion.div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">
                {currentUser.name}, {currentUser.age}
              </h1>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{currentUser.location}</span>
              </div>
            </div>

            <Link href="/profile/edit">
              <motion.button
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                whileTap={{ scale: 0.95 }}
              >
                <Edit2 className="w-4 h-4" />
                <span>Chỉnh sửa</span>
              </motion.button>
            </Link>
          </div>

          <p className="text-gray-600 mt-6 text-center sm:text-left">
            {currentUser.bio}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <motion.div
              className="text-center"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Heart className="w-5 h-5 text-primary-500" />
                <span className="text-2xl font-bold text-gray-900">{myRequests.length}</span>
              </div>
              <p className="text-sm text-gray-500">Lời mời</p>
            </motion.div>
            <motion.div
              className="text-center"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">{myApplications.length}</span>
              </div>
              <p className="text-sm text-gray-500">Ứng tuyển</p>
            </motion.div>
            <motion.div
              className="text-center"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="text-2xl font-bold text-gray-900">
                  {rating > 0 ? rating.toFixed(1) : '-'}
                </span>
              </div>
              <p className="text-sm text-gray-500">{reviews.length} đánh giá</p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Quick Menu */}
      <motion.div
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        variants={itemVariants}
      >
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const colors = colorMap[item.color];

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={cn(
                  'flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors',
                  index !== menuItems.length - 1 && 'border-b border-gray-100'
                )}
                whileHover={{ x: 4 }}
                whileTap={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
              >
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', colors.bg)}>
                  <Icon className={cn('w-6 h-6', colors.text)} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('font-bold', colors.text)}>
                    {item.value}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>

      {/* Services */}
      {currentUser.services && currentUser.services.length > 0 && (
        <motion.div
          className="bg-white rounded-2xl border border-gray-100 p-6"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" />
              Dịch vụ của bạn
            </h2>
            <Link
              href="/manage-services"
              className="text-primary-600 font-medium hover:underline text-sm"
            >
              Quản lý
            </Link>
          </div>
          <div className="space-y-3">
            {currentUser.services.map((service) => (
              <motion.div
                key={service.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getActivityIcon(service.activity)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{service.title}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{service.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatCurrency(service.price)}
                  </p>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      service.available
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {service.available ? 'Có sẵn' : 'Tạm ngưng'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <motion.div
          className="bg-white rounded-2xl border border-gray-100 p-6"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Đánh giá gần đây
            </h2>
            <Link
              href={`/reviews/${currentUser.id}`}
              className="text-primary-600 font-medium hover:underline text-sm"
            >
              Xem tất cả ({reviews.length})
            </Link>
          </div>
          <div className="space-y-4">
            {reviews.slice(0, 3).map((review) => (
              <motion.div
                key={review.id}
                className="flex gap-4 p-4 bg-gray-50 rounded-xl"
                whileHover={{ scale: 1.01 }}
              >
                <Image
                  src={review.reviewer.avatar}
                  alt={review.reviewer.name}
                  width={44}
                  height={44}
                  className="rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">
                      {review.reviewer.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-4 h-4',
                            i < review.rating
                              ? 'text-yellow-500 fill-current'
                              : 'text-gray-200'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
