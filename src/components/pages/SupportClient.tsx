'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  HelpCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Loader2,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useSupportTickets, TicketStatus, TicketCategory, TicketPriority } from '@/hooks/useSupportTickets';
import SupportTicketModal from '@/components/SupportTicketModal';

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: React.ElementType }> = {
  open: {
    label: 'Mo',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    icon: AlertCircle,
  },
  in_progress: {
    label: 'Dang xu ly',
    color: 'bg-amber-50 text-amber-700 border-amber-100',
    icon: Clock,
  },
  waiting_user: {
    label: 'Cho phan hoi',
    color: 'bg-purple-50 text-purple-700 border-purple-100',
    icon: MessageSquare,
  },
  resolved: {
    label: 'Da giai quyet',
    color: 'bg-green-50 text-green-700 border-green-100',
    icon: CheckCircle,
  },
  closed: {
    label: 'Da dong',
    color: 'bg-gray-50 text-gray-700 border-gray-100',
    icon: CheckCircle,
  },
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  booking: 'Booking',
  payment: 'Thanh toan',
  account: 'Tai khoan',
  partner: 'Partner',
  technical: 'Ky thuat',
  other: 'Khac',
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'Thap', color: 'text-gray-500' },
  medium: { label: 'Trung binh', color: 'text-blue-600' },
  high: { label: 'Cao', color: 'text-orange-600' },
  urgent: { label: 'Khan cap', color: 'text-red-600' },
};

export default function SupportClient() {
  const router = useRouter();
  const { tickets, loading, reload } = useSupportTickets();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | TicketStatus>('all');

  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus === 'all') return true;
    return ticket.status === filterStatus;
  });

  const openCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_user').length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ho tro khach hang</h1>
            <p className="text-sm text-gray-500">Quan ly cac yeu cau ho tro cua ban</p>
          </div>
        </div>
        {openCount > 0 && (
          <span className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-bold border border-primary-100">
            {openCount} dang xu ly
          </span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Can ho tro?</h3>
              <p className="text-sm text-gray-500">Gui yeu cau va nhan phan hoi trong 24h</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-primary-500 text-white rounded-xl font-bold text-sm hover:bg-primary-600 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tao yeu cau
          </button>
        </div>
      </div>

      {/* Filter & Refresh */}
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2">
          {(['all', 'open', 'in_progress', 'waiting_user', 'resolved', 'closed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition',
                filterStatus === status
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              )}
            >
              {status === 'all' ? 'Tat ca' : STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>
        <button
          onClick={() => reload()}
          disabled={loading}
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Dang tai...
            </div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Chua co yeu cau nao</h3>
            <p className="text-gray-500 mb-4">
              {filterStatus === 'all'
                ? 'Tao yeu cau ho tro khi ban can ho tro.'
                : 'Khong co yeu cau nao voi trang thai nay.'}
            </p>
            {filterStatus === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-primary-500 text-white rounded-xl font-bold text-sm hover:bg-primary-600 transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Tao yeu cau dau tien
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTickets.map((ticket) => {
              const statusConfig = STATUS_CONFIG[ticket.status];
              const StatusIcon = statusConfig.icon;
              const priorityConfig = PRIORITY_CONFIG[ticket.priority];

              return (
                <Link
                  key={ticket.id}
                  href={`/support/${ticket.id}`}
                  className="block p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title & Status */}
                      <div className="flex items-start gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 line-clamp-1 flex-1">
                          {ticket.subject}
                        </h3>
                        <span className={cn(
                          'px-2 py-0.5 rounded-lg text-xs font-medium border flex items-center gap-1 flex-shrink-0',
                          statusConfig.color
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Description Preview */}
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                        {ticket.description}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">
                          {CATEGORY_LABELS[ticket.category]}
                        </span>
                        <span className={cn('font-medium', priorityConfig.color)}>
                          {priorityConfig.label}
                        </span>
                        <span>{formatRelativeTime(ticket.updated_at)}</span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* FAQ Section */}
      <div className="bg-gradient-to-br from-primary-50 to-pink-50 rounded-2xl p-6 border border-primary-100">
        <h3 className="font-bold text-gray-900 mb-3">Cau hoi thuong gap</h3>
        <div className="space-y-2 text-sm">
          <p className="text-gray-600">
            <strong>Lam sao de huy booking?</strong> Vao Quan ly booking, chon booking can huy va nhan Huy.
          </p>
          <p className="text-gray-600">
            <strong>Bao lau thi duoc hoan tien?</strong> Hoan tien tu dong trong 1-3 ngay lam viec sau khi yeu cau duoc duyet.
          </p>
          <p className="text-gray-600">
            <strong>Lien he khan cap?</strong> Gui yeu cau voi muc do &quot;Khan cap&quot; de duoc uu tien xu ly.
          </p>
        </div>
      </div>

      {/* Create Ticket Modal */}
      <SupportTicketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => reload()}
      />
    </div>
  );
}
