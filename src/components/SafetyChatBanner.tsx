'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Shield, X, AlertTriangle, Lock, MapPin, Camera, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafetyChatBannerProps {
    isBookingAccepted?: boolean;
    className?: string;
}

export default function SafetyChatBanner({ isBookingAccepted = true, className }: SafetyChatBannerProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);

    if (isDismissed) return null;

    // If booking not accepted, show lock message
    if (!isBookingAccepted) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    'bg-gray-100 rounded-xl p-4 flex items-center gap-3',
                    className
                )}
            >
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1">
                    <p className="font-medium text-gray-700">Chat đang bị khóa</p>
                    <p className="text-sm text-gray-500">
                        Bạn chỉ có thể nhắn tin sau khi yêu cầu đặt lịch được chấp nhận
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl overflow-hidden',
                className
            )}
        >
            {/* Main Warning */}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-yellow-800">Lưu ý an toàn</h4>
                            <button
                                onClick={() => setIsDismissed(true)}
                                className="p-1 hover:bg-yellow-200 rounded-full transition"
                            >
                                <X className="w-4 h-4 text-yellow-600" />
                            </button>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                            Luôn gặp nhau ở <strong>địa điểm công cộng</strong> và thông báo cho người thân biết.
                        </p>
                    </div>
                </div>

                {/* Toggle Details */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-sm text-yellow-700 font-medium mt-2 hover:underline"
                >
                    {isExpanded ? 'Thu gọn' : 'Xem thêm hướng dẫn an toàn'}
                </button>
            </div>

            {/* Expanded Safety Tips */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-yellow-200 bg-white/50"
                    >
                        <div className="p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-800">Không chuyển tiền riêng</p>
                                    <p className="text-sm text-gray-600">
                                        Mọi giao dịch phải thực hiện qua ví DineDate để được bảo vệ
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Lock className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-800">Không vào nơi riêng tư</p>
                                    <p className="text-sm text-gray-600">
                                        Tránh đến nhà riêng, khách sạn hoặc địa điểm vắng người
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-800">Chia sẻ vị trí</p>
                                    <p className="text-sm text-gray-600">
                                        Sử dụng tính năng chia sẻ vị trí để người thân biết bạn đang ở đâu
                                    </p>
                                </div>
                            </div>

                            <a
                                href="#"
                                className="flex items-center gap-2 text-sm text-primary-600 font-medium hover:underline"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Xem đầy đủ hướng dẫn an toàn
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Quick action buttons for chat
interface ChatQuickActionsProps {
    onShareLocation: () => void;
    onShareImage: () => void;
    className?: string;
}

export function ChatQuickActions({ onShareLocation, onShareImage, className }: ChatQuickActionsProps) {
    return (
        <div className={cn('flex gap-2', className)}>
            <motion.button
                onClick={onShareLocation}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <MapPin className="w-4 h-4" />
                <span>Gửi vị trí</span>
            </motion.button>

            <motion.button
                onClick={onShareImage}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <Camera className="w-4 h-4" />
                <span>Gửi ảnh</span>
            </motion.button>
        </div>
    );
}
