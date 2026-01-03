'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from '@/lib/motion';
import { 
  Compass, 
  Sparkles, 
  User 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { 
        href: '/', 
        label: 'Partner', 
        icon: Sparkles
    },
    { 
        href: '/discover', 
        label: 'Khám phá', 
        icon: Compass
    },
    { 
        href: '/profile', 
        label: 'Cá nhân', 
        icon: User
    },
];

export default function BottomNavigation() {
    const pathname = usePathname();

    return (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
            {/* Floating Glass Bar - Pink Theme */}
            <nav className="relative bg-white/90 backdrop-blur-2xl border border-white/40 rounded-[32px] shadow-2xl shadow-rose-500/10 p-2">
                <div className="flex justify-between items-center px-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));
                        
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative flex-1 flex flex-col items-center justify-center py-3 group"
                            >
                                <div className="relative z-10 flex flex-col items-center gap-1">
                                    <motion.div
                                        animate={isActive ? { 
                                            scale: 1.1,
                                            y: -2
                                        } : { 
                                            scale: 1,
                                            y: 0 
                                        }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        className={cn(
                                            "transition-colors duration-300",
                                            isActive ? "text-rose-500" : "text-gray-400 group-hover:text-gray-600"
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                "w-[26px] h-[26px]",
                                                isActive && "stroke-[2.5px] fill-rose-50"
                                            )}
                                        />
                                    </motion.div>
                                    
                                    {isActive && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-[10px] font-black tracking-wide text-rose-500"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </div>

                                {/* Active Indicator Glow */}
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-rose-50/80 rounded-[24px] -z-0 border border-rose-100"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}