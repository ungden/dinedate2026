'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from '@/lib/motion';
import { 
  Compass, 
  Sparkles, 
  CircleUser 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { 
        href: '/', 
        label: 'Partner', 
        icon: Sparkles,
        activeColor: 'text-rose-500'
    },
    { 
        href: '/discover', 
        label: 'Khám phá', 
        icon: Compass,
        activeColor: 'text-purple-500'
    },
    { 
        href: '/profile', 
        label: 'Cá nhân', 
        icon: CircleUser,
        activeColor: 'text-blue-500'
    },
];

export default function BottomNavigation() {
    const pathname = usePathname();

    return (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
            {/* Floating Glass Bar */}
            <nav className="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-2">
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
                                            isActive ? item.activeColor : "text-gray-400 group-hover:text-gray-600"
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                "w-6 h-6",
                                                isActive && "stroke-[2.5px]"
                                            )}
                                        />
                                    </motion.div>
                                    
                                    {isActive && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={cn(
                                                "text-[10px] font-black tracking-wide",
                                                item.activeColor
                                            )}
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </div>

                                {/* Active Indicator Glow */}
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-white shadow-sm rounded-[24px] -z-0"
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