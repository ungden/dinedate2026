'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Phone,
  Video,
  Image as ImageIcon,
  Smile,
  Check,
  CheckCheck,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useConversation } from '@/hooks/useDbChat';
import { formatRelativeTime, cn, getVIPBadgeColor } from '@/lib/utils';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const { user } = useAuth();
  
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, partner, loading, sendMessage } = useConversation(conversationId);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const text = newMessage.trim();
    setNewMessage('');
    
    try {
      await sendMessage(text);
      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
      alert('Gửi tin nhắn thất bại');
      setNewMessage(text); // revert
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!partner || !user) {
    return (
      <div className="text-center py-16 animate-fadeIn">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Không tìm thấy cuộc hội thoại
        </h3>
        <Link href="/messages" className="btn-primary mt-4 inline-block">
          Quay lại tin nhắn
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <Link href={`/user/${partner.id}`} className="flex items-center gap-3 flex-1">
          <div className="relative">
            <Image
              src={partner.avatar}
              alt={partner.name}
              width={48}
              height={48}
              className="rounded-2xl object-cover ring-2 ring-gray-100"
            />
            {partner.onlineStatus?.isOnline && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">{partner.name}</h2>
              {partner.vipStatus.tier !== 'free' && (
                <span className={cn(
                  'px-1.5 py-0.5 text-[10px] font-bold text-white rounded uppercase',
                  getVIPBadgeColor(partner.vipStatus.tier)
                )}>
                  VIP
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {partner.onlineStatus?.isOnline ? (
                <span className="text-green-600">Đang hoạt động</span>
              ) : (
                'Không hoạt động'
              )}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
            <Phone className="w-5 h-5 text-gray-500" />
          </button>
          <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
            <Video className="w-5 h-5 text-gray-500" />
          </button>
          <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <Image
                src={partner.avatar}
                alt={partner.name}
                fill
                className="rounded-3xl object-cover shadow-lg"
              />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{partner.name}</h3>
            <p className="text-gray-500 text-sm">
              Bắt đầu cuộc trò chuyện ngay!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender_id === user.id;
            const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender_id !== msg.sender_id);

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2 animate-slideUp',
                  isOwn ? 'justify-end' : 'justify-start'
                )}
              >
                {!isOwn && (
                  <div className="w-8 flex-shrink-0">
                    {showAvatar ? (
                      <Image
                        src={partner.avatar}
                        alt={partner.name}
                        width={32}
                        height={32}
                        className="rounded-xl"
                      />
                    ) : <div className="w-8" />}
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm',
                    isOwn
                      ? 'bg-gradient-primary text-white rounded-br-md'
                      : 'bg-white text-gray-900 rounded-bl-md border border-gray-100'
                  )}
                >
                  <p className="leading-relaxed">{msg.content}</p>
                  <div className={cn(
                    'flex items-center gap-1 justify-end mt-1',
                    isOwn ? 'text-primary-100' : 'text-gray-400'
                  )}>
                    <span className="text-[10px]">
                      {formatRelativeTime(msg.created_at)}
                    </span>
                    {isOwn && (
                      msg.is_read
                        ? <CheckCheck className="w-3 h-3" />
                        : <Check className="w-3 h-3" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
            <ImageIcon className="w-5 h-5 text-gray-500" />
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="w-full px-4 py-3 bg-gray-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition pr-12"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded-xl transition-colors">
              <Smile className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className={cn(
              'p-3 rounded-2xl transition-all',
              newMessage.trim()
                ? 'bg-gradient-primary text-white shadow-primary hover:shadow-lg'
                : 'bg-gray-200 text-gray-400'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}