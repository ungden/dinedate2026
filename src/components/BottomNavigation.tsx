'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from '@/lib/motion';
import { 
  Compass, 
  Users, 
  MessageCircle, 
  BellRing, 
  UserCircle2 
} from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/', label: 'Khám phá', icon: Compass },
    { href: '/members', label: 'Partner', icon: Users },
    { href: '/messages', label: 'Tin nhắn', icon: MessageCircle },
    { href: '/notifications', label: 'Thông báo', icon: BellRing },
    { href: '/profile', label: 'Cá nhân', icon: UserCircle2 },
];

export default function BottomNavigation() {
    const pathname = usePathname();
    const { user } = useAuth();
    const { getMyNotifications, getMyConversations } = useDateStore();

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
            {/* Smooth Gradient Overlay for content fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />

            {/* Main Navigation Bar */}
            <nav className="relative bg-white/80 backdrop-blur-xl border-t border-gray-200/50 pb-[env(safe-area-inset-bottom)]">
                <div className="flex justify-between items-center h-[64px] px-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));
                        
                        const Icon = item.icon;
                        const badgeCount = getBadgeCount(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative group flex-1 h-full flex flex-col items-center justify-center"
                            >
                                <div className="relative p-1">
                                    {/* Active Indicator Glow */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-pill"
                                            className="absolute inset-0 bg-primary-100 rounded-2xl -z-10"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        />
                                    )}

                                    <div className="relative">
                                        <Icon
                                            className={cn(
                                                "w-6 h-6 transition-all duration-300",
                                                isActive
                                                    ? "text-primary-600 stroke-[2.5px]"
                                                    : "text-gray-400 group-hover:text-gray-600"
                                            )}
                                        />

                                        {/* Notification Badge */}
                                        {badgeCount > 0 && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm z-20"
                                            >
                                                {badgeCount > 99 ? '99+' : badgeCount}
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                <span className={cn(
                                    "text-[10px] font-medium mt-1 transition-all duration-300",
                                    isActive
                                        ? "text-primary-700 font-bold"
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