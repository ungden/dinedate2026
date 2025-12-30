'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from '@/lib/motion';
import { Search, MessageCircle, X, ChevronRight, Sparkles } from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import { formatRelativeTime, cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2 },
  },
};

export default function MessagesClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const { getMyConversations, currentUser } = useDateStore();
  const conversations = getMyConversations();

  const filteredConversations = searchQuery
    ? conversations.filter((c) => {
      const otherUser = c.participants.find((p) => p.id !== currentUser.id);
      return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    : conversations;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tin nhắn</h1>
          <p className="text-gray-600">Quản lý các cuộc hội thoại của bạn</p>
        </div>
        {conversations.length > 0 && (
          <span className="px-3 py-1 bg-primary-100 text-primary-600 text-sm font-semibold rounded-full">
            {conversations.length} cuộc trò chuyện
          </span>
        )}
      </motion.div>

      {/* Search */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm cuộc hội thoại..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-primary pl-12"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </motion.div>

      {/* Conversations List */}
      {filteredConversations.length > 0 ? (
        <motion.div
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredConversations.map((conversation) => {
            const otherUser = conversation.participants.find(
              (p) => p.id !== currentUser.id
            );
            if (!otherUser) return null;

            const isUnread = conversation.lastMessage &&
              !conversation.lastMessage.read &&
              conversation.lastMessage.senderId !== currentUser.id;

            return (
              <motion.div key={conversation.id} variants={itemVariants}>
                <Link href={`/chat/${conversation.id}`}>
                  <motion.div
                    className={cn(
                      'flex items-center gap-4 p-4 transition-colors',
                      isUnread ? 'bg-primary-50/50' : 'hover:bg-gray-50'
                    )}
                    whileHover={{ x: 4 }}
                    whileTap={{ backgroundColor: 'rgba(240, 81, 108, 0.1)' }}
                  >
                    <div className="relative flex-shrink-0">
                      <Image
                        src={otherUser.avatar}
                        alt={otherUser.name}
                        width={56}
                        height={56}
                        className="rounded-2xl object-cover ring-2 ring-gray-100"
                      />
                      {otherUser.onlineStatus?.isOnline && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className={cn(
                            'font-semibold truncate',
                            isUnread ? 'text-gray-900' : 'text-gray-700'
                          )}>
                            {otherUser.name}
                          </h3>
                          {otherUser.vipStatus.tier !== 'free' && (
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <span className={cn(
                            'text-xs flex-shrink-0',
                            isUnread ? 'text-primary-600 font-semibold' : 'text-gray-400'
                          )}>
                            {formatRelativeTime(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <p className={cn(
                          'text-sm truncate flex-1',
                          isUnread ? 'text-gray-900 font-medium' : 'text-gray-500'
                        )}>
                          {conversation.lastMessage
                            ? `${conversation.lastMessage.senderId === currentUser.id
                              ? 'Bạn: '
                              : ''
                            }${conversation.lastMessage.text}`
                            : 'Bắt đầu cuộc trò chuyện'}
                        </p>

                        {isUnread && (
                          <span className="w-2.5 h-2.5 bg-primary-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-primary"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <MessageCircle className="w-10 h-10 text-white" />
          </motion.div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có tin nhắn nào'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            {searchQuery
              ? 'Thử tìm kiếm với từ khóa khác'
              : 'Bắt đầu kết nối với mọi người qua các lời mời hẹn hò hoặc dịch vụ'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <motion.button
                className="btn-primary"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Khám phá lời mời
              </motion.button>
            </Link>
            <Link href="/members">
              <motion.button
                className="btn-secondary"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Tìm thành viên
              </motion.button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
