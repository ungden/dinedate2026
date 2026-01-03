'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(email, password);
    if (result.error) {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left side - Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="relative z-10 text-center text-white max-w-lg">
          <motion.div 
            className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-2xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Heart className="w-12 h-12 fill-white" />
          </motion.div>
          <h1 className="text-5xl font-black mb-6 tracking-tight">DineDate</h1>
          <p className="text-xl text-primary-100 font-medium leading-relaxed">
            Nơi những cuộc gặp gỡ trở thành kỷ niệm. Kết nối với những đối tác thú vị nhất xung quanh bạn.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white lg:bg-transparent">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {/* Logo Mobile */}
          <div className="lg:hidden text-center mb-8 mt-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-[20px] flex items-center justify-center mx-auto mb-4 shadow-primary shadow-rose-500/30">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="text-3xl font-black gradient-text">DineDate</h1>
          </div>

          <div className="bg-white p-2 md:p-8 rounded-[32px]">
            <div className="mb-8">
                <h2 className="text-2xl font-black text-gray-900 mb-2">Chào mừng trở lại! 👋</h2>
                <p className="text-gray-500 font-medium">Đăng nhập để tiếp tục hành trình của bạn</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium animate-shake flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    className="input-field pl-14"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input-field pl-14 pr-14"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                  <span className="text-[13px] text-gray-500 font-medium group-hover:text-gray-700 transition-colors">Ghi nhớ tôi</span>
                </label>
                <Link href="#" className="text-[13px] text-primary-600 font-bold hover:underline">Quên mật khẩu?</Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-primary tap-highlight mt-4',
                  isSubmitting ? 'bg-gray-200 text-gray-400' : 'bg-gradient-primary text-white hover:opacity-90 hover:shadow-lg active:scale-[0.98]'
                )}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500 font-medium">
                Chưa có tài khoản?{' '}
                <Link href="/register" className="text-primary-600 font-black hover:underline">Đăng ký ngay</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}