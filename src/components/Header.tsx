'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from '@/lib/motion';
import { Bell, Search, Compass, Users, MessageCircle } from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { getMyNotifications, getMyConversations } = useDateStore();

  const notifications = user ? getMyNotifications() : [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  
  const conversations = user ? getMyConversations() : [];
  const unreadMessages = conversations.filter((c) =>
      c.lastMessage &&
      !c.lastMessage.read &&
      c.lastMessage.senderId !== user?.id
  ).length;

  const navLinks = [
    { href: '/', label: 'Partner', icon: Users },
    { href: '/discover', label: 'Khám phá', icon: Compass },
    { href: '/messages', label: 'Tin nhắn', icon: MessageCircle, badge: unreadMessages },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[70px]">
          {/* Left: Branding & Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-primary-500/30 shadow-lg group-hover:scale-105 transition-transform">
                D
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tight hidden sm:block">DineDate</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1 rounded-2xl">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                const Icon = link.icon;
                
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={cn(
                      "px-5 py-2.5 rounded-xl flex items-center gap-2.5 font-bold text-sm transition-all duration-200",
                      isActive 
                        ? "bg-white text-primary-600 shadow-sm" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive && "stroke-[2.5px]")} />
                    {link.label}
                    {link.badge ? (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 h-4 rounded-full flex items-center justify-center">
                            {link.badge > 99 ? '99+' : link.badge}
                        </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Link href="/search" className="hidden md:block">
                <button className="w-10 h-10 rounded-full bg-white border border-gray-100 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors">
                    <Search className="w-5 h-5" />
                </button>
            </Link>
            
            <Link href="/notifications" className="relative">
              <button className="w-10 h-10 rounded-full bg-white border border-gray-100 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
            </Link>

            <div className="h-8 w-[1px] bg-gray-200 hidden md:block mx-1" />

            {user ? (
              <Link href="/profile" className="flex items-center gap-3 pl-1 group">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-bold text-gray-900 leading-none group-hover:text-primary-600 transition-colors">{user.name}</span>
                  <span className="text-[11px] font-medium text-gray-500">
                    {user.vipStatus.tier !== 'free' ? user.vipStatus.tier.toUpperCase() : 'Member'}
                  </span>
                </div>
                <div className="relative">
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={42}
                    height={42}
                    className="rounded-full object-cover ring-2 ring-white shadow-sm group-hover:ring-primary-100 transition-all"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                  <Link href="/login">
                    <button className="px-5 py-2.5 text-gray-700 font-bold text-sm hover:bg-gray-50 rounded-xl transition-colors">
                      Đăng nhập
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="px-5 py-2.5 bg-gradient-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-primary">
                      Đăng ký
                    </button>
                  </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}