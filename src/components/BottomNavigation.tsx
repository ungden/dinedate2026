'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from '@/lib/motion';
import { Home, Users, MessageCircle, Bell, User } from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/', label: 'Khám phá', icon: Home },
    { href: '/members', label: 'Partner', icon: Users },
    { href: '/messages', label: 'Tin nhắn', icon: MessageCircle },
    { href: '/notifications', label: 'Thông báo', icon: Bell },
    { href: '/profile', label: 'Hồ sơ', icon: User },
];

export default function BottomNavigation() {
    const pathname = usePathname();
    const { user } = useAuth();
    const { getMyNotifications, getMyConversations } = useDateStore();

    // Hide bottom nav on specific full-screen flows if needed, 
    // but keeping it visible on main tabs ensures "App-like" feel unless deep in a flow.
    // Currently ClientLayout handles hiding it on /login, which is correct for Auth flows.

    const notifications = user ? getMyNotifications() : [];
    const unreadNotifications = notifications.filter((n) => !n.read).length;

    const conversations = user ? getMyConversations() : [];
    const unreadMessages = conversations.filter((c) =>
        c.lastMessage &&
        !c.lastMessage.read &&
        c.lastMessage.senderId !== user?.id
    ).length;

    const getBadgeCount = (href: string) => {
        if (href === '/notifications') return unreadNotifications;
        if (href === '/messages') return unreadMessages;
        return 0;
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            {/* Gradient Fade Overlay for content behind nav */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />

            <nav className="relative bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-[env(safe-area-inset-bottom)] shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-end justify-between h-[60px] px-2 max-w-md mx-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));
                        
                        const Icon = item.icon;
                        const badgeCount = getBadgeCount(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative group flex-1 h-full flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform duration-200"
                            >
                                {/* Active Indicator Background Glow */}
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-glow"
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary-50 rounded-full -z-10 blur-sm"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}

                                <div className="relative">
                                    <Icon
                                        className={cn(
                                            "w-6 h-6 transition-all duration-300",
                                            isActive
                                                ? "text-primary-600 fill-primary-100 stroke-[2.5px] -translate-y-0.5"
                                                : "text-gray-400 stroke-2 group-hover:text-gray-600"
                                        )}
                                    />

                                    {/* Notification Badge */}
                                    {badgeCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm"
                                        >
                                            {badgeCount > 99 ? '99' : badgeCount}
                                        </motion.span>
                                    )}
                                </div>

                                <span className={cn(
                                    "text-[10px] font-medium transition-all duration-300",
                                    isActive
                                        ? "text-primary-600 translate-y-0 font-bold"
                                        : "text-gray-400 group-hover:text-gray-600"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}