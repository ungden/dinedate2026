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
    Star,
    Loader2,
    ShieldCheck,
    UserCheck
} from 'lucide-react';
import { ServiceBooking } from '@/types';
import { formatCurrency, cn, getActivityLabel } from '@/lib/utils';
import { PARTNER_EARNING_RATE } from '@/lib/platform';
import { completeBookingViaEdge } from '@/lib/booking';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface BookingProgressProps {
    booking: ServiceBooking;
    onCheckIn: () => void;
    onStart: () => void;
    onFinish: () => void;
    className?: string;
}

// status: pending -> accepted -> arrived -> in_progress -> completed_pending -> completed
type BookingStage = 'pending' | 'accepted' | 'arrived' | 'in_progress' | 'completed_pending' | 'completed';

export default function BookingProgress({
    booking,
    onCheckIn, // Refresh parent
    onStart,   // Refresh parent
    onFinish,  // Refresh parent
    className
}: BookingProgressProps) {
    const { user } = useAuth();
    const isUser = user?.id === booking.bookerId;
    const isPartner = user?.id === booking.providerId;

    const [stage, setStage] = useState<BookingStage>(booking.status as BookingStage);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    // Sync state from props
    useEffect(() => {
        setStage(booking.status as BookingStage);
        if (booking.status === 'in_progress') {
            setIsTimerRunning(true);
        } else {
            setIsTimerRunning(false);
        }
    }, [booking.status]);

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

    const handleGPSCheckIn = async () => {
        if (!navigator.geolocation) {
            toast.error('Thiết bị không hỗ trợ định vị');
            return;
        }

        setIsCheckingIn(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                try {
                    // Update check-in data to DB
                    const updateField = isPartner ? 'partner_checkin_location' : 'user_checkin_location';
                    const timeField = isPartner ? 'partner_checkin_at' : 'user_checkin_at';
                    
                    const { error } = await supabase.from('bookings').update({
                        [updateField]: coords,
                        [timeField]: new Date().toISOString(),
                        // If logic: if both checked in -> status = arrived (simplified: just clicking checkin moves UI)
                    }).eq('id', booking.id);

                    if (error) throw error;

                    toast.success('Check-in vị trí thành công! 📍');
                    
                    // Simple logic: if partner check-in, allow start. 
                    // Real logic: wait for both? For now let's say Partner controls the flow.
                    if (isPartner) {
                        await supabase.from('bookings').update({ status: 'arrived' }).eq('id', booking.id);
                        setStage('arrived');
                        onCheckIn();
                    }
                } catch (err: any) {
                    toast.error('Lỗi check-in: ' + err.message);
                } finally {
                    setIsCheckingIn(false);
                }
            },
            (err) => {
                toast.error('Không lấy được vị trí GPS. Hãy kiểm tra quyền truy cập.');
                setIsCheckingIn(false);
            }
        );
    };

    const handleStartJob = async () => {
        setIsProcessing(true);
        try {
            const { error } = await supabase.from('bookings').update({ 
                status: 'in_progress',
                started_at: new Date().toISOString()
            }).eq('id', booking.id);
            
            if (error) throw error;
            
            setStage('in_progress');
            setIsTimerRunning(true);
            onStart();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Partner marks as done
    const handlePartnerFinish = async () => {
        if (!confirm('Xác nhận đã hoàn thành công việc?')) return;
        setIsProcessing(true);
        try {
            // Update to completed_pending (waiting for user confirmation)
            // or directly call edge function with specific flag
            const { error } = await supabase.from('bookings').update({ 
                status: 'completed_pending' // Custom intermediate status
            }).eq('id', booking.id);

            if (error) throw error;
            
            setStage('completed_pending');
            setIsTimerRunning(false);
            toast.success('Đã gửi yêu cầu xác nhận thanh toán cho khách hàng.');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // User confirms payment release
    const handleUserConfirm = async () => {
        if (!confirm('Xác nhận hài lòng và chuyển tiền cho Partner?')) return;
        
        setIsProcessing(true);
        try {
            await completeBookingViaEdge(booking.id);
            setStage('completed');
            toast.success('Đã thanh toán thành công! Cảm ơn bạn.');
            onFinish();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const stages = [
        { key: 'accepted', label: 'Đã nhận', icon: CheckCircle },
        { key: 'arrived', label: 'Gặp mặt', icon: MapPin },
        { key: 'in_progress', label: 'Diễn ra', icon: Play },
        { key: 'completed', label: 'Xong', icon: Star },
    ];

    // Determine current index for progress bar
    let currentStageIndex = 0;
    if (stage === 'arrived') currentStageIndex = 1;
    if (stage === 'in_progress') currentStageIndex = 2;
    if (stage === 'completed_pending') currentStageIndex = 2; // still in progress bar visually
    if (stage === 'completed') currentStageIndex = 3;

    // Determine role-based info
    const otherPerson = isUser ? booking.provider : booking.booker;
    const isDayBooking = booking.service.duration === 'day';

    return (
        <div className={cn('bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm', className)}>
            {/* Progress Bar */}
            <div className="px-6 pt-6">
                <div className="flex items-center justify-between mb-4 relative">
                    {/* Line background */}
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
                                transition={{ duration: 1, repeat: idx === currentStageIndex ? Infinity : 0 }}
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

            {/* Info Section */}
            <div className="px-6 py-4 bg-gray-50 border-y border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Image
                            src={otherPerson.avatar}
                            alt={otherPerson.name}
                            width={56}
                            height={56}
                            className="rounded-2xl object-cover"
                        />
                        {/* Status dot */}
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{otherPerson.name}</h3>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            {getActivityLabel(booking.service.activity)} • {isDayBooking ? 'Theo ngày' : 'Theo buổi'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <motion.a
                            href={`tel:${otherPerson.phone || '0901234567'}`}
                            className="w-11 h-11 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shadow-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Phone className="w-5 h-5" />
                        </motion.a>
                        {/* Chat button could go here */}
                    </div>
                </div>
            </div>

            {/* Main Action Area */}
            <div className="p-6">
                
                {/* 1. State: ACCEPTED (Waiting to meet) */}
                {stage === 'accepted' && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start">
                            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-blue-900 text-sm">Đang chờ gặp mặt</p>
                                <p className="text-xs text-blue-700 mt-1">
                                    {isPartner 
                                        ? "Hãy di chuyển đến điểm hẹn. Bạn cần check-in GPS khi đến nơi."
                                        : "Partner đang di chuyển. Vui lòng đợi trong khoảng 30p - 1h."
                                    }
                                </p>
                            </div>
                        </div>

                        <motion.button
                            onClick={handleGPSCheckIn}
                            disabled={isCheckingIn}
                            className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isCheckingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                            <span>{isCheckingIn ? 'Đang định vị...' : 'Check-in tại điểm hẹn'}</span>
                        </motion.button>
                        <p className="text-center text-xs text-gray-400">
                            Yêu cầu bật GPS để xác thực
                        </p>
                    </div>
                )}

                {/* 2. State: ARRIVED (Met, Ready to start) */}
                {stage === 'arrived' && (
                    <div className="space-y-4">
                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3 items-start">
                            <UserCheck className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-yellow-900 text-sm">Xác nhận gặp mặt</p>
                                <p className="text-xs text-yellow-700 mt-1">
                                    {isPartner 
                                        ? "Đã check-in. Hãy xác nhận bạn đã gặp khách hàng để bắt đầu tính giờ."
                                        : "Partner đã đến. Hãy kiểm tra đúng người trước khi bắt đầu."
                                    }
                                </p>
                            </div>
                        </div>

                        {isPartner ? (
                            <motion.button
                                onClick={handleStartJob}
                                disabled={isProcessing}
                                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-green-600/30"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                                <span>Bắt đầu buổi hẹn</span>
                            </motion.button>
                        ) : (
                            <div className="text-center text-sm text-gray-500 py-2">
                                Chờ Partner bấm bắt đầu...
                            </div>
                        )}
                    </div>
                )}

                {/* 3. State: IN PROGRESS */}
                {stage === 'in_progress' && (
                    <div className="space-y-6">
                        <div className="text-center py-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-sm text-gray-500 font-medium mb-1">Thời gian diễn ra</p>
                            <div className="text-4xl font-black text-gray-900 font-mono tracking-wider">
                                {formatTime(elapsedTime)}
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-xs font-bold text-green-600 uppercase">Live Tracking</span>
                            </div>
                        </div>

                        {isPartner ? (
                            <motion.button
                                onClick={handlePartnerFinish}
                                disabled={isProcessing}
                                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5" />}
                                <span>Hoàn thành công việc</span>
                            </motion.button>
                        ) : (
                            <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-xl text-center">
                                Buổi hẹn đang diễn ra. Chúc bạn vui vẻ!
                            </div>
                        )}
                    </div>
                )}

                {/* 4. State: COMPLETED PENDING (Waiting for User confirmation) */}
                {stage === 'completed_pending' && (
                    <div className="space-y-4">
                        <div className="bg-green-50 p-5 rounded-2xl border border-green-100 text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <h4 className="font-bold text-green-900 text-lg">Partner đã báo hoàn thành</h4>
                            <p className="text-sm text-green-700 mt-1">
                                {isUser 
                                    ? "Vui lòng xác nhận để chuyển tiền cho Partner."
                                    : "Đang chờ khách hàng xác nhận thanh toán..."
                                }
                            </p>
                        </div>

                        {isUser ? (
                            <div className="grid gap-3">
                                <motion.button
                                    onClick={handleUserConfirm}
                                    disabled={isProcessing}
                                    className="w-full py-4 bg-gradient-primary text-white rounded-xl font-bold text-lg shadow-primary"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isProcessing ? "Đang xử lý..." : "Xác nhận & Thanh toán"}
                                </motion.button>
                                <button className="text-sm text-gray-500 font-medium hover:text-red-500 transition-colors">
                                    Có vấn đề? Báo cáo khiếu nại
                                </button>
                            </div>
                        ) : (
                            <div className="text-center text-xs text-gray-400 italic">
                                Tiền sẽ tự động về ví sau 24h nếu khách hàng không khiếu nại.
                            </div>
                        )}
                    </div>
                )}

                {/* 5. State: COMPLETED & PAID */}
                {stage === 'completed' && (
                    <div className="text-center py-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-20 h-20 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                        >
                            <Star className="w-10 h-10 text-white fill-white" />
                        </motion.div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Thành công! 🎉</h3>
                        <p className="text-gray-600 font-medium">
                            Đơn hàng đã hoàn tất và thanh toán.
                        </p>
                        {isPartner && (
                            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-xl font-bold border border-green-100 inline-block">
                                + {formatCurrency(booking.escrowAmount * PARTNER_EARNING_RATE)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}