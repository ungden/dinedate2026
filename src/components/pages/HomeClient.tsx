'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ActivityType } from '@/types';
import DateRequestCard from '@/components/DateRequestCard';
import ActivityFilter from '@/components/ActivityFilter';
import BackToTop from '@/components/BackToTop';
import { useDbDateRequests } from '@/hooks/useDbDateRequests';

export default function HomeClient() {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | undefined>();
  const { requests, loading } = useDbDateRequests(selectedActivity);

  return (
    <div className="space-y-8 pb-20 bg-mesh-light min-h-screen max-w-7xl mx-auto">
      {/* 1. Category Bar */}
      <div className="bg-white/50 backdrop-blur-md border-b border-rose-100/50 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 sticky top-[60px] z-30">
        <div className="max-w-7xl mx-auto">
            <ActivityFilter
                selected={selectedActivity}
                onSelect={setSelectedActivity}
            />
        </div>
      </div>

      <div className="space-y-8 px-2 md:px-4 lg:px-0">
        {/* 2. Premium Hero Banner - PINK THEME */}
        {!selectedActivity && (
            <Link href="/create-request">
                <motion.div 
                    className="relative bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 rounded-[32px] md:rounded-[40px] p-8 md:p-12 text-white shadow-2xl shadow-rose-500/30 overflow-hidden group"
                    whileTap={{ scale: 0.98 }}
                >
                    {/* Abstract Shapes */}
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-[80px] group-hover:bg-white/20 transition-colors duration-500" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-500/20 rounded-full blur-[60px]" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2 md:space-y-4 max-w-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/20">
                                    <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                                </span>
                                <span className="text-[12px] md:text-sm font-black uppercase tracking-[0.3em] text-white/80">Premium Dating</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black leading-[1.1] tracking-tight drop-shadow-sm">
                                Tạo lời mời<br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-100 to-white">kết nối ngay</span>
                            </h2>
                            <p className="text-rose-100 text-base md:text-lg font-medium max-w-md">
                                Bắt đầu những cuộc gặp gỡ thú vị và tìm kiếm đối tác đồng hành hoàn hảo cho bạn.
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-white text-rose-600 rounded-[24px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Plus className="w-8 h-8 md:w-10 md:h-10 stroke-[3px]" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </Link>
        )}

        {/* 3. Feed Header */}
        <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    {selectedActivity ? 'Đang lọc' : 'Dành cho bạn'}
                    <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                </h3>
                <p className="text-gray-500 font-medium text-sm md:text-base">
                    {selectedActivity ? 'Kết quả tìm kiếm theo hoạt động' : 'Những lời mời mới nhất gần bạn'}
                </p>
            </div>
            {!loading && requests.length > 0 && (
                <div className="hidden sm:flex px-4 py-2 bg-rose-50 rounded-2xl border border-rose-100 text-sm font-black text-rose-500 uppercase tracking-wider">
                    {requests.length} Lời mời
                </div>
            )}
        </div>

        {/* 4. The Feed */}
        {loading ? (
            <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
                <p className="text-gray-500 mt-2">Đang tải lời mời...</p>
            </div>
        ) : (
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
                        className="py-32 text-center bg-white/60 backdrop-blur-sm rounded-[40px] border border-dashed border-rose-200"
                    >
                        <div className="text-8xl mb-6 opacity-80">🌸</div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3">Chưa có lời mời nào</h3>
                        <p className="text-gray-500 font-medium px-10 max-w-md mx-auto">Hãy là người đầu tiên tạo nên câu chuyện thú vị tại đây!</p>
                    </motion.div>
                )}
            </AnimatePresence>
        )}
      </div>

      <BackToTop />
    </div>
  );
}