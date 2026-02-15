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
  Heart,
  HelpCircle,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, cn, getCuisineLabel, getCuisineIcon } from '@/lib/utils';
import ProfileCompletionCard from '@/components/ProfileCompletionCard';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import DiceBearAvatar from '@/components/DiceBearAvatar';

// Menu item component for consistent styling
function MenuItem({ href, icon: Icon, iconBg, iconColor, label, badge, children }: {
  href: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 hover:bg-gray-50/80 transition-colors tap-highlight">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg, iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-[15px]">{label}</p>
          {children}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge}
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
    </Link>
  );
}

export default function ProfileClient() {
  const { logout, user: authUser } = useAuth();
  const { percentage } = useProfileCompletion(authUser);

  if (!authUser) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="text-5xl mb-4">👤</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Vui lòng đăng nhập</h3>
        <p className="text-gray-500 text-sm mb-6">Đăng nhập để xem hồ sơ của bạn</p>
        <Link href="/login" className="btn-primary inline-flex">Đăng nhập</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 md:pb-6">
      {/* Header gradient */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 lg:mx-0">
        <div className="h-40 md:h-48 bg-gradient-to-br from-pink-500 via-pink-500 to-pink-600 w-full relative md:rounded-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] bg-[size:20px_20px]" />
        </div>
      </div>

      {/* Desktop: 2-column layout */}
      <div className="lg:grid lg:grid-cols-[360px_1fr] lg:gap-8 -mt-16 md:-mt-20 relative z-10 px-4 sm:px-0">
        {/* Left Column: Profile Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-card border border-gray-100/60 p-6 pb-5">
            <div className="flex items-start justify-between mb-4">
              <div className="relative -mt-16">
                <div className="p-1.5 bg-white rounded-[28px] shadow-lg">
                  <DiceBearAvatar
                    userId={authUser.id}
                    size="xl"
                    showVipBadge={authUser.vipStatus.tier !== 'free'}
                    vipTier={authUser.vipStatus.tier}
                  />
                </div>
              </div>
              <Link href="/profile/edit">
                <button className="p-2.5 bg-gray-50 text-gray-400 rounded-2xl hover:text-pink-500 hover:bg-pink-50 transition-colors">
                  <Edit2 className="w-5 h-5" />
                </button>
              </Link>
            </div>

            {/* Real photo preview */}
            {authUser.avatar && (
              <div className="mb-4 flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <Image
                  src={authUser.avatar}
                  alt="Ảnh thật"
                  width={48}
                  height={48}
                  className="rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-700">Ảnh thật của bạn</p>
                  <p className="text-[11px] text-gray-400">Chỉ VIP và kết nối thấy được</p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">{authUser.name}</h1>
              <div className="flex items-center gap-3 text-gray-500">
                <div className="flex items-center gap-1 text-[13px] font-medium">
                  <MapPin className="w-3.5 h-3.5 text-pink-500" />
                  <span>{authUser.location}</span>
                </div>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <div className="flex items-center gap-1 text-[13px] font-bold text-yellow-600">
                  <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                  <span>{authUser.rating || '0.0'}</span>
                </div>
              </div>
            </div>

            {/* Food Preferences */}
            {authUser.foodPreferences && authUser.foodPreferences.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {authUser.foodPreferences.map((cuisine) => (
                  <span
                    key={cuisine}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg text-[11px] font-bold border border-orange-100"
                  >
                    {getCuisineIcon(cuisine)} {getCuisineLabel(cuisine)}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-100">
              <div className="text-center">
                <span className="block text-lg font-black text-gray-900">{authUser.totalDates || 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Số date</span>
              </div>
              <div className="text-center border-x border-gray-100">
                <span className="block text-lg font-black text-gray-900">{authUser.totalConnections || 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kết nối</span>
              </div>
              <div className="text-center">
                <span className="block text-lg font-black text-gray-900">{authUser.reviewCount || 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Đánh giá</span>
              </div>
            </div>
          </div>

          {/* Wallet Card */}
          <Link href="/wallet">
            <motion.div
              className="bg-white p-5 rounded-2xl shadow-card border border-gray-100/60 flex items-center justify-between hover:shadow-card-hover transition-all"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 stroke-[2.5px]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Số dư ví</p>
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

          {/* Profile Completion */}
          {percentage < 100 && (
            <ProfileCompletionCard showThreshold={100} variant="full" />
          )}
        </div>

        {/* Right Column: Menu Sections */}
        <div className="space-y-5 mt-6 lg:mt-0">
          {/* Activity Section */}
          <div>
            <h3 className="px-1 mb-3 text-[13px] font-bold text-gray-400 uppercase tracking-[0.15em]">Hoạt động</h3>
            <div className="bg-white rounded-2xl shadow-card border border-gray-100/60 divide-y divide-gray-100/80">
              <MenuItem href="/connections" icon={Heart} iconBg="bg-pink-50" iconColor="text-pink-600" label="Kết nối của tôi">
                <p className="text-[11px] text-gray-400 font-medium">Xem danh sách kết nối</p>
              </MenuItem>
              <MenuItem href="/messages" icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" label="Tin nhắn">
                <p className="text-[11px] text-gray-400 font-medium">Trò chuyện với người đã kết nối</p>
              </MenuItem>
              <MenuItem href="/notifications" icon={Bell} iconBg="bg-purple-50" iconColor="text-purple-600" label="Thông báo" />
              <MenuItem href="/manage-bookings" icon={Calendar} iconBg="bg-orange-50" iconColor="text-orange-600" label="Lịch hẹn của tôi" />
              <MenuItem href="/restaurants" icon={UtensilsCrossed} iconBg="bg-amber-50" iconColor="text-amber-600" label="Khám phá nhà hàng" />
            </div>
          </div>

          {/* Account Section */}
          <div>
            <h3 className="px-1 mb-3 text-[13px] font-bold text-gray-400 uppercase tracking-[0.15em]">Tài khoản</h3>
            <div className="bg-white rounded-2xl shadow-card border border-gray-100/60 divide-y divide-gray-100/80">
              <MenuItem
                href="/vip-subscription"
                icon={Crown}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                label="Nâng cấp VIP"
                badge={
                  <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg uppercase tracking-tight">
                    {authUser.vipStatus.tier}
                  </span>
                }
              />
              <MenuItem href="/settings" icon={Settings} iconBg="bg-gray-100" iconColor="text-gray-600" label="Cài đặt tài khoản" />
              <MenuItem href="/safety" icon={ShieldCheck} iconBg="bg-green-50" iconColor="text-green-600" label="Trung tâm an toàn" />
              <MenuItem href="/support" icon={HelpCircle} iconBg="bg-pink-50" iconColor="text-pink-600" label="Hỗ trợ khách hàng" />
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={() => { if (confirm('Bạn có muốn đăng xuất?')) logout(); }}
            className="w-full py-4 px-6 bg-white rounded-2xl shadow-card border border-gray-100/60 flex items-center justify-center gap-3 text-red-500 font-bold hover:bg-red-50 hover:border-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>

          <p className="text-center text-[11px] font-bold text-gray-300 uppercase tracking-[0.3em]">DineDate Web</p>
        </div>
      </div>
    </div>
  );
}
