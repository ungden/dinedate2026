'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Search,
  Plus,
  Sparkles,
  TrendingUp,
  MapPin,
  Filter,
  Users,
  Star,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useDateStore } from '@/hooks/useDateStore';
import { ActivityType } from '@/types';
import DateRequestCard from '@/components/DateRequestCard';
import ActivityFilter from '@/components/ActivityFilter';
import { formatCurrency, cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
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

export default function HomeClient() {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { getRequestsByActivity, dateRequests, getAllUsers } = useDateStore();

  const requests = getRequestsByActivity(selectedActivity);
  const filteredRequests = searchQuery
    ? requests.filter(
      (r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : requests;

  // Get featured requests (top 5 by hiring amount)
  const featuredRequests = [...dateRequests]
    .sort((a, b) => b.hiringAmount - a.hiringAmount)
    .slice(0, 5);

  // Get online users for sidebar
  const onlineUsers = getAllUsers().filter(u => u.onlineStatus?.isOnline).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Compact Hero Section */}
      <motion.div
        className="relative rounded-3xl overflow-hidden shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-600">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-center md:text-left">
            <motion.h1
              className="text-2xl md:text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Khám phá lời mời hẹn hò
            </motion.h1>

            <motion.p
              className="text-white/90 text-sm md:text-base mb-0 max-w-xl mx-auto md:mx-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Kết nối với những người thú vị và tạo ra những kỷ niệm đẹp cùng DineDate.
            </motion.p>
          </div>

          <motion.div
            className="flex flex-wrap gap-3 shrink-0 justify-center md:justify-end"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/create-request">
              <motion.button
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-600 rounded-xl font-bold shadow-lg text-sm hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-4 h-4" />
                Tạo lời mời
              </motion.button>
            </Link>
            <Link href="/members">
              <motion.button
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold border border-white/30 text-sm hover:bg-white/30 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Users className="w-4 h-4" />
                Thành viên
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content - Desktop: 2 columns, Mobile: 1 column */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search & Filter */}
          <motion.div
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm lời mời theo tên, địa điểm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition"
                />
              </div>
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium transition-all',
                  showFilters || selectedActivity
                    ? 'bg-primary-500 text-white shadow-primary'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                whileTap={{ scale: 0.95 }}
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Bộ lọc</span>
              </motion.button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden pt-4 mt-4 border-t border-gray-100"
                >
                  <ActivityFilter
                    selected={selectedActivity}
                    onSelect={setSelectedActivity}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Results Header */}
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-bold text-gray-900">
                Lời mời mới nhất
              </h2>
              <span className="px-2 py-0.5 bg-primary-100 text-primary-600 text-sm font-medium rounded-full">
                {filteredRequests.length}
              </span>
            </div>
            {selectedActivity && (
              <button
                onClick={() => setSelectedActivity(undefined)}
                className="text-sm text-primary-600 font-medium hover:underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </motion.div>

          {/* Request Grid */}
          {filteredRequests.length > 0 ? (
            <motion.div
              className="grid gap-4 sm:grid-cols-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredRequests.map((request) => (
                <motion.div key={request.id} variants={itemVariants}>
                  <DateRequestCard request={request} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="text-center py-16 bg-white rounded-2xl border border-gray-100"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🔍
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Không tìm thấy lời mời nào
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
              </p>
              <Link href="/create-request">
                <motion.button
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Plus className="w-5 h-5" />
                  Tạo lời mời mới
                </motion.button>
              </Link>
            </motion.div>
          )}
        </div>

        {/* Right Sidebar - Desktop Only */}
        <div className="hidden lg:block space-y-6">
          {/* Featured Requests */}
          <motion.div
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-gray-900">Nổi bật</h3>
              </div>
              <Link href="/" className="text-sm text-primary-600 font-medium hover:underline">
                Xem tất cả
              </Link>
            </div>
            <div className="space-y-3">
              {featuredRequests.slice(0, 4).map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Link href={`/request/${request.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                      <Image
                        src={request.user.avatar}
                        alt={request.title}
                        width={48}
                        height={48}
                        className="rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                          {request.title}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{request.location}</span>
                        </div>
                      </div>
                      {request.hiringAmount > 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-lg">
                          {formatCurrency(request.hiringAmount)}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Online Users */}
          <motion.div
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <h3 className="font-bold text-gray-900">Đang online</h3>
              </div>
              <Link href="/members?online=true" className="text-sm text-primary-600 font-medium hover:underline">
                Xem tất cả
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {onlineUsers.map((user) => (
                <Link key={user.id} href={`/user/${user.id}`}>
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.1 }}
                  >
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={44}
                      height={44}
                      className="rounded-xl object-cover ring-2 ring-green-200"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* CTA Card */}
          <motion.div
            className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl p-6 text-white"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="font-bold text-lg mb-2">Trở thành VIP</h3>
            <p className="text-white/80 text-sm mb-4">
              Mở khóa tính năng độc quyền và nổi bật trong cộng đồng
            </p>
            <Link href="/vip-subscription">
              <motion.button
                className="flex items-center gap-2 w-full justify-center py-3 bg-white text-primary-600 rounded-xl font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Nâng cấp ngay
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}