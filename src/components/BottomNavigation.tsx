'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from '@/lib/motion';
import { 
  UtensilsCrossed, 
  PlusCircle,
  CalendarHeart,
  CircleUser 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { 
        href: '/', 
        label: 'Khám phá', 
        icon: UtensilsCrossed,
        activeColor: 'text-pink-600'
    },
    { 
        href: '/create-request', 
        label: 'Tạo Date', 
        icon: PlusCircle,
        activeColor: 'text-pink-600'
    },
    { 
        href: '/manage-bookings', 
        label: 'Lịch hẹn', 
        icon: CalendarHeart,
        activeColor: 'text-pink-600'
    },
    { 
        href: '/profile', 
        label: 'Cá nhân', 
        icon: CircleUser,
        activeColor: 'text-pink-600'
    },
];

export default function BottomNavigation() {
    const pathname = usePathname();

    return (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
            <nav className="relative bg-white/90 backdrop-blur-2xl border border-pink-100 rounded-[32px] shadow-[0_8px_32px_rgba(236,72,153,0.15)] p-2">
                <div className="flex justify-between items-center px-1">
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
                                            isActive ? item.activeColor : "text-gray-400 group-hover:text-pink-400"
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                "w-5 h-5",
                                                isActive && "stroke-[2.5px] fill-pink-50"
                                            )}
                                        />
                                    </motion.div>
                                    
                                    {isActive && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={cn(
                                                "text-[9px] font-black tracking-wide",
                                                item.activeColor
                                            )}
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </div>

                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-pink-50 rounded-[24px] -z-0 border border-pink-100"
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
