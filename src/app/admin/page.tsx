'use client';

import { useEffect, useState } from 'react';
import { Users, Calendar, DollarSign, Activity, UtensilsCrossed, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDateOrders: 0,
    totalRestaurants: 0,
    platformFeeRevenue: 0,
    restaurantCommissions: 0,
    activeUsers: 0
  });

  useEffect(() => {
    async function loadStats() {
      // 1. Users
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      
      // 2. Date Orders (bookings)
      const { count: dateOrdersCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true });

      // 3. Restaurants
      const { count: restaurantsCount } = await supabase.from('restaurants').select('*', { count: 'exact', head: true });

      // 4. Platform Fee Revenue (from transactions)
      const { data: feeTxs } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'platform_fee')
        .eq('status', 'completed');
      
      const platformFees = feeTxs?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      // 5. Restaurant Commissions
      const { data: commTxs } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'restaurant_commission')
        .eq('status', 'completed');

      const commissions = commTxs?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalDateOrders: dateOrdersCount || 0,
        totalRestaurants: restaurantsCount || 0,
        platformFeeRevenue: platformFees,
        restaurantCommissions: commissions,
        activeUsers: 0
      });
    }

    loadStats();
  }, []);

  const cards = [
    { label: 'Tổng người dùng', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Tổng đơn hẹn', value: stats.totalDateOrders, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Nhà hàng đối tác', value: stats.totalRestaurants, icon: UtensilsCrossed, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Phí nền tảng', value: formatCurrency(stats.platformFeeRevenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Hoa hồng nhà hàng', value: formatCurrency(stats.restaurantCommissions), icon: Percent, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Hoạt động', value: 'Live', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tổng quan hệ thống</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{card.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Chào mừng trở lại, Admin!</h2>
        <p className="text-gray-600">
          Bạn đang có quyền quản trị cao nhất. Hãy sử dụng menu bên trái để quản lý người dùng, đơn hẹn, nhà hàng và cấu hình thanh toán.
        </p>
      </div>
    </div>
  );
}
