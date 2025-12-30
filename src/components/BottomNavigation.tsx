'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from '@/lib/motion';
import { Home, Users, MessageCircle, Bell, User, LogIn } from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/', label: 'Khám phá', icon: Home },
    { href: '/members', label: 'Thành viên', icon: Users },
    { href: '/messages', label: 'Tin nhắn', icon: MessageCircle },
    { href: '/notifications', label: 'Thông báo', icon: Bell },
    { href: '/profile', label: 'Hồ sơ', icon: User },
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
        <nav className="bottom-nav md:hidden">
            <div className="flex items-center h-full max-w-lg mx-auto px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));
                    let Icon = item.icon;

                    // Change Profile icon to Login icon if not authenticated
                    if (item.href === '/profile' && !user) {
                        Icon = LogIn;
                    }

                    const badgeCount = getBadgeCount(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'bottom-nav-item',
                                isActive ? 'active' : 'text-gray-400'
                            )}
                        >
                            <div className="bottom-nav-icon">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: isActive ? 1.1 : 1,
                                    }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                >
                                    <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                                </motion.div>

                                {badgeCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="bottom-nav-badge"
                                    >
                                        {badgeCount > 99 ? '99+' : badgeCount}
                                    </motion.span>
                                )}
                            </div>

                            <span className={cn(
                                'bottom-nav-label',
                                isActive ? 'font-semibold' : 'font-medium'
                            )}>
                                {item.href === '/profile' && !user ? 'Đăng nhập' : item.label}
                            </span>

                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute -top-0.5 w-8 h-1 bg-gradient-primary rounded-full"
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
