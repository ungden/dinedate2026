'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from '@/lib/motion';
import {
  Wallet,
  Crown,
  Settings,
  Edit2,
  MapPin,
  Calendar,
  ChevronRight,
  ShieldCheck,
  LogOut,
  Bell,
  Star,
  Users,
  Briefcase
} from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, getVIPBadgeColor, cn } from '@/lib/utils';

export default function ProfileClient() {
  const { logout, user: authUser } = useAuth();
  const { getMyRequests, getMyApplications, getMyNotifications, getMyConversations } = useDateStore();

  if (!authUser) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center text-gray-500">
        Vui lòng đăng nhập để xem hồ sơ.
      </div>
    );
  }

  const myRequests = getMyRequests();
  const myApplications = getMyApplications();
  const isPartner = authUser.isServiceProvider;

  const notifications = getMyNotifications();
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const conversations = getMyConversations();
  const unreadMessages = conversations.filter((c) =>
    c.lastMessage && !c.lastMessage.read && c.lastMessage.senderId !== authUser.id
  ).length;

  return (
    <div className="safe-bottom -mt-6 -mx-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="h-52 bg-gradient-to-br from-primary-500 via-rose-600 to-purple-600 w-full relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] bg-[size:20px_20px]" />
        </div>

        <div className="px-4 -mt-20 relative z-10">
          <div className="ios-card bg-white p-6 pb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="relative">
                <div className="p-1 bg-white rounded-[28px] shadow-lg -mt-12">
                  <Image
                    src={authUser.avatar || '/default-avatar.png'}
                    alt={authUser.name}
                    width={96}
                    height={96}
                    className="rounded-[24px] object-cover"
                  />
                </div>
                {authUser.vipStatus.tier !== 'free' && (
                  <div
                    className={cn(
                      "absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md",
                      getVIPBadgeColor(authUser.vipStatus.tier)
                    )}
                  >
                    <Crown className="w-4 h-4" />
                  </div>
                )}
              </div>

              <Link href="/profile/edit">
                <button className="p-2.5 bg-gray-50 text-gray-400 rounded-2xl hover:text-primary-500 transition-colors tap-highlight">
                  <Edit2 className="w-5 h-5" />
                </button>
              </Link>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">{authUser.name}</h1>
              <div className="flex items-center gap-3 text-gray-500">
                <div className="flex items-center gap-1 text-[13px] font-medium">
                  <MapPin className="w-3.5 h-3.5 text-primary-500" />
                  <span>{authUser.location}</span>
                </div>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <div className="flex items-center gap-1 text-[13px] font-bold text-yellow-600">
                  <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                  <span>{authUser.rating || '0.0'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-50">
              <div className="text-center">
                <span className="block text-[18px] font-black text-gray-900">{myRequests.length}</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lời mời</span>
              </div>
              <div className="text-center border-x border-gray-50">
                <span className="block text-[18px] font-black text-gray-900">{myApplications.length}</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ứng tuyển</span>
              </div>
              <div className="text-center">
                <span className="block text-[18px] font-black text-gray-900">0</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Theo dõi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 mt-6 space-y-6 pb-32">
        <Link href="/wallet">
          <motion.div
            className="bg-white p-5 rounded-[24px] shadow-soft border border-gray-50 flex items-center justify-between tap-highlight"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Wallet className="w-6 h-6 stroke-[2.5px]" />
              </div>
              <div>
                <p className="text-[12px] font-black text-gray-400 uppercase tracking-wider">Số dư ví</p>
                <p className="text-xl font-black text-gray-900 leading-none mt-0.5">
                  {formatCurrency(authUser.wallet.balance)}
                </p>
              </div>
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
              <ChevronRight className="w-5 h-5" />
            </div>
          </motion.div>
        </Link>

        <div className="space-y-3">
          <h3 className="px-2 text-[14px] font-black text-gray-400 uppercase tracking-[0.2em]">Dành cho Partner</h3>
          <div className="ios-card bg-white divide-y divide-gray-50">
            {isPartner ? (
              <Link href="/partner-dashboard" className="flex items-center justify-between p-4 hover:bg-gray-50 transition tap-highlight">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Partner Dashboard</p>
                    <p className="text-[11px] text-gray-400 font-medium">Quản lý thu nhập & đơn hàng</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
            ) : (
              <Link href="/become-partner/terms" className="flex items-center justify-between p-4 hover:bg-gray-50 transition tap-highlight">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Đăng ký Partner</p>
                    <p className="text-[11px] text-gray-400 font-medium">Đọc & đồng ý điều khoản trước</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="px-2 text-[14px] font-black text-gray-400 uppercase tracking-[0.2em]">Hoạt động</h3>
          <div className="ios-card bg-white divide-y divide-gray-50">
            <Link href="/messages" className="flex items-center justify-between p-4 hover:bg-gray-50 transition tap-highlight">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Danh sách Match</p>
                  <p className="text-[11px] text-gray-400 font-medium">Trò chuyện với người đã kết nối</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadMessages > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center bg-primary-500 text-white text-[10px] font-bold rounded-full">
                    {unreadMessages}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </Link>

            <Link href="/notifications" className="flex items-center justify-between p-4 hover:bg-gray-50 transition tap-highlight">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-900">Thông báo</span>
              </div>
              <div className="flex items-center gap-2">
                {unreadNotifications > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center bg-primary-500 text-white text-[10px] font-bold rounded-full">
                    {unreadNotifications}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </Link>

            <Link href="/manage-bookings" className="flex items-center justify-between p-4 hover:bg-gray-50 transition tap-highlight">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-900">Lịch hẹn của tôi</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="px-2 text-[14px] font-black text-gray-400 uppercase tracking-[0.2em]">Tài khoản</h3>
          <div className="ios-card bg-white divide-y divide-gray-50">
            <Link href="/vip-subscription" className="flex items-center justify-between p-4 hover:bg-gray-50 transition tap-highlight">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-900">Nâng cấp VIP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg uppercase tracking-tight">
                  {authUser.vipStatus.tier}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </Link>

            <Link href="/settings" className="flex items-center justify-between p-4 hover:bg-gray-50 transition tap-highlight">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-900">Cài đặt tài khoản</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>

            <Link href="/safety" className="flex items-center justify-between p-4 hover:bg-gray-50 transition tap-highlight">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-900">Trung tâm an toàn</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>
          </div>
        </div>

        <button
          onClick={() => { if (confirm('Bạn có muốn đăng xuất?')) logout(); }}
          className="w-full py-4 px-6 ios-card bg-white flex items-center justify-center gap-3 text-red-500 font-black uppercase tracking-widest tap-highlight border-red-50 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Đăng xuất
        </button>

        <p className="text-center text-[11px] font-black text-gray-300 uppercase tracking-[0.3em]">DineDate Web</p>
      </div>
    </div>
  );
}