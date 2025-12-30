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
  Grid,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import {
  formatCurrency,
  getVIPBadgeColor,
  cn,
} from '@/lib/utils';

export default function ProfileClient() {
  const { currentUser, getMyRequests, getMyApplications } = useDateStore();
  const myRequests = getMyRequests();
  const myApplications = getMyApplications();

  return (
    <div className="pb-24 -mt-6 -mx-4 sm:mx-auto sm:mt-0 max-w-2xl bg-white min-h-screen sm:rounded-3xl sm:border sm:border-gray-100 sm:shadow-sm sm:overflow-hidden relative">
      
      {/* 1. Header Actions (Absolute) */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
         <div className="w-10" /> {/* Spacer */}
         <Link href="/settings">
            <button className="w-10 h-10 bg-black/5 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/10 transition">
                <Settings className="w-5 h-5" />
            </button>
         </Link>
      </div>

      {/* 2. Cover Photo Area (Small) & Avatar */}
      <div className="relative">
        <div className="h-40 bg-gradient-to-br from-primary-400 to-rose-500 w-full" />
        
        <div className="absolute -bottom-16 left-6">
            <div className="relative">
                <div className="p-1 bg-white rounded-full">
                    <Image
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        width={100}
                        height={100}
                        className="rounded-full object-cover border-4 border-white shadow-md"
                    />
                </div>
                {currentUser.vipStatus.tier !== 'free' && (
                    <div className={cn(
                        "absolute bottom-2 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm border-2 border-white",
                        getVIPBadgeColor(currentUser.vipStatus.tier)
                    )}>
                        <Crown className="w-4 h-4" />
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* 3. Profile Info & Stats */}
      <div className="pt-20 px-6 pb-6">
         <div className="flex justify-between items-start mb-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                    {currentUser.name}
                </h1>
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{currentUser.location}</span>
                </div>
            </div>
            <Link href="/profile/edit">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold hover:bg-gray-200 transition">
                    Sửa hồ sơ
                </button>
            </Link>
         </div>

         {/* Bio */}
         <p className="text-gray-600 text-sm leading-relaxed mb-6">
            {currentUser.bio || "Chưa có giới thiệu..."}
         </p>

         {/* Stats Row */}
         <div className="flex gap-4 mb-8">
            <div className="flex-1 bg-gray-50 rounded-2xl p-3 text-center">
                <span className="block text-xl font-bold text-gray-900">{myRequests.length}</span>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Lời mời</span>
            </div>
            <div className="flex-1 bg-gray-50 rounded-2xl p-3 text-center">
                <span className="block text-xl font-bold text-gray-900">{myApplications.length}</span>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Ứng tuyển</span>
            </div>
            <div className="flex-1 bg-gray-50 rounded-2xl p-3 text-center">
                <span className="block text-xl font-bold text-gray-900">{currentUser.rating || '5.0'}</span>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Đánh giá</span>
            </div>
         </div>

         {/* 4. Menu Actions (Modern List) */}
         <div className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900 mb-2">Tiện ích</h3>
            
            <Link href="/wallet" className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 transition active:scale-[0.99]">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">Ví của tôi</p>
                        <p className="text-xs text-gray-500">{formatCurrency(currentUser.wallet.balance)}</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
            </Link>

            <Link href="/vip-subscription" className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 transition active:scale-[0.99]">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center">
                        <Crown className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">Gói thành viên</p>
                        <p className="text-xs text-gray-500 uppercase">{currentUser.vipStatus.tier}</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
            </Link>

            <Link href="/manage-bookings" className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 transition active:scale-[0.99]">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">Quản lý lịch hẹn</p>
                        <p className="text-xs text-gray-500">Xem các booking</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
            </Link>
         </div>
      </div>
    </div>
  );
}