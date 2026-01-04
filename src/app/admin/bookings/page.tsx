'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ServiceBooking } from '@/types';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { mapDbUserToUser } from '@/lib/user-mapper';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    // Fetch all bookings with user/partner relations
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        booker:users!bookings_user_id_fkey(*),
        partner:users!bookings_partner_id_fkey(*),
        service:services!bookings_service_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mapped = data.map((row: any) => ({
        id: row.id,
        serviceId: row.service_id,
        providerId: row.partner_id,
        provider: mapDbUserToUser(row.partner),
        bookerId: row.user_id,
        booker: mapDbUserToUser(row.booker),
        service: row.service,
        date: row.start_time?.split('T')[0],
        time: row.start_time ? new Date(row.start_time).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '',
        location: row.meeting_location,
        message: '', 
        status: row.status,
        isPaid: true, // Assuming bookings via app are paid to escrow
        escrowAmount: Number(row.total_amount || 0),
        createdAt: row.created_at,
        completedAt: row.completed_at
      }));
      setBookings(mapped);
    }
    setLoading(false);
  };

  const filteredBookings = bookings.filter(b => 
    statusFilter === 'all' || b.status === statusFilter
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      accepted: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    return cn('px-2.5 py-1 rounded-full text-xs font-bold uppercase', styles[status] || styles.pending);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => fetchBookings()} 
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            <Loader2 className={cn("w-5 h-5 text-gray-500", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-1 overflow-x-auto">
        {['all', 'pending', 'accepted', 'completed', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-4 py-2 rounded-t-lg font-medium text-sm transition-colors border-b-2',
              statusFilter === s 
                ? 'border-primary-500 text-primary-600 bg-primary-50/50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {s === 'all' ? 'Tất cả' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Booking List */}
      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <div key={booking.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6">
            
            {/* Status & ID */}
            <div className="md:w-48 flex-shrink-0 flex flex-col justify-between">
              <div>
                <span className={getStatusBadge(booking.status)}>{booking.status}</span>
                <p className="text-xs text-gray-400 mt-2 font-mono">ID: {booking.id.slice(0, 8)}...</p>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">Tổng tiền</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(booking.escrowAmount)}</p>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Người đặt</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden relative">
                    <img src={booking.booker.avatar} alt="" className="object-cover" />
                  </div>
                  <p className="font-medium text-gray-900">{booking.booker.name}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Partner</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden relative">
                    <img src={booking.provider.avatar} alt="" className="object-cover" />
                  </div>
                  <p className="font-medium text-gray-900">{booking.provider.name}</p>
                </div>
              </div>

              <div className="md:col-span-2 bg-gray-50 p-3 rounded-xl flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary-500" />
                  <span>{formatDate(booking.date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary-500" />
                  <span>{booking.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  <span className="truncate max-w-[200px]">{booking.location}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!loading && filteredBookings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Không có đơn hàng nào
          </div>
        )}
      </div>
    </div>
  );
}