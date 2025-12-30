'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useDateStore } from '@/hooks/useDateStore';
import { ActivityType } from '@/types';
import DateRequestCard from '@/components/DateRequestCard';
import ActivityFilter from '@/components/ActivityFilter';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomeClient() {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | undefined>();
  const { getRequestsByActivity } = useDateStore();

  const requests = getRequestsByActivity(selectedActivity);

  return (
    <div className="space-y-6 pb-20">
      {/* Category Filters - Sticky under header */}
      <div className="sticky top-[60px] z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100 py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <ActivityFilter
          selected={selectedActivity}
          onSelect={setSelectedActivity}
        />
      </div>

      {/* Main Feed */}
      <div className="space-y-4">
        {/* Create Request CTA - Banner Style */}
        <Link href="/create-request">
            <motion.div 
                className="bg-gradient-to-r from-primary-500 to-rose-600 rounded-3xl p-5 text-white shadow-lg shadow-primary-500/20 relative overflow-hidden"
                whileTap={{ scale: 0.98 }}
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-lg">Tạo cuộc hẹn mới</h2>
                        <p className="text-white/80 text-sm">Tìm người đồng hành ngay</p>
                    </div>
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Plus className="w-6 h-6 text-white" />
                    </div>
                </div>
            </motion.div>
        </Link>

        {/* Section Title */}
        <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-lg text-gray-900">
                {selectedActivity ? 'Kết quả lọc' : 'Dành cho bạn'}
            </h3>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                {requests.length} kết quả
            </span>
        </div>

        {/* Feed Grid */}
        {requests.length > 0 ? (
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {requests.map((request) => (
              <motion.div 
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <DateRequestCard request={request} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 grayscale opacity-50">🦕</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Chưa có lời mời nào
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Hãy là người đầu tiên tạo lời mời trong danh mục này!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}