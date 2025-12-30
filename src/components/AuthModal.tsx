'use client';

import { motion, AnimatePresence } from '@/lib/motion';
import { Heart, X, LogIn, UserPlus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    actionType?: 'book' | 'chat' | 'like' | 'generic';
}

export default function AuthModal({
    isOpen,
    onClose,
    title = 'Bạn cần đăng nhập',
    description = 'Đăng nhập để tận hưởng đầy đủ tính năng và kết nối với những đối tác tuyệt vời nhất.',
    actionType = 'generic'
}: AuthModalProps) {

    const getContent = () => {
        switch (actionType) {
            case 'book':
                return {
                    icon: <Sparkles className="w-12 h-12 text-primary-500" />,
                    title: 'Sắp xong rồi!',
                    description: 'Chỉ còn một bước cuối cùng để gửi yêu cầu đặt lịch. Hãy đăng nhập để hoàn tất quá trình này.'
                };
            case 'chat':
                return {
                    icon: <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}><LogIn className="w-12 h-12 text-blue-500" /></motion.div>,
                    title: 'Kết nối ngay bây giờ',
                    description: 'Đăng nhập để bắt đầu cuộc trò chuyện và tìm hiểu thêm về đối tác của bạn.'
                };
            case 'like':
                return {
                    icon: <Heart className="w-12 h-12 text-red-500 fill-red-500" />,
                    title: 'Lưu vào yêu thích',
                    description: 'Đăng nhập để lưu đối tác này vào danh sách yêu thích và xem lại sau.'
                };
            default:
                return { icon: <LogIn className="w-12 h-12 text-primary-500" />, title, description };
        }
    };

    const content = getContent();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden relative shadow-2xl"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>

                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                {content.icon}
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {content.title}
                            </h3>
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                {content.description}
                            </p>

                            <div className="space-y-3">
                                <Link href="/login" className="block w-full">
                                    <motion.button
                                        className="w-full py-4 bg-gradient-primary text-white rounded-2xl font-bold text-lg shadow-primary"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Đăng nhập ngay
                                    </motion.button>
                                </Link>

                                <Link href="/register" className="block w-full">
                                    <motion.button
                                        className="w-full py-4 bg-gray-50 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-colors"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Tạo tài khoản mới
                                    </motion.button>
                                </Link>
                            </div>

                            <p className="mt-6 text-xs text-gray-400">
                                Bằng cách tiếp tục, bạn đồng ý với Điều khoản & Chính sách của DineDate.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
