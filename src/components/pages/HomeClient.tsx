'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useDateStore } from '@/hooks/useDateStore';
import { ActivityType } from '@/types';
import DateRequestCard from '@/components/DateRequestCard';
import ActivityFilter from '@/components/ActivityFilter';
import BackToTop from '@/components/BackToTop';

export default function HomeClient() {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | undefined>();
  const { getRequestsByActivity } = useDateStore();

  const requests = getRequestsByActivity(selectedActivity);

  return (
    <div className="space-y-8 pb-20 bg-mesh min-h-screen max-w-7xl mx-auto">
      {/* 1. Category Bar - Removed Sticky, keeping it static at the top */}
      <div className="bg-white border-b border-gray-100/50 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:rounded-b-[32px] lg:shadow-soft">
        <div className="max-w-7xl mx-auto">
            <ActivityFilter
                selected={selectedActivity}
                onSelect={setSelectedActivity}
            />
        </div>
      </div>

      <div className="space-y-8 px-2 md:px-4 lg:px-0">
        {/* 2. Premium Hero Banner */}
        {!selectedActivity && (
            <Link href="/create-request">
                <motion.div 
                    className="relative bg-gray-900 rounded-[32px] md:rounded-[40px] p-8 md:p-12 text-white shadow-2xl overflow-hidden group"
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary-500/20 rounded-full blur-[100px] group-hover:bg-primary-500/30 transition-colors duration-500" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2 md:space-y-4 max-w-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="p-1.5 bg-yellow-400/20 rounded-lg">
                                    <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                </span>
                                <span className="text-[12px] md:text-sm font-black uppercase tracking-[0.3em] text-white/60">Find Your Connection</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black leading-[1.1] tracking-tight">Đăng lời mời hẹn hò<br/><span className="gradient-text">ngay bây giờ</span></h2>
                            <p className="text-white/60 text-base md:text-lg font-medium">Bắt đầu những cuộc trò chuyện thú vị và tìm kiếm đối tác đồng hành chỉ trong vài phút.</p>
                        </div>
                        <div className="flex-shrink-0">
                            <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-primary rounded-[24px] md:rounded-[32px] flex items-center justify-center shadow-primary group-hover:scale-110 transition-transform duration-300">
                                <Plus className="w-10 h-10 md:w-14 md:h-14 text-white stroke-[4px]" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </Link>
        )}

        {/* 3. Feed Header */}
        <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                    {selectedActivity ? 'Đang lọc theo hoạt động' : 'Dành riêng cho bạn'}
                </h3>
                <p className="text-gray-400 font-medium text-sm md:text-base">Những lời mời mới nhất gần vị trí của bạn</p>
            </div>
            {requests.length > 0 && (
                <div className="hidden sm:flex px-4 py-2 bg-white rounded-2xl border border-gray-100 text-sm font-black text-gray-400 shadow-sm uppercase tracking-wider">
                    {requests.length} Lời mời
                </div>
            )}
        </div>

        {/* 4. The Feed */}
        <AnimatePresence mode="popLayout">
            {requests.length > 0 ? (
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {requests.map((request, idx) => (
                        <motion.div 
                            key={request.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05, duration: 0.4 }}
                            className="h-full"
                        >
                            <DateRequestCard request={request} />
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-32 text-center bg-white rounded-[40px] shadow-soft border border-gray-50"
                >
                    <div className="text-8xl mb-8">🏜️</div>
                    <h3 className="text-2xl font-black text-gray-900 mb-3">Chưa có lời mời nào ở đây</h3>
                    <p className="text-gray-400 font-medium px-10 max-w-md mx-auto">Hãy thử thay đổi danh mục hoặc là người đầu tiên đăng lời mời trong khu vực này nhé!</p>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button for scrolling back up */}
      <BackToTop />
    </div>
  );
}