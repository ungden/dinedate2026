'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  MoreHorizontal,
  Eye,
  Ban,
  Check,
  X,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ReportRow {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  category: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: {
    id: string;
    name: string;
    avatar_url: string;
  };
  reported_user?: {
    id: string;
    name: string;
    avatar_url: string;
    is_banned: boolean;
  };
}

const REASON_LABELS: Record<string, string> = {
  'inappropriate_behavior': 'Hành vi không phù hợp',
  'fake_photos': 'Ảnh giả mạo',
  'scam': 'Lừa đảo/Scam',
  'harassment': 'Quấy rối',
  'other': 'Khác',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: {
    label: 'Chờ xử lý',
    color: 'bg-amber-50 text-amber-700 border-amber-100',
    icon: Clock,
  },
  reviewing: {
    label: 'Đang xem xét',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    icon: Eye,
  },
  resolved: {
    label: 'Đã xử lý',
    color: 'bg-green-50 text-green-700 border-green-100',
    icon: CheckCircle,
  },
  dismissed: {
    label: 'Đã bác bỏ',
    color: 'bg-gray-50 text-gray-600 border-gray-100',
    icon: X,
  },
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewing' | 'resolved' | 'dismissed'>('all');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);

    try {
      // Fetch reports with reporter and reported user info
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          reporter_id,
          reported_user_id,
          category,
          description,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        setReports([]);
      } else {
        // Fetch user details for reporters and reported users
        const reporterIds = [...new Set((data || []).map((r: any) => r.reporter_id))];
        const reportedIds = [...new Set((data || []).map((r: any) => r.reported_user_id))];
        const allUserIds = [...new Set([...reporterIds, ...reportedIds])];

        const { data: users } = await supabase
          .from('users')
          .select('id, name, avatar_url, is_banned')
          .in('id', allUserIds);

        const usersMap = new Map((users || []).map((u: any) => [u.id, u]));

        const enrichedReports = (data || []).map((report: any) => ({
          ...report,
          reporter: usersMap.get(report.reporter_id),
          reported_user: usersMap.get(report.reported_user_id),
        }));

        setReports(enrichedReports);
      }
    } catch (err) {
      console.error('Error:', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: 'reviewing' | 'resolved' | 'dismissed') => {
    setProcessing(reportId);

    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) {
        toast.error('Không thể cập nhật trạng thái');
        console.error(error);
      } else {
        toast.success(`Đã đánh dấu là "${STATUS_CONFIG[newStatus].label}"`);
        await fetchReports();
      }
    } catch (err) {
      toast.error('Lỗi xử lý');
    } finally {
      setProcessing(null);
      setActionMenuId(null);
    }
  };

  const handleBanUser = async (userId: string, reportId: string) => {
    setProcessing(reportId);

    try {
      // Ban the user
      const { error: banError } = await supabase
        .from('users')
        .update({ is_banned: true })
        .eq('id', userId);

      if (banError) {
        toast.error('Không thể khóa người dùng');
        console.error(banError);
        return;
      }

      // Update report status
      const { error: reportError } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

      if (reportError) {
        console.error('Report update error:', reportError);
      }

      toast.success('Đã khóa người dùng và xử lý báo cáo');
      await fetchReports();
    } catch (err) {
      toast.error('Lỗi xử lý');
    } finally {
      setProcessing(null);
      setActionMenuId(null);
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.reporter?.name?.toLowerCase().includes(search.toLowerCase()) ||
      report.reported_user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      report.description?.toLowerCase().includes(search.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && report.status === filterStatus;
  });

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Báo cáo</h1>
          <p className="text-sm text-gray-500 mt-1">Xem xét và xử lý các báo cáo từ người dùng</p>
        </div>
        {pendingCount > 0 && (
          <span className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-100">
            {pendingCount} báo cáo chờ xử lý
          </span>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên người dùng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="reviewing">Đang xem xét</option>
            <option value="resolved">Đã xử lý</option>
            <option value="dismissed">Đã bác bỏ</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tải dữ liệu...
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không tìm thấy báo cáo nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReports.map((report) => {
              const statusConfig = STATUS_CONFIG[report.status];
              const StatusIcon = statusConfig.icon;

              return (
                <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Reporter & Reported User */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                            {report.reporter?.avatar_url ? (
                              <Image
                                src={report.reporter.avatar_url}
                                alt={report.reporter.name || 'Reporter'}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                                ?
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-gray-900 text-sm">
                            {report.reporter?.name || 'Người dùng'}
                          </span>
                        </div>

                        <span className="text-gray-400 text-sm">báo cáo</span>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                            {report.reported_user?.avatar_url ? (
                              <Image
                                src={report.reported_user.avatar_url}
                                alt={report.reported_user.name || 'Reported'}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                                ?
                              </div>
                            )}
                          </div>
                          <Link
                            href={`/user/${report.reported_user_id}`}
                            target="_blank"
                            className="font-medium text-gray-900 text-sm hover:text-primary-600 flex items-center gap-1"
                          >
                            {report.reported_user?.name || 'Người dùng'}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          {report.reported_user?.is_banned && (
                            <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-bold">
                              Đã bị khóa
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-100">
                          {REASON_LABELS[report.category] || report.category}
                        </span>
                        <span className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1', statusConfig.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Description */}
                      {report.description && (
                        <p className="text-sm text-gray-600 leading-relaxed mb-2 line-clamp-2">
                          {report.description}
                        </p>
                      )}

                      {/* Time */}
                      <p className="text-xs text-gray-400">
                        {formatRelativeTime(report.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuId(actionMenuId === report.id ? null : report.id)}
                        disabled={processing === report.id}
                        className={cn(
                          'p-2 hover:bg-gray-100 rounded-lg transition',
                          processing === report.id && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {processing === report.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        ) : (
                          <MoreHorizontal className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {actionMenuId === report.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-48 z-10">
                          {report.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(report.id, 'reviewing')}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4 text-blue-500" />
                               Đánh dấu đang xem
                            </button>
                          )}

                          {report.status !== 'resolved' && (
                            <button
                              onClick={() => handleUpdateStatus(report.id, 'resolved')}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Check className="w-4 h-4 text-green-500" />
                               Đánh dấu đã xử lý
                            </button>
                          )}

                          {!report.reported_user?.is_banned && (
                            <button
                              onClick={() => handleBanUser(report.reported_user_id, report.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Ban className="w-4 h-4" />
                               Khóa người dùng
                            </button>
                          )}

                          <button
                            onClick={() => setActionMenuId(null)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                             Đóng
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
