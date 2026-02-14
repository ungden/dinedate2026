'use client';

import { useState, useMemo } from 'react';
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
import { useMyDateOrders } from '@/hooks/useDateOrders';
import { useMyApplications } from '@/hooks/useDateOrderApplications';
import DateOrderCard from '@/components/DateOrderCard';

type TabType = 'created' | 'applied' | 'completed';

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'created', label: 'Da tao', icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'applied', label: 'Da ung tuyen', icon: <Send className="w-4 h-4" /> },
  { key: 'completed', label: 'Da hoan thanh', icon: <CheckCircle2 className="w-4 h-4" /> },
];

export default function ManageBookingsClient() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('created');

  const { dateOrders: allOrders, loading: ordersLoading } = useMyDateOrders(user?.id || '');
  const { applications: myApplications, loading: appsLoading } = useMyApplications(user?.id || '');

  // Derived lists
  const createdOrders = useMemo(
    () => allOrders.filter((o) => o.creatorId === user?.id),
    [allOrders, user]
  );

  const appliedOrderIds = useMemo(
    () => new Set(myApplications.map((a) => a.orderId)),
    [myApplications]
  );

  const appliedOrders = useMemo(
    () => allOrders.filter((o) => appliedOrderIds.has(o.id) && o.creatorId !== user?.id),
    [allOrders, appliedOrderIds, user]
  );

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

  const isLoading = ordersLoading || appsLoading;

  const counts: Record<TabType, number> = {
    created: createdOrders.length,
    applied: appliedOrders.length,
    completed: completedOrders.length,
  };

  // Auth guard
  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Vui long dang nhap de xem lich su date.</p>
        <Link
          href="/login"
          className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold inline-block"
        >
          Dang nhap
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">My Date Orders</h1>
        </div>
        <Link
          href="/create-request"
          className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition"
        >
          <Plus className="w-4 h-4" />
          Tao moi
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
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span
              className={cn(
                'ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold min-w-[20px] text-center',
                activeTab === tab.key
                  ? 'bg-primary-100 text-primary-600'
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
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">Dang tai du lieu...</p>
        </div>
      ) : currentList.length > 0 ? (
        <div className="space-y-4">
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
            {activeTab === 'created' && 'Chua tao Date Order nao'}
            {activeTab === 'applied' && 'Chua ung tuyen Date Order nao'}
            {activeTab === 'completed' && 'Chua hoan thanh buoi date nao'}
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            {activeTab === 'created' && 'Tao Date Order dau tien de tim nguoi di date!'}
            {activeTab === 'applied' && 'Kham pha va ung tuyen cac Date Order hap dan.'}
            {activeTab === 'completed' && 'Hoan thanh buoi date de co danh gia.'}
          </p>
          {activeTab === 'created' && (
            <Link
              href="/create-request"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition"
            >
              <Plus className="w-4 h-4" />
              Tao Date Order
            </Link>
          )}
          {activeTab === 'applied' && (
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition"
            >
              Kham pha
            </Link>
          )}
        </motion.div>
      )}
    </div>
  );
}
