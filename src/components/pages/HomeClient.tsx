'use client';

import { useMemo, useState } from 'react';
import { motion } from '@/lib/motion';
import { Search, Sparkles } from 'lucide-react';
import { useDateStore } from '@/hooks/useDateStore';
import PartnerCard from '@/components/PartnerCard';
import BackToTop from '@/components/BackToTop';

export default function HomeClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const { getAllUsers } = useDateStore();
  const allUsers = getAllUsers();

  const partners = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allUsers
      .filter((u) => u.isServiceProvider)
      .filter((u) => {
        if (!q) return true;
        return (
          u.name.toLowerCase().includes(q) ||
          u.location.toLowerCase().includes(q) ||
          (u.bio || '').toLowerCase().includes(q)
        );
      });
  }, [allUsers, searchQuery]);

  return (
    <div className="space-y-6 pb-24 bg-mesh min-h-screen">
      {/* Header */}
      <div className="px-1 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-500" />
          <p className="text-[14px] font-black text-gray-900 uppercase tracking-widest">
            Khám phá partner 1-1
          </p>
        </div>
        <p className="text-sm text-gray-500 font-medium">
          Chọn 1 partner và nhấn “Đề nghị” để bắt đầu chat riêng.
        </p>
      </div>

      {/* Search */}
      <div className="sticky top-[60px] z-30 -mx-4 px-4 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 py-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Tìm Partner theo tên, bio, khu vực..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ios-input pl-11 py-3 text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4 px-1">
        {partners.length > 0 ? (
          partners.map((partner, idx) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <PartnerCard partner={partner} />
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center bg-white rounded-[32px] shadow-[var(--shadow-soft)] border border-gray-50">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-black text-gray-900">Không có kết quả</h3>
            <p className="text-gray-400 text-sm mt-1">
              Thử tìm bằng từ khóa khác nhé.
            </p>
          </div>
        )}
      </div>

      <BackToTop />
    </div>
  );
}