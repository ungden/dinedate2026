'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Heart,
  Loader2,
  Calendar,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useMutualConnections } from '@/hooks/useMutualConnections';
import { User } from '@/types';

export default function ConnectionsClient() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { connections, loading, error } = useMutualConnections(user?.id || '');

  // Get the "other" user for each connection
  const enriched = useMemo(() => {
    if (!user) return [];
    return connections.map((conn) => {
      const other: User | undefined =
        conn.user1Id === user.id ? conn.user2 : conn.user1;
      return { ...conn, otherUser: other };
    });
  }, [connections, user]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Vui long dang nhap de xem ket noi cua ban.</p>
        <Link
          href="/login"
          className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold inline-block"
        >
          Dang nhap
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ket noi cua toi</h1>
          <p className="text-sm text-gray-500">
            Nhung nguoi ban va ban deu muon gap lai
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-gradient-to-r from-primary-50 to-rose-50 rounded-2xl p-4 border border-primary-100/50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Heart className="w-4 h-4 text-primary-600 fill-primary-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">
              Ket noi chi xay ra khi ca hai deu chon &quot;Muon gap lai&quot;
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Sau khi ket noi, ban co the xem anh that va profile day du cua doi phuong.
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">Dang tai ket noi...</p>
        </div>
      ) : enriched.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence>
            {enriched.map((conn, i) => {
              const other = conn.otherUser;
              if (!other) return null;

              // Show real avatar if available, else DiceBear
              const avatarUrl = other.realAvatar || other.avatar;

              return (
                <motion.div
                  key={conn.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={avatarUrl}
                        alt={other.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      {/* Connected badge */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                        <Heart className="w-3 h-3 text-white fill-white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-gray-900 text-base truncate">
                          {other.name}
                        </p>
                        {other.age > 0 && (
                          <span className="text-sm text-gray-500">{other.age}</span>
                        )}
                      </div>

                      {other.occupation && (
                        <p className="text-sm text-gray-500 mb-1 truncate">
                          {other.occupation}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Ket noi {formatDate(conn.connectedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* View profile button */}
                    <Link
                      href={`/user/${other.id}`}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-50 text-primary-600 rounded-xl text-sm font-semibold hover:bg-primary-100 transition flex-shrink-0"
                    >
                      Xem profile
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Chua co ket noi nao
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Di date nhieu hon nhe! Khi ca hai deu chon &quot;Muon gap lai&quot;, ban se duoc ket noi.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg hover:opacity-90 transition"
          >
            <Heart className="w-4 h-4" />
            Kham pha Date Orders
          </Link>
        </motion.div>
      )}
    </div>
  );
}
