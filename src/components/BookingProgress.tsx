'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import Image from 'next/image';
import {
    MapPin,
    Clock,
    Phone,
    MessageCircle,
    Navigation,
    CheckCircle,
    Play,
    Square,
    Timer,
    AlertTriangle,
    Camera,
    Star
} from 'lucide-react';
import { ServiceBooking, User } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { PARTNER_EARNING_RATE } from '@/lib/platform';

interface BookingProgressProps {
    booking: ServiceBooking;
    onCheckIn: () => void;
    onStart: () => void;
    onFinish: () => void;
    className?: string;
}

type BookingStage = 'pending' | 'accepted' | 'arrived' | 'in_progress' | 'completed';

export default function BookingProgress({
    booking,
    onCheckIn,
    onStart,
    onFinish,
    className
}: BookingProgressProps) {
    const [stage, setStage] = useState<BookingStage>(
        booking.status === 'in_progress' ? 'in_progress' :
            booking.status === 'accepted' ? 'accepted' : 'pending'
    );
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCheckIn = () => {
        setStage('arrived');
        onCheckIn();
    };

    const handleStart = () => {
        setStage('in_progress');
        setIsTimerRunning(true);
        onStart();
    };

    const handleFinish = () => {
        setStage('completed');
        setIsTimerRunning(false);
        onFinish();
    };

    const stages = [
        { key: 'accepted', label: 'Đã nhận đơn', icon: CheckCircle },
        { key: 'arrived', label: 'Đã đến nơi', icon: MapPin },
        { key: 'in_progress', label: 'Đang diễn ra', icon: Play },
        { key: 'completed', label: 'Hoàn thành', icon: Star },
    ];

    const currentStageIndex = stages.findIndex(s => s.key === stage);

    return (
        <div className={cn('bg-white rounded-2xl border border-gray-100 overflow-hidden', className)}>
            {/* Progress Bar */}
            <div className="px-6 pt-6">
                <div className="flex items-center justify-between mb-4">
                    {stages.map((s, idx) => (
                        <div key={s.key} className="flex items-center">
                            <motion.div
                                className={cn(
                                    'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                                    idx <= currentStageIndex
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-100 text-gray-400'
                                )}
                                animate={idx === currentStageIndex ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ duration: 1, repeat: idx === currentStageIndex ? Infinity : 0 }}
                            >
                                <s.icon className="w-5 h-5" />
                            </motion.div>
                            {idx < stages.length - 1 && (
                                <div className={cn(
                                    'w-8 sm:w-16 h-1 mx-1 rounded-full transition-all',
                                    idx < currentStageIndex ? 'bg-primary-500' : 'bg-gray-200'
                                )} />
                            )}
                        </div>
                    ))}
                </div>
                <p className="text-center text-sm text-gray-600 mb-4">
                    {stages[currentStageIndex]?.label}
                </p>
            </div>

            {/* Customer Info */}
            <div className="px-6 py-4 border-t border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-4">
                    <Image
                        src={booking.booker.avatar}
                        alt={booking.booker.name}
                        width={56}
                        height={56}
                        className="rounded-full"
                    />
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{booking.booker.name}</h3>
                        <p className="text-sm text-gray-500">{booking.service.title}</p>
                    </div>
                    <div className="flex gap-2">
                        <motion.a
                            href={`tel:${booking.booker.phone || '0901234567'}`}
                            className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Phone className="w-5 h-5 text-green-600" />
                        </motion.a>
                        <motion.button
                            className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <MessageCircle className="w-5 h-5 text-primary-600" />
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Location & Time */}
            <div className="px-6 py-4 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-gray-500">Địa điểm hẹn</p>
                        <p className="font-medium text-gray-900">{booking.location}</p>
                    </div>
                    <motion.button
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Navigation className="w-4 h-4" />
                        <span>Chỉ đường</span>
                    </motion.button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-gray-500">Thời gian hẹn</p>
                        <p className="font-medium text-gray-900">{booking.time} - {booking.date}</p>
                    </div>
                </div>
            </div>

            {/* Timer Display (when in progress) */}
            <AnimatePresence>
                {stage === 'in_progress' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-6 py-4 bg-primary-50"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <Timer className="w-6 h-6 text-primary-600 animate-pulse" />
                            <span className="text-3xl font-mono font-bold text-primary-600">
                                {formatTime(elapsedTime)}
                            </span>
                        </div>
                        <p className="text-center text-sm text-primary-600 mt-1">
                            Thời gian đang chạy
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Earnings Preview */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                    <span className="text-gray-600">Thu nhập dự kiến</span>
                    <span className="text-xl font-bold text-primary-600">
                        {formatCurrency(booking.escrowAmount * PARTNER_EARNING_RATE)}
                    </span>
                </div>
                <p className="text-xs text-gray-500 text-right mt-1">Sau khi trừ phí nền tảng (30%)</p>
            </div>

            {/* Action Buttons */}
            <div className="p-6">
                {stage === 'accepted' && (
                    <motion.button
                        onClick={handleCheckIn}
                        className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <MapPin className="w-5 h-5" />
                        <span>Đã đến nơi hẹn</span>
                    </motion.button>
                )}

                {stage === 'arrived' && (
                    <div className="space-y-3">
                        <div className="p-3 bg-yellow-50 rounded-xl flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-800">
                                Xác nhận bạn đã gặp khách trước khi bắt đầu tính giờ
                            </p>
                        </div>
                        <motion.button
                            onClick={handleStart}
                            className="w-full py-4 bg-green-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Play className="w-5 h-5" />
                            <span>Bắt đầu tính giờ</span>
                        </motion.button>
                    </div>
                )}

                {stage === 'in_progress' && (
                    <motion.button
                        onClick={handleFinish}
                        className="w-full py-4 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Square className="w-5 h-5" />
                        <span>Hoàn thành</span>
                    </motion.button>
                )}

                {stage === 'completed' && (
                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"
                        >
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </motion.div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Hoàn thành! 🎉</h3>
                        <p className="text-gray-600">
                            Tổng thời gian: {formatTime(elapsedTime)}
                        </p>
                        <p className="text-lg font-bold text-primary-600 mt-2">
                            +{formatCurrency(booking.escrowAmount * PARTNER_EARNING_RATE)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}