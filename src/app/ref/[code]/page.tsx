'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from '@/lib/motion';
import { Gift, Heart, Users, Shield, Star, ArrowRight, CheckCircle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useReferrerByCode, storeReferralCode } from '@/hooks/useReferral';
import { useAuth } from '@/contexts/AuthContext';

const REFERRED_REWARD = 30000; // 30k cho nguoi moi
const REFERRER_REWARD = 50000; // 50k cho nguoi gioi thieu

const features = [
  {
    icon: Users,
    title: 'Ket noi chan thuc',
    description: 'Gap go nhung nguoi ban thu vi',
  },
  {
    icon: Shield,
    title: 'An toan & Bao mat',
    description: 'He thong xac minh nghiem ngat',
  },
  {
    icon: Star,
    title: 'Chat luong cao',
    description: 'Doi ngu Partner duoc tuyen chon',
  },
];

export default function ReferralLandingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const code = params?.code as string;

  const { referrer, loading, error } = useReferrerByCode(code);
  const [stored, setStored] = useState(false);

  // Store referral code when page loads
  useEffect(() => {
    if (code && !stored) {
      storeReferralCode(code);
      setStored(true);
    }
  }, [code, stored]);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      // User is logged in, redirect to home with a toast
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-pink-50">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-pink-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 px-4 py-12 max-w-lg mx-auto">
          {/* Logo */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-primary">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black gradient-text">DineDate</h1>
            <p className="text-gray-500 font-medium mt-1">Ket noi nhung tam hon</p>
          </motion.div>

          {/* Referrer Card */}
          <motion.div
            className="bg-white rounded-3xl p-6 shadow-xl mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {error || !referrer ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-bold">Ma gioi thieu khong hop le</p>
                <p className="text-gray-400 text-sm mt-1">Vui long kiem tra lai link gioi thieu</p>
                <Link href="/register">
                  <button className="mt-4 px-6 py-3 bg-gradient-primary text-white rounded-xl font-bold">
                    Dang ky ngay
                  </button>
                </Link>
              </div>
            ) : (
              <>
                {/* Referrer Info */}
                <div className="flex items-center gap-4 mb-6">
                  <Image
                    src={referrer.avatar || '/default-avatar.png'}
                    alt={referrer.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border-4 border-primary-100"
                  />
                  <div>
                    <p className="text-sm text-gray-500">Ban duoc gioi thieu boi</p>
                    <h2 className="text-xl font-black text-gray-900">{referrer.name}</h2>
                  </div>
                </div>

                {/* Reward Banner */}
                <div className="bg-gradient-to-r from-primary-500 to-pink-500 rounded-2xl p-5 text-white mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Gift className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-primary-100 text-sm">Qua tang dang ky</p>
                      <p className="text-2xl font-black">{formatCurrency(REFERRED_REWARD)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-primary-100">
                    Dang ky ngay va nhan {formatCurrency(REFERRED_REWARD)} vao vi khi hoan thanh booking dau tien!
                  </p>
                </div>

                {/* CTA Button */}
                <Link href="/register">
                  <button className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-primary text-white rounded-xl font-bold hover:opacity-90 transition shadow-primary text-lg">
                    Dang ky ngay
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>

                <p className="text-center text-sm text-gray-400 mt-3">
                  Da co tai khoan?{' '}
                  <Link href="/login" className="text-primary-600 font-bold hover:underline">
                    Dang nhap
                  </Link>
                </p>
              </>
            )}
          </motion.div>

          {/* Features */}
          <motion.div
            className="space-y-4 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-center text-gray-900 font-bold mb-4">Tai sao chon DineDate?</h3>

            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{feature.title}</h4>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* How Referral Works */}
          <motion.div
            className="bg-white rounded-2xl p-5 shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="font-bold text-gray-900 mb-4 text-center">Cach nhan thuong</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-primary-600">1</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Dang ky tai khoan</p>
                  <p className="text-sm text-gray-500">Tao tai khoan mien phi chi mat 1 phut</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-primary-600">2</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Hoan thanh ho so</p>
                  <p className="text-sm text-gray-500">Dien day du thong tin ca nhan</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Hoan thanh booking dau tien</p>
                  <p className="text-sm text-gray-500">Nhan ngay {formatCurrency(REFERRED_REWARD)} vao vi!</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Ban gioi thieu cung nhan {formatCurrency(REFERRER_REWARD)} khi ban hoan thanh booking
              </p>
            </div>
          </motion.div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-400">
            <p>&copy; 2025 DineDate. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
