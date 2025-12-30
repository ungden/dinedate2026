'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useDateStore } from '@/hooks/useDateStore';
import { ActivityType } from '@/types';
import DateRequestCard from '@/components/DateRequestCard';
import ActivityFilter from '@/components/ActivityFilter';

export default function HomeClient() {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | undefined>();
  const { getRequestsByActivity } = useDateStore();

  const requests = getRequestsByActivity(selectedActivity);

  return (
    <div className="space-y-6 pb-20 bg-mesh min-h-screen">
      {/* 1. Category Bar - More Native Style */}
      <div className="sticky top-[60px] z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <ActivityFilter
          selected={selectedActivity}
          onSelect={setSelectedActivity}
        />
      </div>

      <div className="space-y-5 px-1">
        {/* 2. Premium Hero Banner */}
        {!selectedActivity && (
            <Link href="/create-request">
                <motion.div 
                    className="relative bg-gray-900 rounded-[32px] p-6 text-white shadow-xl shadow-gray-900/10 overflow-hidden"
                    whileTap={{ scale: 0.97 }}
                >
                    {/* Abstract background shapes */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
                    
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">Ready to Meet?</span>
                            </div>
                            <h2 className="text-[22px] font-black leading-tight">Đăng lời mời<br/>hẹn hò ngay</h2>
                            <p className="text-white/50 text-[13px] font-medium pt-1">Tìm người đồng hành trong tích tắc</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/40">
                            <Plus className="w-8 h-8 text-white stroke-[3px]" />
                        </div>
                    </div>
                </motion.div>
            </Link>
        )}

        {/* 3. Feed Header */}
        <div className="flex items-center justify-between px-2 pt-2">
            <h3 className="text-[19px] font-black text-gray-900 tracking-tight">
                {selectedActivity ? 'Đang hiển thị' : 'Dành riêng cho bạn'}
            </h3>
            {requests.length > 0 && (
                <div className="px-3 py-1 bg-white rounded-full border border-gray-100 text-[11px] font-bold text-gray-400">
                    {requests.length} TIN ĐĂNG
                </div>
            )}
        </div>

        {/* 4. The Feed */}
        <AnimatePresence mode="popLayout">
            {requests.length > 0 ? (
                <motion.div
                    className="grid gap-5"
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
                        >
                            <DateRequestCard request={request} />
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-24 text-center"
                >
                    <div className="text-7xl mb-6">🏜️</div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Chưa có ai ở đây cả</h3>
                    <p className="text-gray-400 text-sm px-10">Hãy thử đổi danh mục hoặc quay lại sau một chút nhé!</p>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}