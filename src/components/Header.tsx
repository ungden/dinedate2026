'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from '@/lib/motion';
import { Bell, Search, Compass, Users, MessageCircle, Menu } from 'lucide-react';
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
    <header className="sticky top-0 z-50 w-full">
      {/* Glass Effect Background */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-b border-gray-100/50" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[64px]">
          {/* Left: Branding */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative flex items-center justify-center">
                 <span className="text-2xl font-black tracking-tighter text-gradient">DineDate</span>
                 <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                const Icon = link.icon;
                
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={cn(
                      "relative px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold transition-all duration-300",
                      isActive 
                        ? "text-gray-900" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive && "stroke-[2.5px] text-primary-500")} />
                    {link.label}
                    {link.badge ? (
                        <span className="bg-primary-500 text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold">
                            {link.badge > 99 ? '99+' : link.badge}
                        </span>
                    ) : null}
                    
                    {/* Active Dot Indicator */}
                    {isActive && (
                        <motion.div 
                            layoutId="header-active"
                            className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" 
                        />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/search" className="hidden sm:flex">
                <button className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                    <Search className="w-5 h-5" />
                </button>
            </Link>
            
            <Link href="/notifications" className="relative">
              <button className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary-500 rounded-full border-2 border-white"></span>
                )}
              </button>
            </Link>

            {user ? (
              <Link href="/profile" className="pl-2 group">
                <div className="relative">
                  <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary-500 to-rose-300 group-hover:shadow-lg group-hover:shadow-primary-500/20 transition-all">
                    <div className="p-0.5 bg-white rounded-full">
                        <Image
                            src={user.avatar}
                            alt={user.name}
                            width={36}
                            height={36}
                            className="rounded-full object-cover"
                        />
                    </div>
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                  <Link href="/login" className="hidden sm:block text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
                    Đăng nhập
                  </Link>
                  <Link href="/register">
                    <button className="px-5 py-2.5 bg-gray-900 text-white rounded-full font-bold text-sm hover:bg-black transition-colors shadow-lg shadow-gray-900/20">
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