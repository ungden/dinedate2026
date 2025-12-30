'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from '@/lib/motion';
import { 
  Compass, 
  Users, 
  MessageCircle, 
  User 
} from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Reduced to 4 items: Home, Discover, Messages, Profile
const navItems = [
    { href: '/', label: 'Partner', icon: Users },
    { href: '/discover', label: 'Khám phá', icon: Compass },
    { href: '/messages', label: 'Tin nhắn', icon: MessageCircle },
    { href: '/profile', label: 'Cá nhân', icon: User },
];

export default function BottomNavigation() {
    const pathname = usePathname();
    const { user } = useAuth();
    const { getMyConversations } = useDateStore();

    const conversations = user ? getMyConversations() : [];
    const unreadMessages = conversations.filter((c) =>
        c.lastMessage &&
        !c.lastMessage.read &&
        c.lastMessage.senderId !== user?.id
    ).length;

    const getBadgeCount = (href: string) => {
        if (href === '/messages') return unreadMessages;
        // Notifications are now in Profile, so we could potentially show a dot on Profile if needed,
        // but for now we'll keep it simple as requested.
        return 0;
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            {/* Nav Container */}
            <nav className="relative bg-white/90 backdrop-blur-lg border-t border-gray-200/50 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex justify-around items-center h-[68px] px-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));
                        
                        const Icon = item.icon;
                        const badgeCount = getBadgeCount(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative flex-1 h-full flex flex-col items-center justify-center tap-effect"
                            >
                                <div className={cn(
                                    "relative p-1.5 rounded-2xl transition-all duration-300",
                                    isActive ? "text-primary-600 -translate-y-1" : "text-gray-400"
                                )}>
                                    <Icon
                                        className={cn(
                                            "w-[26px] h-[26px] transition-all duration-300",
                                            isActive && "fill-current"
                                        )}
                                        strokeWidth={isActive ? 0 : 2}
                                    />

                                    {/* Active Dot */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-dot"
                                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full"
                                        />
                                    )}

                                    {/* Notification Badge */}
                                    {badgeCount > 0 && (
                                        <span className="absolute top-0 right-0 min-w-[16px] h-[16px] bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 border-2 border-white">
                                            {badgeCount > 9 ? '9+' : badgeCount}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}