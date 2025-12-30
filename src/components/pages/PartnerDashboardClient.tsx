'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import Image from 'next/image';
import Link from 'next/link';
import {
    Power,
    DollarSign,
    Clock,
    Calendar,
    TrendingUp,
    Bell,
    CheckCircle,
    XCircle,
    MapPin,
    Star,
    ChevronRight,
    Zap,
    Timer
} from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { formatCurrency, cn } from '@/lib/utils';
import { ServiceBooking } from '@/types';

// Mock booking request for demonstration
const MOCK_NEW_REQUEST: ServiceBooking = {
    id: 'req-1',
    serviceId: 's1',
    providerId: '1',
    provider: {} as any,
    bookerId: 'customer-1',
    booker: {
        id: 'customer-1',
        name: 'Quốc Anh',
        age: 28,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        bio: 'Đi công tác, muốn có người cùng ăn tối',
        location: 'Quận 1, TP.HCM',
        wallet: { balance: 2000000, escrowBalance: 0, currency: 'VND' },
        vipStatus: { tier: 'gold', benefits: [] },
        rating: 4.8,
        reviewCount: 12
    },
    service: {
        id: 's1',
        activity: 'dining',
        title: 'Đi ăn tối',
        description: 'Cùng ăn tối tại nhà hàng',
        price: 300000,
        available: true
    },
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    location: 'Nhà hàng ABC, Quận 1',
    message: 'Mình đi công tác, muốn có bạn cùng ăn tối. Hi vọng bạn có thể đến!',
    status: 'pending',
    isPaid: true,
    escrowAmount: 900000,
    createdAt: new Date().toISOString()
};

export default function PartnerDashboardClient() {
    const [isOnline, setIsOnline] = useState(true);
    const [showNewRequest, setShowNewRequest] = useState(false);
    const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
    const { getReceivedBookings, currentUser } = useDateStore();

    // Mock statistics
    const todayEarnings = 1200000;
    const todayHours = 4;
    const weekEarnings = 5600000;
    const pendingBookings = 2;
    const completedToday = 3;

    // Simulate incoming request after 3 seconds
    useEffect(() => {
        if (isOnline) {
            const timer = setTimeout(() => {
                setShowNewRequest(true);
                setCountdown(300);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline]);

    // Countdown timer
    useEffect(() => {
        if (showNewRequest && countdown > 0) {
            const timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [showNewRequest, countdown]);

    const formatCountdown = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAccept = () => {
        setShowNewRequest(false);
        alert('Đã chấp nhận yêu cầu! 🎉 Bạn có thể xem chi tiết trong mục "Quản lý đơn"');
    };

    const handleReject = () => {
        setShowNewRequest(false);
        alert('Đã từ chối yêu cầu');
    };

    return (
        <div className="space-y-6">
            {/* Header with Toggle */}
            <motion.div
                className="bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 rounded-3xl p-6 text-white relative overflow-hidden"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-300 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold">Partner Dashboard</h1>
                            <p className="text-white/80">Xin chào, {currentUser.name}!</p>
                        </div>

                        {/* Status Toggle */}
                        <motion.button
                            onClick={() => setIsOnline(!isOnline)}
                            className={cn(
                                'flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold transition-all',
                                isOnline
                                    ? 'bg-green-500 shadow-lg shadow-green-500/30'
                                    : 'bg-gray-600 shadow-lg shadow-gray-600/30'
                            )}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <Power className="w-5 h-5" />
                            <span>{isOnline ? 'Đang hoạt động' : 'Tạm nghỉ'}</span>
                            <motion.div
                                className={cn(
                                    'w-3 h-3 rounded-full',
                                    isOnline ? 'bg-white animate-pulse' : 'bg-gray-400'
                                )}
                            />
                        </motion.button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-5 h-5 text-yellow-300" />
                                <span className="text-white/80 text-sm">Thu nhập hôm nay</span>
                            </div>
                            <p className="text-2xl font-bold">{formatCurrency(todayEarnings)}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-blue-300" />
                                <span className="text-white/80 text-sm">Số giờ làm</span>
                            </div>
                            <p className="text-2xl font-bold">{todayHours} giờ</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Status Banner */}
            <AnimatePresence>
                {isOnline && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3"
                    >
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Zap className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-green-800">Đang sẵn sàng nhận đơn</p>
                            <p className="text-sm text-green-600">Bạn sẽ nhận được thông báo khi có đơn mới</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Statistics Cards */}
            <motion.div
                className="grid grid-cols-2 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <TrendingUp className="w-8 h-8 text-primary-500" />
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">+15%</span>
                    </div>
                    <p className="text-sm text-gray-500">Thu nhập tuần này</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(weekEarnings)}</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <Calendar className="w-8 h-8 text-purple-500" />
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded-full">{pendingBookings} đang chờ</span>
                    </div>
                    <p className="text-sm text-gray-500">Đơn hôm nay</p>
                    <p className="text-xl font-bold text-gray-900">{completedToday} hoàn thành</p>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="p-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Quản lý nhanh</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    <Link href="/manage-bookings" className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Quản lý đơn đặt</p>
                                <p className="text-sm text-gray-500">{pendingBookings} đơn đang chờ xử lý</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>

                    <Link href="/manage-services" className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Zap className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Dịch vụ của tôi</p>
                                <p className="text-sm text-gray-500">Cập nhật giá và dịch vụ</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>

                    <Link href="/wallet" className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Ví tiền</p>
                                <p className="text-sm text-gray-500">Số dư: {formatCurrency(currentUser.wallet.balance)}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>

                    <Link href="/reviews" className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <Star className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Đánh giá</p>
                                <p className="text-sm text-gray-500">4.8 ⭐ (156 đánh giá)</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>
                </div>
            </motion.div>

            {/* New Request Popup - Like Grab/Gojek */}
            <AnimatePresence>
                {showNewRequest && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-t-3xl w-full max-w-md overflow-hidden"
                            initial={{ y: 300 }}
                            animate={{ y: 0 }}
                            exit={{ y: 300 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        >
                            {/* Header with Countdown */}
                            <div className="bg-gradient-to-r from-primary-500 to-purple-500 p-4">
                                <div className="flex items-center justify-between text-white">
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-5 h-5 animate-bounce" />
                                        <span className="font-bold">Đơn mới!</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                                        <Timer className="w-4 h-4" />
                                        <span className="font-mono font-bold">{formatCountdown(countdown)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Customer Info */}
                                <div className="flex items-center gap-4">
                                    <Image
                                        src={MOCK_NEW_REQUEST.booker.avatar}
                                        alt={MOCK_NEW_REQUEST.booker.name}
                                        width={60}
                                        height={60}
                                        className="rounded-full"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-900">{MOCK_NEW_REQUEST.booker.name}</h3>
                                            {MOCK_NEW_REQUEST.booker.vipStatus.tier !== 'free' && (
                                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                                    VIP
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span>{MOCK_NEW_REQUEST.booker.rating} ({MOCK_NEW_REQUEST.booker.reviewCount} đánh giá)</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primary-600">
                                            {formatCurrency(MOCK_NEW_REQUEST.escrowAmount)}
                                        </p>
                                        <p className="text-xs text-gray-500">3 giờ</p>
                                    </div>
                                </div>

                                {/* Booking Details */}
                                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-xl">
                                            🍽️
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{MOCK_NEW_REQUEST.service.title}</p>
                                            <p className="text-sm text-gray-500">{MOCK_NEW_REQUEST.service.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-700">Hôm nay, {MOCK_NEW_REQUEST.time}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-700">{MOCK_NEW_REQUEST.location}</span>
                                    </div>
                                </div>

                                {/* Message */}
                                {MOCK_NEW_REQUEST.message && (
                                    <div className="bg-blue-50 rounded-xl p-4">
                                        <p className="text-sm text-blue-800 italic">"{MOCK_NEW_REQUEST.message}"</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <motion.button
                                        onClick={handleReject}
                                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <XCircle className="w-5 h-5" />
                                        <span>Từ chối</span>
                                    </motion.button>
                                    <motion.button
                                        onClick={handleAccept}
                                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        <span>Chấp nhận</span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}