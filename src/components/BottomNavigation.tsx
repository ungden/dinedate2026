'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from '@/lib/motion';
import { 
  Compass, 
  Users, 
  User 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Reduced to 3 items: Home (Partner), Discover, Profile
const navItems = [
    { href: '/', label: 'Partner', icon: Users },
    { href: '/discover', label: 'Khám phá', icon: Compass },
    { href: '/profile', label: 'Cá nhân', icon: User },
];

export default function BottomNavigation() {
    const pathname = usePathname();

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            {/* Nav Container */}
            <nav className="relative bg-white/90 backdrop-blur-lg border-t border-gray-200/50 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex justify-around items-center h-[68px] px-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));
                        
                        const Icon = item.icon;

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
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}