'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from '@/lib/motion';
import { Bell, Search, Compass, Sparkles, CircleUser, MessageCircle } from 'lucide-react';
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
    { href: '/', label: 'Partner', icon: Sparkles },
    { href: '/discover', label: 'Khám phá', icon: Compass },
    { href: '/messages', label: 'Tin nhắn', icon: MessageCircle, badge: unreadMessages },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Pink-tinted Glass Effect - Stronger Tint */}
      <div className="absolute inset-0 bg-rose-50/80 backdrop-blur-xl border-b border-rose-200/50 supports-[backdrop-filter]:bg-rose-50/60" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[70px]">
          {/* Left: Branding */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative flex items-center justify-center">
                 {/* Main Logo Text - Solid Rose */}
                 <span className="text-2xl font-black tracking-tighter text-rose-600 group-hover:text-rose-500 transition-colors duration-300">DineDate</span>
                 <span className="absolute -top-0.5 -right-2 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2 p-1 bg-white/50 rounded-full border border-rose-100">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                const Icon = link.icon;
                
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={cn(
                      "relative px-5 py-2 rounded-full flex items-center gap-2 text-sm font-bold transition-all duration-300",
                      isActive 
                        ? "text-rose-600 bg-white shadow-sm border border-rose-50" 
                        : "text-gray-500 hover:text-rose-500 hover:bg-white/50"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive && "stroke-[2.5px]")} />
                    {link.label}
                    {link.badge ? (
                        <span className="bg-rose-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold shadow-sm shadow-rose-500/30">
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
            <Link href="/search" className="hidden sm:flex">
                <button className="w-11 h-11 rounded-full bg-white/60 border border-rose-100 hover:bg-white hover:border-rose-200 hover:shadow-md flex items-center justify-center text-rose-400 hover:text-rose-600 transition-all">
                    <Search className="w-5 h-5" />
                </button>
            </Link>
            
            <Link href="/notifications" className="relative hidden sm:block">
              <button className="w-11 h-11 rounded-full bg-white/60 border border-rose-100 hover:bg-white hover:border-rose-200 hover:shadow-md flex items-center justify-center text-rose-400 hover:text-rose-600 transition-all">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>
            </Link>

            {user ? (
              <Link href="/profile" className="pl-1 group">
                <div className="relative">
                  <div className="p-0.5 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 group-hover:shadow-lg group-hover:shadow-rose-500/20 transition-all">
                    <div className="p-0.5 bg-white rounded-full">
                        <Image
                            src={user.avatar}
                            alt={user.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                        />
                    </div>
                  </div>
                  <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-white rounded-full"></span>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                  <Link href="/login" className="hidden sm:block px-4 py-2 text-sm font-bold text-rose-600 hover:text-rose-700 transition-colors">
                    Đăng nhập
                  </Link>
                  <Link href="/register">
                    <button className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-full font-bold text-sm hover:shadow-lg hover:shadow-rose-500/25 hover:-translate-y-0.5 transition-all">
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