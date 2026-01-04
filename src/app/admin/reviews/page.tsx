'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Review, User } from '@/types';
import { mapDbUserToUser } from '@/lib/user-mapper';
import { 
  Star, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  Loader2,
  Filter
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AdminReview extends Review {
  reviewer: User;
  reviewee: User;
  is_hidden: boolean;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'hidden' | 'visible'>('all');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:users!reviews_reviewer_id_fkey(*),
        reviewee:users!reviews_reviewee_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mapped = data.map((row: any) => ({
        id: row.id,
        userId: row.reviewee_id,
        reviewerId: row.reviewer_id,
        revieweeId: row.reviewee_id,
        rating: row.rating,
        comment: row.comment,
        is_hidden: row.is_hidden,
        createdAt: row.created_at,
        reviewer: mapDbUserToUser(row.reviewer),
        reviewee: mapDbUserToUser(row.reviewee),
      }));
      setReviews(mapped);
    }
    setLoading(false);
  };

  const toggleHidden = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('reviews')
      .update({ is_hidden: !current })
      .eq('id', id);

    if (error) {
      toast.error('Lỗi cập nhật');
    } else {
      toast.success(current ? 'Đã hiện review' : 'Đã ẩn review');
      fetchReviews();
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Chắc chắn xóa review này?')) return;
    
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) {
      toast.error('Lỗi xóa review');
    } else {
      toast.success('Đã xóa review');
      fetchReviews();
    }
  };

  const filtered = reviews.filter((r) => {
    const matchSearch = 
      r.comment.toLowerCase().includes(search.toLowerCase()) ||
      r.reviewer.name.toLowerCase().includes(search.toLowerCase()) ||
      r.reviewee.name.toLowerCase().includes(search.toLowerCase());
    
    if (filterType === 'hidden') return matchSearch && r.is_hidden;
    if (filterType === 'visible') return matchSearch && !r.is_hidden;
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Đánh giá</h1>
        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
          Tổng: {reviews.length}
        </span>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm nội dung, người gửi/nhận..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Tất cả</option>
          <option value="visible">Đang hiện</option>
          <option value="hidden">Đã ẩn</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Người đánh giá</th>
                <th className="px-6 py-4">Người nhận</th>
                <th className="px-6 py-4">Nội dung</th>
                <th className="px-6 py-4">Điểm</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{r.reviewer.name}</div>
                      <div className="text-xs text-gray-500">{r.reviewer.role === 'partner' ? 'Partner' : 'User'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{r.reviewee.name}</div>
                      <div className="text-xs text-gray-500">{r.reviewee.role === 'partner' ? 'Partner' : 'User'}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={r.comment}>
                      {r.comment}
                      {r.is_hidden && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          <EyeOff className="w-3 h-3 mr-1" /> Ẩn
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-yellow-600 font-bold">
                        {r.rating} <Star className="w-3 h-3 fill-yellow-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatRelativeTime(r.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleHidden(r.id, r.is_hidden)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
                          title={r.is_hidden ? "Hiện review" : "Ẩn review"}
                        >
                          {r.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteReview(r.id)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}