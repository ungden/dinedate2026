'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Bell, Lock, LogOut, ChevronRight, User, Trash2, AtSign, Loader2, Check, Phone, ShieldCheck, ShieldAlert, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/client';
import PhoneVerification from '@/components/PhoneVerification';
import { usePhoneVerifiedStatus } from '@/hooks/usePhoneVerification';
import { cn } from '@/lib/utils';

export default function SettingsClient() {
  const { user, logout, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const { phone, isPhoneVerified } = usePhoneVerifiedStatus();

  const handleUpdateUsername = async () => {
    if (!username.trim()) return;
    if (username === user?.username) return;
    
    // Validate format: alphanumeric, 3-20 chars
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!regex.test(username)) {
      toast.error('Username chỉ chứa chữ, số và gạch dưới, dài 3-20 ký tự.');
      return;
    }

    setIsChecking(true);
    // Check uniqueness
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    
    setIsChecking(false);

    if (existing) {
      toast.error('Username này đã có người dùng');
      return;
    }

    setIsSaving(true);
    try {
        await updateUser({ username: username });
        toast.success('Đã cập nhật username!');
    } catch (e: any) {
        toast.error('Lỗi: ' + e.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
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
          {/* Username Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                        <AtSign className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">Username (Đường dẫn hồ sơ)</p>
                        <p className="text-xs text-gray-500">dinedate.vn/user/{username || user?.id}</p>
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="Nhập username..."
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <button 
                    onClick={handleUpdateUsername}
                    disabled={isChecking || isSaving || username === user?.username}
                    className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                    {isChecking || isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Lưu
                </button>
            </div>
          </div>

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
              <span className="font-medium text-gray-900">Doi mat khau</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          {/* Phone Verification Section */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isPhoneVerified ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
              )}>
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">So dien thoai</p>
                  {isPhoneVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      Da xac minh
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                      <ShieldAlert className="w-3 h-3" />
                      Chua xac minh
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {phone || 'Chua cap nhat so dien thoai'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPhoneVerification(true)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-medium text-sm transition",
                isPhoneVerified
                  ? "text-gray-600 hover:bg-gray-100"
                  : "text-primary-600 bg-primary-50 hover:bg-primary-100"
              )}
            >
              {isPhoneVerified ? 'Doi so' : 'Xac minh'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ung dung</p>
        </div>

        <div className="divide-y divide-gray-100">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Thong bao day</p>
                <p className="text-xs text-gray-500">Nhan thong bao ve date order, ghep doi, danh gia</p>
              </div>
            </div>
            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
              <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-green-400" defaultChecked />
              <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer checked:bg-green-400"></label>
            </div>
          </div>

          {/* Support Link */}
          <Link
            href="/support"
            className="p-4 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Ho tro khach hang</p>
                <p className="text-xs text-gray-500">Gui yeu cau ho tro, xem trang thai</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </Link>
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
        <p className="text-xs text-gray-400">Phien ban 1.0.0 (Beta)</p>
      </div>

      {/* Phone Verification Modal */}
      <PhoneVerification
        isOpen={showPhoneVerification}
        onClose={() => setShowPhoneVerification(false)}
        onVerified={(verifiedPhone) => {
          toast.success(`So ${verifiedPhone} da duoc xac minh!`);
        }}
        initialPhone={phone || ''}
      />
    </div>
  );
}