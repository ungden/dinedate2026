'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from '@/lib/motion';
import { Bell, Search } from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function Header() {
  const { user } = useAuth();
  const { getMyNotifications } = useDateStore();

  const notifications = user ? getMyNotifications() : [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">
          {/* Left: Branding or User Greeting */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/profile" className="flex items-center gap-3">
                <div className="relative">
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={36}
                    height={36}
                    className="rounded-full object-cover ring-2 ring-primary-100"
                  />
                  {/* Status Dot */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Xin chào,</span>
                  <span className="text-sm font-bold text-gray-900 leading-none">{user.name.split(' ')[0]} 👋</span>
                </div>
              </Link>
            ) : (
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-primary-500/30 shadow-lg">
                  D
                </div>
                <span className="text-lg font-bold text-gray-900">DineDate</span>
              </Link>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Link href="/search">
                <button className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 active:scale-95 transition-transform">
                    <Search className="w-5 h-5" />
                </button>
            </Link>
            
            <Link href="/notifications" className="relative">
              <button className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 active:scale-95 transition-transform">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}