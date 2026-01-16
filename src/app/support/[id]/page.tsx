'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Loader2,
  Calendar,
  Tag,
  User,
  FileText,
  Lock,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useTicketDetail, TicketStatus, TicketCategory, TicketPriority } from '@/hooks/useSupportTickets';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  open: {
    label: 'Mo',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-100',
    icon: AlertCircle,
  },
  in_progress: {
    label: 'Dang xu ly',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-100',
    icon: Clock,
  },
  waiting_user: {
    label: 'Cho phan hoi',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 border-purple-100',
    icon: MessageSquare,
  },
  resolved: {
    label: 'Da giai quyet',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-100',
    icon: CheckCircle,
  },
  closed: {
    label: 'Da dong',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50 border-gray-100',
    icon: CheckCircle,
  },
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  booking: 'Van de ve booking',
  payment: 'Thanh toan & Hoan tien',
  account: 'Tai khoan',
  partner: 'Partner',
  technical: 'Loi ky thuat',
  other: 'Khac',
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'Thap', color: 'text-gray-500' },
  medium: { label: 'Trung binh', color: 'text-blue-600' },
  high: { label: 'Cao', color: 'text-orange-600' },
  urgent: { label: 'Khan cap', color: 'text-red-600' },
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const { user } = useAuth();

  const { ticket, messages, loading, sendMessage } = useTicketDetail(ticketId);

  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const text = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const success = await sendMessage(text);
      if (success) {
        inputRef.current?.focus();
      } else {
        setNewMessage(text);
      }
    } catch (err) {
      console.error(err);
      setNewMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-16 animate-fadeIn">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Khong tim thay yeu cau
        </h3>
        <p className="text-gray-500 mb-4">Yeu cau ho tro nay khong ton tai hoac ban khong co quyen truy cap.</p>
        <Link href="/support" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl font-bold">
          <ArrowLeft className="w-4 h-4" />
          Quay lai
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[ticket.status];
  const StatusIcon = statusConfig.icon;
  const priorityConfig = PRIORITY_CONFIG[ticket.priority];
  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/support" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 line-clamp-1">{ticket.subject}</h1>
          <p className="text-sm text-gray-500">#{ticket.id.slice(0, 8)}</p>
        </div>
        <span className={cn(
          'px-3 py-1.5 rounded-xl text-sm font-bold border flex items-center gap-1.5',
          statusConfig.bgColor,
          statusConfig.color
        )}>
          <StatusIcon className="w-4 h-4" />
          {statusConfig.label}
        </span>
      </div>

      {/* Ticket Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Tag className="w-3 h-3" />
              Loai van de
            </div>
            <p className="font-medium text-gray-900 text-sm">{CATEGORY_LABELS[ticket.category]}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <AlertCircle className="w-3 h-3" />
              Muc do
            </div>
            <p className={cn('font-medium text-sm', priorityConfig.color)}>{priorityConfig.label}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Calendar className="w-3 h-3" />
              Tao luc
            </div>
            <p className="font-medium text-gray-900 text-sm">{formatRelativeTime(ticket.created_at)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Clock className="w-3 h-3" />
              Cap nhat
            </div>
            <p className="font-medium text-gray-900 text-sm">{formatRelativeTime(ticket.updated_at)}</p>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-bold text-gray-700 mb-2">Mo ta</h4>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* Related Booking */}
        {ticket.related_booking_id && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-700 mb-2">Booking lien quan</h4>
            <Link
              href={`/manage-bookings`}
              className="inline-flex items-center gap-2 text-primary-600 text-sm hover:underline"
            >
              <FileText className="w-4 h-4" />
              Xem booking #{ticket.related_booking_id.slice(0, 8)}
            </Link>
          </div>
        )}
      </div>

      {/* Messages Thread */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Trao doi ({messages.length})
          </h3>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto bg-gray-50/50">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Chua co tin nhan nao.</p>
              {!isClosed && (
                <p className="text-gray-400 text-xs mt-1">Gui tin nhan de bat dau trao doi.</p>
              )}
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.user_id === user?.id;
              const isAdmin = msg.is_admin;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3',
                    isOwn ? 'justify-end' : 'justify-start'
                  )}
                >
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 relative">
                      {msg.user?.avatar_url ? (
                        <Image
                          src={msg.user.avatar_url}
                          alt={msg.user.name || 'User'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary-100">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2.5',
                      isOwn
                        ? 'bg-primary-500 text-white rounded-br-md'
                        : isAdmin
                        ? 'bg-blue-50 text-gray-900 border border-blue-100 rounded-bl-md'
                        : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md'
                    )}
                  >
                    {!isOwn && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-700">
                          {msg.user?.name || 'Ho tro'}
                        </span>
                        {isAdmin && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">
                            ADMIN
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    <p className={cn(
                      'text-[10px] mt-1',
                      isOwn ? 'text-primary-200' : 'text-gray-400'
                    )}>
                      {formatRelativeTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {isClosed ? (
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Lock className="w-4 h-4" />
              Yeu cau nay da dong, khong the gui tin nhan.
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhap tin nhan..."
                rows={2}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition resize-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                className={cn(
                  'p-3 rounded-xl transition-all flex-shrink-0',
                  newMessage.trim() && !isSending
                    ? 'bg-primary-500 text-white shadow-lg hover:bg-primary-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Nhan Enter de gui, Shift+Enter de xuong dong
            </p>
          </div>
        )}
      </div>

      {/* Help Note */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
        <strong>Luu y:</strong> Doi ngu ho tro se phan hoi trong vong 24h. Neu van de khan cap,
        vui long ghi ro trong tin nhan. Cam on ban da su dung DineDate!
      </div>
    </div>
  );
}
