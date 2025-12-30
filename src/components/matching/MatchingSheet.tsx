'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, Users, Trash2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import RequestCountdown from '@/components/RequestCountdown';
import { Application, DateRequest } from '@/types';

export default function MatchingSheet({
  isOpen,
  onClose,
  request,
  applications,
  onSelectApplicant,
  onDeleteRequest,
  onGoToMessages,
}: {
  isOpen: boolean;
  onClose: () => void;
  request: DateRequest;
  applications: Application[];
  onSelectApplicant: (userId: string) => void;
  onDeleteRequest: () => void;
  onGoToMessages: () => void;
}) {
  const isActive = request.status === 'active';
  const isMatched = request.status === 'matched';
  const isExpired = request.status === 'expired';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full md:max-w-xl bg-white rounded-t-[32px] md:rounded-[32px] overflow-hidden shadow-2xl border border-white"
            initial={{ y: 80, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 80, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero / Summary */}
            <div className="relative px-5 pt-5 pb-4 bg-mesh border-b border-gray-100">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-gray-600 hover:bg-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4 pr-12">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                  <Image
                    src={request.user.avatar}
                    alt={request.user.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Ghép cặp lời mời
                  </p>

                  <h3 className="text-[18px] sm:text-[20px] font-black text-gray-900 leading-tight mt-1 line-clamp-2">
                    {request.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <RequestCountdown
                      expiresAt={request.expiresAt}
                      status={request.status}
                    />
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold">
                      <Users className="w-4 h-4" />
                      {applications.length} người muốn đi cùng
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              {isMatched && (
                <div className="mt-4 px-4 py-3 rounded-2xl bg-green-50 border border-green-100 text-green-700 text-sm font-semibold flex items-center justify-between gap-3">
                  <span>Đã match! Mở tin nhắn để trò chuyện.</span>
                  <button
                    onClick={onGoToMessages}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white font-black text-xs hover:opacity-90 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Mở chat
                  </button>
                </div>
              )}

              {isExpired && (
                <div className="mt-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-semibold">
                  Lời mời đã hết hạn (15 phút). Bạn có thể tạo lời mời mới.
                </div>
              )}
            </div>

            {/* Candidate List */}
            <div className="max-h-[55vh] md:max-h-[60vh] overflow-y-auto">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Danh sách ứng viên
                  </p>
                  {isActive && (
                    <button
                      onClick={onDeleteRequest}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-600 font-black text-xs hover:bg-red-100 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Huỷ lời mời
                    </button>
                  )}
                </div>

                {applications.length === 0 ? (
                  <div className="ios-card p-5 bg-white">
                    <p className="text-gray-900 font-black text-lg">Chưa có ai ứng tuyển</p>
                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                      Khi có partner ứng tuyển, bạn sẽ thấy họ xuất hiện ở đây để chọn và match ngay.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <div
                        key={app.id}
                        className="ios-card p-4 bg-white flex items-center gap-3"
                      >
                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0">
                          <Image
                            src={app.user.avatar}
                            alt={app.user.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-black text-gray-900 truncate">
                            {app.user.name}
                          </p>
                          <p className="text-[12px] text-gray-500 truncate">
                            {app.user.location}
                          </p>
                          <p className="text-[13px] text-gray-500 mt-2 line-clamp-2 italic">
                            “{app.message}”
                          </p>
                        </div>

                        <button
                          onClick={() => onSelectApplicant(app.userId)}
                          disabled={!isActive}
                          className={cn(
                            'px-4 py-2.5 rounded-2xl font-black text-sm transition tap-highlight flex-shrink-0',
                            isActive
                              ? 'bg-gradient-primary text-white shadow-primary'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          )}
                        >
                          Chọn
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-white/80 backdrop-blur">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-gray-100 text-gray-700 font-black tap-highlight hover:bg-gray-200 transition"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}