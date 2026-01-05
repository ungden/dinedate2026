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
  MapPin,
  Check,
  CheckCheck,
  Loader2,
  Navigation
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useConversation } from '@/hooks/useDbChat';
import { formatRelativeTime, cn, getVIPBadgeColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import SafetyChatBanner from '@/components/SafetyChatBanner'; // Import Safety Banner

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const { user } = useAuth();
  
  const [newMessage, setNewMessage] = useState('');
  const [isSendingLocation, setIsSendingLocation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, partner, loading, sendMessage } = useConversation(conversationId);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendText = async () => {
    if (!newMessage.trim()) return;
    const text = newMessage.trim();
    setNewMessage('');
    
    try {
      await sendMessage(text, 'text');
      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
      toast.error('Gửi tin nhắn thất bại');
      setNewMessage(text);
    }
  };

  const handleSendLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ định vị');
      return;
    }

    setIsSendingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          await sendMessage(
            '📍 Đã chia sẻ vị trí hiện tại', 
            'location', 
            { lat: latitude, lng: longitude }
          );
          toast.success('Đã gửi vị trí');
        } catch (err) {
          toast.error('Gửi vị trí thất bại');
        } finally {
          setIsSendingLocation(false);
        }
      },
      (err) => {
        console.error(err);
        toast.error('Không thể lấy vị trí. Hãy kiểm tra quyền truy cập.');
        setIsSendingLocation(false);
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
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
        
        {/* SAFETY BANNER */}
        <SafetyChatBanner className="mb-4" />

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
            const isLocation = msg.message_type === 'location';

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
                    'max-w-[80%] rounded-2xl shadow-sm',
                    isOwn
                      ? 'bg-gradient-primary text-white rounded-br-md'
                      : 'bg-white text-gray-900 rounded-bl-md border border-gray-100'
                  )}
                >
                  {isLocation && msg.metadata ? (
                    <div className="overflow-hidden">
                      <div className="p-3 pb-2">
                        <div className="flex items-center gap-2 font-semibold">
                          <MapPin className="w-4 h-4" />
                          <span>Vị trí hiện tại</span>
                        </div>
                      </div>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${msg.metadata.lat},${msg.metadata.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block relative w-64 h-32 bg-gray-200 hover:opacity-90 transition"
                      >
                        {/* Static map placeholder or map iframe could go here */}
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                           <MapPin className="w-8 h-8 text-red-500 animate-bounce" />
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 flex items-center justify-center gap-1">
                           <Navigation className="w-3 h-3" /> Mở Google Maps
                        </div>
                      </a>
                    </div>
                  ) : (
                    <div className="px-4 py-2.5">
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}

                  <div className={cn(
                    'flex items-center gap-1 justify-end px-3 pb-1.5',
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
          {isSendingLocation ? (
             <div className="p-2.5 bg-gray-100 rounded-xl">
               <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
             </div>
          ) : (
             <button 
               onClick={handleSendLocation}
               className="p-2.5 hover:bg-gray-100 text-gray-500 hover:text-primary-600 rounded-xl transition-colors"
               title="Gửi vị trí"
             >
               <MapPin className="w-5 h-5" />
             </button>
          )}
          
          <button className="p-2.5 hover:bg-gray-100 text-gray-500 hover:text-primary-600 rounded-xl transition-colors">
            <ImageIcon className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="w-full px-4 py-3 bg-gray-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition"
            />
          </div>

          <button
            onClick={handleSendText}
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