'use client';

import { useMemo } from 'react';
import { motion } from '@/lib/motion';
import {
    Clock,
    CheckCircle,
    Star,
    UtensilsCrossed,
    CalendarHeart,
    AlertTriangle,
    Timer
} from 'lucide-react';
import { DateOrder } from '@/types';
import { formatCurrency, cn, formatDateTime, getDateOrderStatusLabel } from '@/lib/utils';
import DiceBearAvatar from '@/components/DiceBearAvatar';

function formatCountdown(ms: number): string {
    if (ms <= 0) return '0:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

interface DateOrderProgressProps {
    order: DateOrder;
    currentUserId?: string;
    className?: string;
}

type OrderStage = 'active' | 'matched' | 'confirmed' | 'completed';

export default function DateOrderProgress({
    order,
    currentUserId,
    className
}: DateOrderProgressProps) {
    const isCreator = currentUserId === order.creatorId;

    const stages = [
        { key: 'active', label: 'Cho ghep', icon: Clock },
        { key: 'matched', label: 'Da ghep', icon: CalendarHeart },
        { key: 'confirmed', label: 'Xac nhan', icon: UtensilsCrossed },
        { key: 'completed', label: 'Xong', icon: Star },
    ];

    let currentStageIndex = 0;
    if (order.status === 'matched') currentStageIndex = 1;
    if (order.status === 'confirmed') currentStageIndex = 2;
    if (order.status === 'completed') currentStageIndex = 3;

    const expiryMs = useMemo(() => {
        if (order.status !== 'active' || !order.expiresAt) return 0;
        return Math.max(0, new Date(order.expiresAt).getTime() - Date.now());
    }, [order.status, order.expiresAt]);

    return (
        <div className={cn('bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm', className)}>
            {/* Progress Bar */}
            <div className="px-6 pt-6">
                <div className="flex items-center justify-between mb-4 relative">
                    <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 -z-0 mx-4" />
                    {stages.map((s, idx) => (
                        <div key={s.key} className="flex flex-col items-center relative z-10 bg-white px-1">
                            <motion.div
                                className={cn(
                                    'w-10 h-10 rounded-full flex items-center justify-center transition-all border-2',
                                    idx <= currentStageIndex
                                        ? 'bg-primary-500 border-primary-500 text-white'
                                        : 'bg-white border-gray-200 text-gray-300'
                                )}
                                animate={idx === currentStageIndex ? { scale: [1, 1.1, 1] } : {}}
                            >
                                <s.icon className="w-5 h-5" />
                            </motion.div>
                            <span className={cn(
                                "text-[10px] font-bold mt-1 uppercase tracking-wide",
                                idx <= currentStageIndex ? "text-primary-600" : "text-gray-300"
                            )}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Countdown for active orders */}
            {order.status === 'active' && expiryMs > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">
                            Het han sau
                        </span>
                    </div>
                    <div className="font-mono font-bold text-lg tabular-nums text-amber-700">
                        {formatCountdown(expiryMs)}
                    </div>
                </motion.div>
            )}

            {/* Order Info */}
            <div className="px-6 py-4 bg-gray-50 border-y border-gray-100">
                <div className="flex items-center gap-4">
                    {order.restaurant && (
                        <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                            {order.restaurant.logoUrl ? (
                                <img src={order.restaurant.logoUrl} alt={order.restaurant.name} className="w-full h-full object-cover" />
                            ) : (
                                <UtensilsCrossed className="w-6 h-6 text-gray-400" />
                            )}
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{order.restaurant?.name || 'Nha hang'}</h3>
                        <p className="text-xs text-gray-500">{order.combo?.name} - {formatCurrency(order.comboPrice)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(order.dateTime)}</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Active: Waiting for match */}
                {order.status === 'active' && (
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-6 h-6 text-blue-600 animate-pulse" />
                        </div>
                        <h4 className="font-bold text-gray-900">
                            {isCreator ? 'Dang cho nguoi ung tuyen...' : 'Da ung tuyen'}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                            {order.applicantCount} nguoi da ung tuyen
                        </p>
                    </div>
                )}

                {/* Matched: Both paired, table being booked */}
                {order.status === 'matched' && (
                    <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CalendarHeart className="w-6 h-6 text-green-600" />
                        </div>
                        <h4 className="font-bold text-green-900">Da ghep doi thanh cong!</h4>
                        <p className="text-sm text-green-700 mt-1">
                            Ban da duoc dat cho tai nha hang. Hay den dung gio nhe!
                        </p>
                        {order.matchedUser && (
                            <div className="mt-4 flex items-center justify-center gap-3">
                                <DiceBearAvatar userId={order.matchedUser.id} size="md" />
                                <span className="text-sm font-medium text-gray-700">{order.matchedUser.name}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Completed */}
                {order.status === 'completed' && (
                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"
                        >
                            <Star className="w-8 h-8 text-white fill-white" />
                        </motion.div>
                        <h3 className="text-xl font-black text-gray-900">Hoan tat!</h3>
                        <p className="text-gray-500 text-sm mt-1">Cam on ban da su dung DineDate</p>
                    </div>
                )}

                {/* Expired / Cancelled */}
                {(order.status === 'expired' || order.status === 'cancelled') && (
                    <div className="text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <AlertTriangle className="w-6 h-6 text-gray-400" />
                        </div>
                        <h4 className="font-bold text-gray-600">{getDateOrderStatusLabel(order.status)}</h4>
                        <p className="text-sm text-gray-400 mt-1">
                            {order.status === 'expired' ? 'Don hang da het han.' : 'Don hang da bi huy.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
