'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Home,
  Users,
  MessageCircle,
  Bell,
  User,
  Plus,
  LogOut,
  Settings,
  Wallet,
  Crown,
  ChevronDown,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useDateStore } from '@/hooks/useDateStore';
import { useAuth } from '@/contexts/AuthContext';
import { cn, formatCurrency, getVIPBadgeColor } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Khám phá', icon: Home },
  { href: '/members', label: 'Thành viên', icon: Users },
  { href: '/messages', label: 'Tin nhắn', icon: MessageCircle },
  { href: '/notifications', label: 'Thông báo', icon: Bell },
  { href: '/profile', label: 'Hồ sơ', icon: User },
];

export default function Header() {
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { getMyNotifications, currentUser } = useDateStore();

  const notifications = getMyNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setShowUserMenu(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-white font-bold text-lg">D</span>
            </motion.div>
            <span className="text-xl font-bold gradient-text hidden sm:block group-hover:opacity-80 transition-opacity">
              DineDate
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative"
                >
                  <motion.div
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl transition-colors',
                      isActive
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:bg-gray-100/80'
                    )}
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                  >
                    <div className="relative">
                      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                      {item.href === '/notifications' && unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                      )}
                    </div>
                    <span className={cn(
                      'text-sm',
                      isActive ? 'font-semibold' : 'font-medium'
                    )}>
                      {item.label}
                    </span>
                  </motion.div>

                  {isActive && (
                    <motion.div
                      layoutId="headerNavIndicator"
                      className="absolute -bottom-0.5 left-3 right-3 h-0.5 bg-gradient-primary rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Create Button - Desktop */}
            {user && (
              <Link href="/create-request">
                <motion.button
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-primary text-white rounded-xl font-semibold shadow-primary hover:shadow-lg transition-shadow"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-5 h-5" />
                  <span>Tạo lời mời</span>
                </motion.button>
              </Link>
            )}

            {/* Create Button - Mobile */}
            {user && (
              <Link href="/create-request" className="sm:hidden">
                <motion.button
                  className="w-10 h-10 bg-gradient-primary text-white rounded-xl flex items-center justify-center shadow-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </Link>
            )}

            {/* User Avatar with Dropdown or Login Button */}
            <div className="relative" ref={menuRef}>
              {user ? (
                <motion.button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100/80 transition-colors"
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="relative">
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="rounded-xl object-cover ring-2 ring-primary-200"
                    />
                    {user.vipStatus.tier !== 'free' && (
                      <span className={cn(
                        'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]',
                        getVIPBadgeColor(user.vipStatus.tier)
                      )}>
                        <Crown className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-gray-500 transition-transform hidden sm:block',
                    showUserMenu && 'rotate-180'
                  )} />
                </motion.button>
              ) : (
                <Link href="/login">
                  <motion.button
                    className="px-6 py-2.5 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Đăng nhập
                  </motion.button>
                </Link>
              )}

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden"
                  >
                    {/* User Info */}
                    {!user ? (
                      <div className="px-4 py-3 text-center">
                        <p className="text-gray-500 text-sm">Vui lòng đăng nhập</p>
                      </div>
                    ) : (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <Image
                              src={user.avatar}
                              alt={user.name}
                              width={48}
                              height={48}
                              className="rounded-xl object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                              <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            </div>
                          </div>
                          {user.vipStatus.tier !== 'free' && (
                            <div className={cn(
                              'mt-3 px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-medium',
                              getVIPBadgeColor(user.vipStatus.tier),
                              'text-white'
                            )}>
                              <Crown className="w-4 h-4" />
                              <span>VIP {user.vipStatus.tier.toUpperCase()}</span>
                            </div>
                          )}
                        </div>

                        {/* Wallet Balance */}
                        <Link
                          href="/wallet"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">Số dư ví</p>
                            <p className="font-semibold text-green-600">{formatCurrency(user.wallet.balance)}</p>
                          </div>
                        </Link>
                      </>
                    )}

                    <div className="border-t border-gray-100 my-1" />

                    {/* Menu Items */}
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-5 h-5" />
                      <span className="font-medium">Hồ sơ của tôi</span>
                    </Link>

                    <Link
                      href="/vip-subscription"
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Crown className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium">Nâng cấp VIP</span>
                    </Link>

                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-5 h-5" />
                      <span className="font-medium">Cài đặt</span>
                    </Link>

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Đăng xuất</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
