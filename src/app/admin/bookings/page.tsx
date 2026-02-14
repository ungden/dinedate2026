'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateOrder } from '@/types';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  UtensilsCrossed
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { mapDbUserToUser } from '@/lib/user-mapper';

export default function AdminBookingsPage() {
  const [orders, setOrders] = useState<DateOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('date_orders')
      .select(`
        *,
        creator:users!date_orders_creator_id_fkey(*),
        matched_user:users!date_orders_matched_user_id_fkey(*),
        restaurant:restaurants!date_orders_restaurant_id_fkey(*),
        combo:combos!date_orders_combo_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mapped = data.map((row: any) => ({
        id: row.id,
        creatorId: row.creator_id,
        creator: row.creator ? mapDbUserToUser(row.creator) : undefined,
        restaurantId: row.restaurant_id,
        restaurant: row.restaurant || undefined,
        comboId: row.combo_id,
        combo: row.combo || undefined,
        dateTime: row.date_time,
        description: row.description || '',
        preferredGender: row.preferred_gender,
        paymentSplit: row.payment_split || 'split',
        comboPrice: Number(row.combo_price || 0),
        platformFee: Number(row.platform_fee || 0),
        creatorTotal: Number(row.creator_total || 0),
        applicantTotal: Number(row.applicant_total || 0),
        restaurantCommission: Number(row.restaurant_commission || 0),
        status: row.status,
        matchedUserId: row.matched_user_id,
        matchedUser: row.matched_user ? mapDbUserToUser(row.matched_user) : undefined,
        matchedAt: row.matched_at,
        tableBookingId: row.table_booking_id,
        maxApplicants: row.max_applicants || 10,
        applicantCount: row.applicant_count || 0,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        completedAt: row.completed_at,
        cancelledAt: row.cancelled_at,
      }));
      setOrders(mapped);
    }
    setLoading(false);
  };

  const filteredOrders = orders.filter(o => 
    statusFilter === 'all' || o.status === statusFilter
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-blue-100 text-blue-700',
      matched: 'bg-purple-100 text-purple-700',
      confirmed: 'bg-indigo-100 text-indigo-700',
      completed: 'bg-green-100 text-green-700',
      expired: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
      no_show: 'bg-orange-100 text-orange-700',
    };
    return cn('px-2.5 py-1 rounded-full text-xs font-bold uppercase', styles[status] || 'bg-gray-100 text-gray-700');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => fetchOrders()} 
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            <Loader2 className={cn("w-5 h-5 text-gray-500", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-1 overflow-x-auto">
        {['all', 'active', 'matched', 'confirmed', 'completed', 'expired', 'cancelled'].map(s => (
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

      {/* Order List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6">
            
            {/* Status & ID */}
            <div className="md:w-48 flex-shrink-0 flex flex-col justify-between">
              <div>
                <span className={getStatusBadge(order.status)}>{order.status}</span>
                <p className="text-xs text-gray-400 mt-2 font-mono">ID: {order.id.slice(0, 8)}...</p>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">Combo</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(order.comboPrice)}</p>
                <p className="text-xs text-gray-400">Phí nền tảng: {formatCurrency(order.platformFee)}</p>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Người tạo</p>
                <div className="flex items-center gap-2">
                  {order.creator && (
                    <>
                      <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden relative">
                        <img src={order.creator.avatar} alt="" className="object-cover" />
                      </div>
                      <p className="font-medium text-gray-900">{order.creator.name}</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Người được match</p>
                <div className="flex items-center gap-2">
                  {order.matchedUser ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden relative">
                        <img src={order.matchedUser.avatar} alt="" className="object-cover" />
                      </div>
                      <p className="font-medium text-gray-900">{order.matchedUser.name}</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Chưa match</p>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 bg-gray-50 p-3 rounded-xl flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-primary-500" />
                  <span>{order.restaurant?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary-500" />
                  <span>{formatDate(order.dateTime)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary-500" />
                  <span>{order.dateTime ? new Date(order.dateTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!loading && filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Không có đơn hàng nào
          </div>
        )}
      </div>
    </div>
  );
}
