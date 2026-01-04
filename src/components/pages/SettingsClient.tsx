'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Bell, Lock, LogOut, ChevronRight, User, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsClient() {
  const { user, logout } = useAuth();

  const handleChangePassword = () => {
    // In a real app, this would redirect to a change password flow or open a modal
    toast('Tính năng đổi mật khẩu đang được phát triển', { icon: '🚧' });
  };

  const handleDeleteAccount = () => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.')) {
      toast.error('Vui lòng liên hệ CSKH để xóa tài khoản.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tài khoản</p>
        </div>
        
        <div className="divide-y divide-gray-100">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Thông tin cá nhân</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <Link href="/profile/edit" className="p-2 text-primary-600 font-medium text-sm hover:bg-primary-50 rounded-lg transition">
              Chỉnh sửa
            </Link>
          </div>

          <button 
            onClick={handleChangePassword}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-900">Đổi mật khẩu</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ứng dụng</p>
        </div>
        
        <div className="divide-y divide-gray-100">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Thông báo đẩy</p>
                <p className="text-xs text-gray-500">Nhận thông báo về tin nhắn, booking</p>
              </div>
            </div>
            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
              <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-green-400" defaultChecked />
              <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer checked:bg-green-400"></label>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => logout()}
          className="w-full p-4 bg-white border border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-700 font-bold hover:bg-gray-50 transition"
        >
          <LogOut className="w-5 h-5" />
          Đăng xuất
        </button>

        <button
          onClick={handleDeleteAccount}
          className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center gap-2 text-red-600 font-bold hover:bg-red-100 transition"
        >
          <Trash2 className="w-5 h-5" />
          Xóa tài khoản
        </button>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-400">Phiên bản 1.0.0 (Beta)</p>
      </div>
    </div>
  );
}