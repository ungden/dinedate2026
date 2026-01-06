'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import Image from 'next/image';
import {
    MapPin,
    Clock,
    Phone,
    Play,
    Square,
    Star,
    Loader2,
    CheckCircle,
    UserCheck,
    Shield,
    Info,
    ShieldCheck,
    EyeOff,
    MessageCircle
} from 'lucide-react';
import { ServiceBooking } from '@/types';
import { formatCurrency, cn, getActivityLabel } from '@/lib/utils';
import { PARTNER_EARNING_RATE } from '@/lib/platform';
import { completeBookingViaEdge } from '@/lib/booking';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { getOrCreateConversation } from '@/hooks/useDbChat';
import { useRouter } from 'next/navigation';

interface BookingProgressProps {
    booking: ServiceBooking;
    onCheckIn: () => void;
    onStart: () => void;
    onFinish: () => void;
    className?: string;
}

type BookingStage = 'pending' | 'accepted' | 'arrived' | 'in_progress' | 'completed_pending' | 'completed';

export default function BookingProgress({
    booking,
    onCheckIn,
    onStart,
    onFinish,
    className
}: BookingProgressProps) {
    const { user } = useAuth();
    const router = useRouter();
    const isUser = user?.id === booking.bookerId;
    const isPartner = user?.id === booking.providerId;

    const [stage, setStage] = useState<BookingStage>(booking.status as BookingStage);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isOpeningChat, setIsOpeningChat] = useState(false);

    // Review State
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);

    useEffect(() => {
        setStage(booking.status as BookingStage);
        setIsTimerRunning(booking.status === 'in_progress');
        checkReviewStatus();
    }, [booking.status]);

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

    const checkReviewStatus = async () => {
        if (booking.status !== 'completed') return;
        
        const { data } = await supabase
            .from('reviews')
            .select('id')
            .eq('booking_id', booking.id)
            .eq('reviewer_id', user?.id)
            .maybeSingle();
        
        if (data) setHasReviewed(true);
    };

    const handleOpenChat = async () => {
        if (!user) return;
        setIsOpeningChat(true);
        try {
            const otherId = isUser ? booking.providerId : booking.bookerId;
            const convId = await getOrCreateConversation(user.id, otherId, booking.id);
            if (convId) {
                router.push(`/chat/${convId}`);
            } else {
                toast.error('Không thể mở chat');
            }
        } catch (e) {
            console.error(e);
            toast.error('Lỗi kết nối chat');
        } finally {
            setIsOpeningChat(false);
        }
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
                    const updateField = isPartner ? 'partner_checkin_location' : 'user_checkin_location';
                    const timeField = isPartner ? 'partner_checkin_at' : 'user_checkin_at';
                    
                    const { error } = await supabase.from('bookings').update({
                        [updateField]: coords,
                        [timeField]: new Date().toISOString(),
                    }).eq('id', booking.id);

                    if (error) throw error;

                    toast.success('Check-in vị trí thành công! 📍');
                    
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

    const handlePartnerFinish = async () => {
        if (!confirm('Xác nhận đã hoàn thành công việc?')) return;
        setIsProcessing(true);
        try {
            const { error } = await supabase.from('bookings').update({ 
                status: 'completed_pending'
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

    const handleSubmitReview = async () => {
        if (!comment.trim()) {
            toast.error('Vui lòng viết vài dòng nhận xét');
            return;
        }
        setIsReviewing(true);
        try {
            const revieweeId = isUser ? booking.providerId : booking.bookerId;

            const { error } = await supabase.from('reviews').insert({
                booking_id: booking.id,
                reviewer_id: user?.id,
                reviewee_id: revieweeId,
                rating: rating,
                comment: comment.trim(),
                is_hidden: isPartner // If partner reviews, hide it from public (admin control/internal score)
            });

            if (error) throw error;

            toast.success('Cảm ơn bạn đã đánh giá! 🌟');
            setHasReviewed(true);
        } catch (err: any) {
            toast.error('Lỗi gửi đánh giá: ' + err.message);
        } finally {
            setIsReviewing(false);
        }
    };

    const stages = [
        { key: 'accepted', label: 'Đã nhận', icon: CheckCircle },
        { key: 'arrived', label: 'Gặp mặt', icon: MapPin },
        { key: 'in_progress', label: 'Diễn ra', icon: Play },
        { key: 'completed', label: 'Xong', icon: Star },
    ];

    let currentStageIndex = 0;
    if (stage === 'arrived') currentStageIndex = 1;
    if (stage === 'in_progress') currentStageIndex = 2;
    if (stage === 'completed_pending') currentStageIndex = 2;
    if (stage === 'completed') currentStageIndex = 3;

    const otherPerson = isUser ? booking.provider : booking.booker;
    const isDayBooking = booking.service.duration === 'day';

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
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* 1. Accepted: CHAT FIRST */}
                {stage === 'accepted' && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <MessageCircle className="w-6 h-6 text-blue-600" />
                            </div>
                            <h4 className="font-bold text-blue-900">Kết nối thành công! 🎉</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Hãy nhắn tin để thống nhất <b>thời gian và địa điểm</b> gặp mặt chính xác.
                            </p>
                        </div>

                        <motion.button
                            onClick={handleOpenChat}
                            disabled={isOpeningChat}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isOpeningChat ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                            <span>Chat ngay</span>
                        </motion.button>

                        <div className="pt-4 border-t border-gray-100 mt-4">
                            <motion.button
                                onClick={handleGPSCheckIn}
                                disabled={isCheckingIn}
                                className="w-full py-3 bg-white border-2 border-gray-100 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-200 transition-colors"
                            >
                                {isCheckingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                                <span>Đã đến điểm hẹn (Check-in GPS)</span>
                            </motion.button>
                            <p className="text-center text-[10px] text-gray-400 mt-2">
                                {isPartner ? "Partner: Cần check-in khi đến nơi để bắt đầu tính giờ." : "User: Có thể check-in để thông báo đã đến."}
                            </p>
                        </div>
                    </div>
                )}

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
                            <div className="text-center text-sm text-gray-500 py-2">Chờ Partner bấm bắt đầu...</div>
                        )}
                    </div>
                )}

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
                    <div className="space-y-6">
                        <div className="text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"
                            >
                                <Star className="w-8 h-8 text-white fill-white" />
                            </motion.div>
                            <h3 className="text-2xl font-black text-gray-900 mb-1">Hoàn tất! 🎉</h3>
                            <p className="text-gray-600 font-medium">Đơn hàng đã thanh toán.</p>
                            {isPartner && (
                                <div className="mt-3 p-2 px-4 bg-green-50 text-green-700 rounded-xl font-bold border border-green-100 inline-block text-sm">
                                    + {formatCurrency(booking.escrowAmount * PARTNER_EARNING_RATE)}
                                </div>
                            )}
                        </div>

                        {/* Review Form (For BOTH User and Partner) */}
                        {!hasReviewed && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                                    <h4 className="font-bold text-yellow-900">
                                        Đánh giá {booking.providerId === user?.id ? 'khách hàng' : 'Partner'}
                                    </h4>
                                </div>
                                
                                {isPartner ? (
                                    <p className="text-xs text-yellow-800 mb-4 flex items-start gap-1.5">
                                        <EyeOff className="w-4 h-4 flex-shrink-0" />
                                        <span>Đánh giá này sẽ <b>ẩn với khách hàng</b> và chỉ dùng để xây dựng điểm tín nhiệm hệ thống.</span>
                                    </p>
                                ) : (
                                    <p className="text-xs text-yellow-800 mb-4">
                                        Đánh giá của bạn giúp cộng đồng an toàn hơn và giúp Partner uy tín có thêm cơ hội.
                                    </p>
                                )}
                                
                                <div className="flex justify-center gap-2 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className="focus:outline-none transition-transform active:scale-90"
                                        >
                                            <Star 
                                                className={cn(
                                                    "w-8 h-8", 
                                                    star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                                                )} 
                                            />
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={isPartner ? "Khách hàng có lịch sự và đúng giờ không?" : "Bạn thấy buổi hẹn thế nào?"}
                                    className="w-full p-3 rounded-xl border border-yellow-200 bg-white text-sm focus:ring-2 focus:ring-yellow-400 outline-none mb-3 resize-none"
                                    rows={3}
                                />

                                <button
                                    onClick={handleSubmitReview}
                                    disabled={isReviewing}
                                    className="w-full py-3 bg-yellow-500 text-white rounded-xl font-bold shadow-md hover:bg-yellow-600 transition flex items-center justify-center gap-2"
                                >
                                    {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    Gửi đánh giá
                                </button>
                            </motion.div>
                        )}

                        {hasReviewed && (
                            <div className="p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-500 italic">
                                Cảm ơn bạn đã gửi đánh giá!
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}