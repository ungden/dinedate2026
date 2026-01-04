'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from '@/lib/motion';
import { Search, ArrowLeft, Loader2 } from 'lucide-react';
import { useDbPartners } from '@/hooks/useDbPartners';
import PartnerCard from '@/components/PartnerCard';

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce logic đơn giản để tránh query DB quá nhiều khi gõ
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Sync URL với query (optional, tốt cho UX khi refresh/share)
  useEffect(() => {
    if (debouncedQuery) {
      router.replace(`/search?q=${encodeURIComponent(debouncedQuery)}`);
    } else {
      router.replace('/search');
    }
  }, [debouncedQuery, router]);

  const { users, loading } = useDbPartners({ search: debouncedQuery });

  return (
    <div className="max-w-2xl mx-auto space-y-6 min-h-screen pb-20">
      {/* Header with Search Input */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 -mx-4 px-4 py-3 safe-top">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          
          <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên, sở thích..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="px-1">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
            <p className="text-gray-500 mt-2 text-sm">Đang tìm kiếm...</p>
          </div>
        ) : users.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-500 px-2">
              Tìm thấy {users.length} kết quả
            </p>
            {users.map((partner, idx) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <PartnerCard partner={partner} />
              </motion.div>
            ))}
          </div>
        ) : debouncedQuery ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🤔</div>
            <h3 className="text-lg font-bold text-gray-900">Không tìm thấy kết quả</h3>
            <p className="text-gray-500 text-sm mt-1">Thử từ khóa khác xem sao nhé!</p>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-lg font-bold text-gray-900">Bắt đầu tìm kiếm</h3>
            <p className="text-gray-500 text-sm mt-1">Nhập tên hoặc từ khóa để tìm Partner.</p>
          </div>
        )}
      </div>
    </div>
  );
}