'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Plus,
  ClipboardList,
  Send,
  CheckCircle2,
  Inbox,
} from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useMyDateOrders, fetchDateOrdersByIds } from '@/hooks/useDateOrders';
import { useMyApplications } from '@/hooks/useDateOrderApplications';
import DateOrderCard from '@/components/DateOrderCard';

type TabType = 'created' | 'applied' | 'completed';

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'created', label: 'Đã tạo', icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'applied', label: 'Đã ứng tuyển', icon: <Send className="w-4 h-4" /> },
  { key: 'completed', label: 'Đã hoàn thành', icon: <CheckCircle2 className="w-4 h-4" /> },
];

export default function ManageBookingsClient() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('created');

  const { dateOrders: allOrders, loading: ordersLoading } = useMyDateOrders(user?.id || '');
  const { applications: myApplications, loading: appsLoading } = useMyApplications(user?.id || '');
  const [appliedOrders, setAppliedOrders] = useState<typeof allOrders>([]);
  const [appliedLoading, setAppliedLoading] = useState(false);

  // Derived lists
  const createdOrders = useMemo(
    () => allOrders.filter((o) => o.creatorId === user?.id),
    [allOrders, user]
  );

  const appliedOrderIds = useMemo(
    () => new Set(myApplications.map((a) => a.orderId)),
    [myApplications]
  );

  useEffect(() => {
    const loadAppliedOrders = async () => {
      const ids = Array.from(appliedOrderIds);
      if (!ids.length) {
        setAppliedOrders([]);
        return;
      }

      setAppliedLoading(true);
      try {
        const orders = await fetchDateOrdersByIds(ids);
        setAppliedOrders(orders.filter((o) => o.creatorId !== user?.id));
      } catch (error) {
        console.warn('Không thể tải danh sách đơn đã ứng tuyển:', error);
        setAppliedOrders([]);
      } finally {
        setAppliedLoading(false);
      }
    };

    loadAppliedOrders();
  }, [appliedOrderIds, user?.id]);

  const completedOrders = useMemo(
    () => allOrders.filter((o) => o.status === 'completed'),
    [allOrders]
  );

  const currentList = useMemo(() => {
    switch (activeTab) {
      case 'created':
        return createdOrders;
      case 'applied':
        return appliedOrders;
      case 'completed':
        return completedOrders;
      default:
        return [];
    }
  }, [activeTab, createdOrders, appliedOrders, completedOrders]);

  const isLoading = ordersLoading || appsLoading || appliedLoading;

  const counts: Record<TabType, number> = {
    created: createdOrders.length,
    applied: appliedOrders.length,
    completed: completedOrders.length,
  };

  // Auth guard
  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Vui lòng đăng nhập</h3>
        <p className="text-gray-500 text-sm mb-6">Đăng nhập để xem lịch sử date của bạn.</p>
        <Link
          href="/login"
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-2xl font-bold inline-block shadow-primary"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Lịch hẹn của tôi</h1>
        </div>
        <Link
          href="/create-request"
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl text-sm font-bold hover:opacity-95 transition shadow-primary"
        >
          <Plus className="w-4 h-4" />
          Tạo mới
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-semibold text-sm transition',
              activeTab === tab.key
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span
              className={cn(
                'ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold min-w-[20px] text-center',
                activeTab === tab.key
                  ? 'bg-pink-100 text-pink-600'
                  : 'bg-gray-200 text-gray-500'
              )}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">Đang tải dữ liệu...</p>
        </div>
      ) : currentList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {currentList.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <DateOrderCard
                  order={order}
                  currentUserId={user?.id}
                  onViewDetail={() => router.push(`/request/${order.id}`)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {activeTab === 'created' && 'Chưa tạo Date Order nào'}
            {activeTab === 'applied' && 'Chưa ứng tuyển Date Order nào'}
            {activeTab === 'completed' && 'Chưa hoàn thành buổi date nào'}
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            {activeTab === 'created' && 'Tạo Date Order đầu tiên để tìm người đi date!'}
            {activeTab === 'applied' && 'Khám phá và ứng tuyển các Date Order hấp dẫn.'}
            {activeTab === 'completed' && 'Hoàn thành buổi date để có đánh giá.'}
          </p>
          {activeTab === 'created' && (
            <Link
              href="/create-request"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl text-sm font-bold hover:opacity-95 transition shadow-primary"
            >
              <Plus className="w-4 h-4" />
              Tạo Date Order
            </Link>
          )}
          {activeTab === 'applied' && (
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl text-sm font-bold hover:opacity-95 transition shadow-primary"
            >
              Khám phá
            </Link>
          )}
        </motion.div>
      )}
    </div>
  );
}
