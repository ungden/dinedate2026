'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  HelpCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  User,
  ExternalLink,
  Tag,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  useAdminSupportTickets,
  useAdminTicketDetail,
  TicketStatus,
  TicketCategory,
  TicketPriority,
  SupportTicket,
} from '@/hooks/useSupportTickets';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: React.ElementType }> = {
  open: {
    label: 'Mở',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    icon: AlertCircle,
  },
  in_progress: {
    label: 'Đang xử lý',
    color: 'bg-amber-50 text-amber-700 border-amber-100',
    icon: Clock,
  },
  waiting_user: {
    label: 'Chờ User',
    color: 'bg-purple-50 text-purple-700 border-purple-100',
    icon: MessageSquare,
  },
  resolved: {
    label: 'Đã giải quyết',
    color: 'bg-green-50 text-green-700 border-green-100',
    icon: CheckCircle,
  },
  closed: {
    label: 'Đã đóng',
    color: 'bg-gray-50 text-gray-700 border-gray-100',
    icon: CheckCircle,
  },
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  booking: 'Booking',
  payment: 'Thanh toán',
  account: 'Tài khoản',
  partner: 'Partner',
  technical: 'Kỹ thuật',
  other: 'Khác',
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Thấp', color: 'text-gray-500', bgColor: 'bg-gray-50' },
  medium: { label: 'Trung bình', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  high: { label: 'Cao', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  urgent: { label: 'Khẩn cấp', color: 'text-red-600', bgColor: 'bg-red-50' },
};

export default function AdminSupportPage() {
  const { user } = useAuth();
  const { tickets, loading, reload, updateTicket, sendAdminMessage } = useAdminSupportTickets();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | TicketStatus>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | TicketPriority>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | TicketCategory>('all');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Reply Modal State
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    setProcessing(ticketId);
    try {
      const success = await updateTicket(ticketId, { status: newStatus });
      if (success) {
        toast.success(`Đã cập nhật trạng thái: ${STATUS_CONFIG[newStatus].label}`);
      }
    } finally {
      setProcessing(null);
      setActionMenuId(null);
    }
  };

  const handleUpdatePriority = async (ticketId: string, newPriority: TicketPriority) => {
    setProcessing(ticketId);
    try {
      const success = await updateTicket(ticketId, { priority: newPriority });
      if (success) {
        toast.success(`Đã cập nhật mức độ: ${PRIORITY_CONFIG[newPriority].label}`);
      }
    } finally {
      setProcessing(null);
      setActionMenuId(null);
    }
  };

  const handleAssignToMe = async (ticketId: string) => {
    if (!user?.id) return;
    setProcessing(ticketId);
    try {
      const success = await updateTicket(ticketId, { assigned_to: user.id, status: 'in_progress' });
      if (success) {
        toast.success('Đã nhận xử lý ticket này');
      }
    } finally {
      setProcessing(null);
      setActionMenuId(null);
    }
  };

  const openReplyModal = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setReplyMessage('');
    setReplyModalOpen(true);
    setActionMenuId(null);
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim() || !user?.id) return;

    setSendingReply(true);
    try {
      const success = await sendAdminMessage(selectedTicket.id, replyMessage.trim(), user.id);
      if (success) {
        toast.success('Đã gửi phản hồi');
        // Update status to waiting_user after reply
        await updateTicket(selectedTicket.id, { status: 'waiting_user' });
        setReplyModalOpen(false);
        setReplyMessage('');
      }
    } finally {
      setSendingReply(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      ticket.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      ticket.subject?.toLowerCase().includes(search.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const urgentCount = tickets.filter((t) => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hỗ trợ khách hàng</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý và xử lý các yêu cầu hỗ trợ từ người dùng</p>
        </div>
        <div className="flex items-center gap-3">
          {urgentCount > 0 && (
            <span className="px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-bold border border-red-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {urgentCount} khẩn cấp
            </span>
          )}
          {openCount > 0 && (
            <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold border border-blue-100">
              {openCount} chưa xử lý
            </span>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, tiêu đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="open">Mở</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="waiting_user">Chờ User</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="closed">Đã đóng</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="urgent">Khẩn cấp</option>
            <option value="high">Cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="all">Tất cả loại</option>
            <option value="booking">Booking</option>
            <option value="payment">Thanh toán</option>
            <option value="account">Tài khoản</option>
            <option value="partner">Partner</option>
            <option value="technical">Kỹ thuật</option>
            <option value="other">Khác</option>
          </select>
        </div>

        <button
          onClick={() => reload()}
          disabled={loading}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Làm mới
        </button>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tải dữ liệu...
            </div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không tìm thấy ticket nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTickets.map((ticket) => {
              const statusConfig = STATUS_CONFIG[ticket.status];
              const StatusIcon = statusConfig.icon;
              const priorityConfig = PRIORITY_CONFIG[ticket.priority];
              const isExpanded = expandedId === ticket.id;

              return (
                <div key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* User Info */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                            {ticket.user?.avatar_url ? (
                              <Image
                                src={ticket.user.avatar_url}
                                alt={ticket.user.name || 'User'}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <User className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/user/${ticket.user_id}`}
                              target="_blank"
                              className="font-medium text-gray-900 hover:text-primary-600 flex items-center gap-1"
                            >
                              {ticket.user?.name || 'Người dùng'}
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                            <p className="text-xs text-gray-500">{ticket.user?.email}</p>
                          </div>
                        </div>

                        {/* Subject & Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-bold text-gray-900">{ticket.subject}</h3>
                          <span className={cn(
                            'px-2 py-0.5 rounded-lg text-xs font-medium border flex items-center gap-1',
                            statusConfig.color
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-lg text-xs font-bold',
                            priorityConfig.bgColor,
                            priorityConfig.color
                          )}>
                            {priorityConfig.label}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded-lg text-xs text-gray-600">
                            {CATEGORY_LABELS[ticket.category]}
                          </span>
                        </div>

                        {/* Description Preview */}
                        <p className="text-sm text-gray-600 leading-relaxed mb-2 line-clamp-2">
                          {ticket.description}
                        </p>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                          <span>{formatRelativeTime(ticket.created_at)}</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {ticket.messages_count || 0} tin nhắn
                          </span>
                          {ticket.assigned_admin && (
                            <span className="flex items-center gap-1 text-green-600">
                              <UserCheck className="w-3 h-3" />
                              {ticket.assigned_admin.name}
                            </span>
                          )}
                          {ticket.booking && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {ticket.booking.activity}
                            </span>
                          )}
                        </div>

                        {/* Expand Button */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                          className="mt-2 text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                               Thu gọn
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                               Xem chi tiết
                            </>
                          )}
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuId(actionMenuId === ticket.id ? null : ticket.id)}
                          disabled={processing === ticket.id}
                          className={cn(
                            'p-2 hover:bg-gray-100 rounded-lg transition',
                            processing === ticket.id && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          {processing === ticket.id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                          ) : (
                            <MoreHorizontal className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {actionMenuId === ticket.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-56 z-10">
                            {/* Reply */}
                            <button
                              onClick={() => openReplyModal(ticket)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Send className="w-4 h-4 text-primary-500" />
                              Phản hồi
                            </button>

                            {/* Assign */}
                            {!ticket.assigned_to && (
                              <button
                                onClick={() => handleAssignToMe(ticket.id)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <UserCheck className="w-4 h-4 text-green-500" />
                                Nhận xử lý
                              </button>
                            )}

                            <div className="my-2 border-t border-gray-100" />

                            {/* Status Changes */}
                            <div className="px-4 py-1 text-xs text-gray-400 font-bold">Trạng thái</div>
                            {ticket.status !== 'in_progress' && (
                              <button
                                onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Clock className="w-4 h-4 text-amber-500" />
                                Đang xử lý
                              </button>
                            )}
                            {ticket.status !== 'resolved' && (
                              <button
                                onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Đã giải quyết
                              </button>
                            )}
                            {ticket.status !== 'closed' && (
                              <button
                                onClick={() => handleUpdateStatus(ticket.id, 'closed')}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <X className="w-4 h-4 text-gray-500" />
                                Đóng ticket
                              </button>
                            )}

                            <div className="my-2 border-t border-gray-100" />

                            {/* Priority Changes */}
                            <div className="px-4 py-1 text-xs text-gray-400 font-bold">Mức độ</div>
                            {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map((priority) => (
                              ticket.priority !== priority && (
                                <button
                                  key={priority}
                                  onClick={() => handleUpdatePriority(ticket.id, priority)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <AlertCircle className={cn('w-4 h-4', PRIORITY_CONFIG[priority].color)} />
                                  {PRIORITY_CONFIG[priority].label}
                                </button>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <ExpandedTicketDetail ticketId={ticket.id} adminId={user?.id} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {replyModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Phản hồi ticket</h3>
                <p className="text-xs text-gray-500">{selectedTicket.subject}</p>
              </div>
              <button
                onClick={() => setReplyModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 relative">
                  {selectedTicket.user?.avatar_url ? (
                    <Image
                      src={selectedTicket.user.avatar_url}
                      alt={selectedTicket.user.name || 'User'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedTicket.user?.name}</p>
                  <p className="text-xs text-gray-500">{selectedTicket.user?.email}</p>
                </div>
              </div>

              {/* Reply Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nội dung phản hồi
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Nhập nội dung phản hồi cho người dùng..."
                  rows={5}
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Quick Replies */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Phản hồi nhanh:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Cảm ơn bạn đã liên hệ. Chúng tôi đang xem xét yêu cầu của bạn.',
                    'Vấn đề của bạn đã được giải quyết. Vui lòng kiểm tra lại.',
                    'Vui lòng cung cấp thêm thông tin để chúng tôi hỗ trợ tốt hơn.',
                  ].map((msg, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReplyMessage(msg)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition"
                    >
                      {msg.slice(0, 30)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setReplyModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyMessage.trim()}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2',
                    sendingReply || !replyMessage.trim()
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  )}
                >
                  {sendingReply ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Gửi phản hồi
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Expanded ticket detail component with messages
function ExpandedTicketDetail({ ticketId, adminId }: { ticketId: string; adminId?: string }) {
  const { ticket, messages, loading, sendMessage } = useAdminTicketDetail(ticketId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !adminId || sending) return;

    setSending(true);
    try {
      const success = await sendMessage(newMessage.trim(), adminId);
      if (success) {
        setNewMessage('');
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 pb-6 border-t border-gray-100 pt-4 bg-gray-50">
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6 border-t border-gray-100 pt-4 bg-gray-50">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Full Description */}
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-2">Mô tả chi tiết</h4>
          <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border whitespace-pre-wrap">
            {ticket?.description}
          </p>
        </div>

        {/* Messages */}
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-2">
            Trao đổi ({messages.length})
          </h4>
          <div className="bg-white rounded-lg border max-h-60 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 italic p-3 text-center">Chưa có tin nhắn</p>
            ) : (
              <div className="p-3 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'text-sm p-2 rounded-lg',
                      msg.is_admin ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-700 text-xs">
                        {msg.user?.name || 'User'}
                      </span>
                      {msg.is_admin && (
                        <span className="px-1 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">
                          ADMIN
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {formatRelativeTime(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-600 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Quick Reply */}
          {ticket?.status !== 'closed' && ticket?.status !== 'resolved' && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Phản hồi nhanh..."
                className="flex-1 px-3 py-2 text-sm bg-white border rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className={cn(
                  'px-3 py-2 rounded-lg transition',
                  newMessage.trim() && !sending
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
