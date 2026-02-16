'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  RefreshCw,
  Trash2,
  Eye,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ErrorLog {
  id: string;
  error_type: string;
  message: string;
  stack_trace: string | null;
  user_id: string | null;
  session_id: string | null;
  url: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  severity: 'error' | 'warning' | 'info';
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
}

interface ErrorStats {
  error_type: string;
  severity: string;
  count: number;
  unresolved_count: number;
  last_occurrence: string;
}

const severityConfig = {
  error: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    badge: 'bg-red-100 text-red-700',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    badge: 'bg-blue-100 text-blue-700',
  },
};

export default function AdminErrorsPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<ErrorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [resolvedFilter, setResolvedFilter] = useState<string>('unresolved');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadErrors = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter);
      }

      if (resolvedFilter === 'resolved') {
        query = query.eq('is_resolved', true);
      } else if (resolvedFilter === 'unresolved') {
        query = query.eq('is_resolved', false);
      }

      if (searchQuery) {
        query = query.or(`message.ilike.%${searchQuery}%,error_type.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading errors:', error);
      } else {
        setErrors(data || []);
      }
    } catch (err) {
      console.error('Error loading errors:', err);
    }

    setLoading(false);
  };

  const loadStats = async () => {
    try {
      // Get error stats grouped by type and severity
      const { data, error } = await supabase
        .from('error_logs')
        .select('error_type, severity, is_resolved, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading stats:', error);
        return;
      }

      // Aggregate stats manually
      const statsMap = new Map<string, ErrorStats>();

      (data || []).forEach((row) => {
        const key = `${row.error_type}-${row.severity}`;
        const existing = statsMap.get(key);

        if (existing) {
          existing.count++;
          if (!row.is_resolved) {
            existing.unresolved_count++;
          }
        } else {
          statsMap.set(key, {
            error_type: row.error_type,
            severity: row.severity,
            count: 1,
            unresolved_count: row.is_resolved ? 0 : 1,
            last_occurrence: row.created_at,
          });
        }
      });

      setStats(Array.from(statsMap.values()).sort((a, b) => b.count - a.count));
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  useEffect(() => {
    loadErrors();
    loadStats();
  }, [severityFilter, resolvedFilter, searchQuery]);

  const markAsResolved = async (errorId: string) => {
    const { error } = await supabase
      .from('error_logs')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes || null,
      })
      .eq('id', errorId);

    if (error) {
      console.error('Error marking as resolved:', error);
    } else {
      setSelectedError(null);
      setResolutionNotes('');
      loadErrors();
      loadStats();
    }
  };

  const deleteError = async (errorId: string) => {
    if (!confirm('Bạn có chắc muốn xóa log lỗi này?')) return;

    const { error } = await supabase.from('error_logs').delete().eq('id', errorId);

    if (error) {
      console.error('Error deleting:', error);
    } else {
      setSelectedError(null);
      loadErrors();
      loadStats();
    }
  };

  const totalErrors = stats.reduce((sum, s) => sum + s.count, 0);
  const unresolvedErrors = stats.reduce((sum, s) => sum + s.unresolved_count, 0);
  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Lỗi</h1>
          <p className="text-gray-500 text-sm mt-1">Theo dõi và quản lý lỗi ứng dụng</p>
        </div>
        <button
          onClick={() => {
            loadErrors();
            loadStats();
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng lỗi</p>
              <p className="text-xl font-bold text-gray-900">{totalErrors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Chưa giải quyết</p>
              <p className="text-xl font-bold text-red-600">{unresolvedErrors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-xl">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cảnh báo</p>
              <p className="text-xl font-bold text-yellow-600">{warningCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đã giải quyết</p>
              <p className="text-xl font-bold text-green-600">{totalErrors - unresolvedErrors}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Type Summary */}
      {stats.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
          <h2 className="font-bold text-gray-900 mb-3">Loại lỗi phổ biến</h2>
          <div className="space-y-2">
            {stats.slice(0, 5).map((stat, idx) => {
              const config = severityConfig[stat.severity as keyof typeof severityConfig];
              const Icon = config?.icon || AlertTriangle;

              return (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${config?.bg || 'bg-gray-100'}`}>
                      <Icon className={`w-4 h-4 ${config?.color || 'text-gray-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{stat.error_type}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(stat.last_occurrence), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${config?.badge || 'bg-gray-100 text-gray-700'}`}>
                      {stat.count} lỗi
                    </span>
                    {stat.unresolved_count > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                        {stat.unresolved_count} chưa xử lý
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700">Bộ lọc</span>
          </div>
          {showFilters ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {showFilters && (
          <div className="mt-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm lỗi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Severity Filter */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Mức độ</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="error">Lỗi</option>
                  <option value="warning">Cảnh báo</option>
                  <option value="info">Thông tin</option>
                </select>
              </div>

              {/* Resolved Filter */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Trạng thái</label>
                <select
                  value={resolvedFilter}
                  onChange={(e) => setResolvedFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="unresolved">Chưa giải quyết</option>
                  <option value="resolved">Đã giải quyết</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error List */}
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : errors.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Không có lỗi nào!</p>
            <p className="text-gray-400 text-sm">Hệ thống đang hoạt động bình thường.</p>
          </div>
        ) : (
          errors.map((error) => {
            const config = severityConfig[error.severity];
            const Icon = config?.icon || AlertTriangle;

            return (
              <div
                key={error.id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  error.is_resolved ? 'opacity-60' : ''
                }`}
                onClick={() => setSelectedError(error)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${config?.bg || 'bg-gray-100'} shrink-0`}>
                    <Icon className={`w-4 h-4 ${config?.color || 'text-gray-600'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">{error.error_type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${config?.badge || 'bg-gray-100'}`}>
                        {error.severity}
                      </span>
                      {error.is_resolved && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Đã xử lý
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">{error.message}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>
                        {formatDistanceToNow(new Date(error.created_at), { addSuffix: true, locale: vi })}
                      </span>
                      {error.url && <span className="truncate max-w-[200px]">{error.url}</span>}
                    </div>
                  </div>

                  <Eye className="w-4 h-4 text-gray-400 shrink-0" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Error Detail Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900">Chi tiết lỗi</h2>
              <button
                onClick={() => {
                  setSelectedError(null);
                  setResolutionNotes('');
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Error Info */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      severityConfig[selectedError.severity]?.badge || 'bg-gray-100'
                    }`}
                  >
                    {selectedError.severity}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(selectedError.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900">{selectedError.error_type}</h3>
                <p className="text-gray-600 mt-1">{selectedError.message}</p>
              </div>

              {/* Stack Trace */}
              {selectedError.stack_trace && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Stack Trace</h4>
                  <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-xl overflow-x-auto">
                    {selectedError.stack_trace}
                  </pre>
                </div>
              )}

              {/* Context */}
              <div className="grid grid-cols-2 gap-4">
                {selectedError.url && (
                  <div>
                    <h4 className="text-xs text-gray-500 mb-1">URL</h4>
                    <p className="text-sm text-gray-700 break-all">{selectedError.url}</p>
                  </div>
                )}

                {selectedError.session_id && (
                  <div>
                    <h4 className="text-xs text-gray-500 mb-1">Session ID</h4>
                    <p className="text-sm text-gray-700 font-mono">{selectedError.session_id}</p>
                  </div>
                )}

                {selectedError.user_id && (
                  <div>
                    <h4 className="text-xs text-gray-500 mb-1">User ID</h4>
                    <p className="text-sm text-gray-700 font-mono">{selectedError.user_id}</p>
                  </div>
                )}
              </div>

              {/* User Agent */}
              {selectedError.user_agent && (
                <div>
                  <h4 className="text-xs text-gray-500 mb-1">User Agent</h4>
                  <p className="text-sm text-gray-700">{selectedError.user_agent}</p>
                </div>
              )}

              {/* Metadata */}
              {selectedError.metadata && Object.keys(selectedError.metadata).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Metadata</h4>
                  <pre className="bg-gray-100 text-gray-800 text-xs p-4 rounded-xl overflow-x-auto">
                    {JSON.stringify(selectedError.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Resolution */}
              {selectedError.is_resolved ? (
                <div className="bg-green-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-700">Đã giải quyết</span>
                  </div>
                  {selectedError.resolved_at && (
                    <p className="text-sm text-green-600">
                      {new Date(selectedError.resolved_at).toLocaleString('vi-VN')}
                    </p>
                  )}
                  {selectedError.resolution_notes && (
                    <p className="text-sm text-green-700 mt-2">{selectedError.resolution_notes}</p>
                  )}
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Đánh dấu đã giải quyết</h4>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Ghi chú giải quyết (tùy chọn)..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
                    rows={3}
                  />
                  <button
                    onClick={() => markAsResolved(selectedError.id)}
                    className="w-full py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                  >
                    Đánh dấu đã giải quyết
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => deleteError(selectedError.id)}
                  className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
