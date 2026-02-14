'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  LogOut,
  Star,
  AlertTriangle,
  MessageSquareWarning,
  Tag,
  BarChart3,
  HelpCircle,
  Bug,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { href: '/admin', label: 'Tong quan', icon: LayoutDashboard },
  { href: '/admin/finance', label: 'Tai chinh', icon: BarChart3 },
  { href: '/admin/users', label: 'Nguoi dung', icon: Users },
  { href: '/admin/bookings', label: 'Don hen', icon: Calendar },
  { href: '/admin/restaurants', label: 'Nha hang', icon: UtensilsCrossed },
  { href: '/admin/promo-codes', label: 'Ma giam gia', icon: Tag },
  { href: '/admin/support', label: 'Ho tro', icon: HelpCircle },
  { href: '/admin/disputes', label: 'Khieu nai', icon: MessageSquareWarning },
  { href: '/admin/reports', label: 'Bao cao', icon: AlertTriangle },
  { href: '/admin/reviews', label: 'Danh gia', icon: Star },
  { href: '/admin/errors', label: 'Loi he thong', icon: Bug },
  { href: '/admin/payment', label: 'Cau hinh & Vi', icon: CreditCard },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-white font-bold">
            A
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tight">Admin Panel</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium',
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-primary-600' : 'text-gray-400')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors w-full font-medium"
        >
          <LogOut className="w-5 h-5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}