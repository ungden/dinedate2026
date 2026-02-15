'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PersonReview, RestaurantReview, User } from '@/types';
import { mapDbUserToUser } from '@/lib/user-mapper';
import { 
  Star, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  Loader2,
  Filter,
  UtensilsCrossed,
  Users
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AdminPersonReview {
  id: string;
  dateOrderId: string;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  comment: string;
  wantToMeetAgain: boolean;
  is_hidden: boolean;
  createdAt: string;
  reviewer: User;
  reviewed: User;
  type: 'person';
}

interface AdminRestaurantReview {
  id: string;
  dateOrderId: string;
  reviewerId: string;
  restaurantId: string;
  foodRating: number;
  ambianceRating: number;
  serviceRating: number;
  overallRating: number;
  comment: string;
  is_hidden: boolean;
  createdAt: string;
  reviewer: User;
  restaurantName: string;
  type: 'restaurant';
}

type AdminReview = AdminPersonReview | AdminRestaurantReview;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'person' | 'restaurant' | 'hidden' | 'visible'>('all');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);

    // Fetch person reviews
    const { data: personData, error: personError } = await supabase
      .from('person_reviews')
      .select(`
        *,
        reviewer:users!person_reviews_reviewer_id_fkey(*),
        reviewed:users!person_reviews_reviewed_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    // Fetch restaurant reviews
    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurant_reviews')
      .select(`
        *,
        reviewer:users!restaurant_reviews_reviewer_id_fkey(*),
        restaurant:restaurants!restaurant_reviews_restaurant_id_fkey(name)
      `)
      .order('created_at', { ascending: false });

    const allReviews: AdminReview[] = [];

    if (!personError && personData) {
      personData.forEach((row: any) => {
        allReviews.push({
          id: row.id,
          dateOrderId: row.date_order_id,
          reviewerId: row.reviewer_id,
          reviewedId: row.reviewed_id,
          rating: row.rating,
          comment: row.comment,
          wantToMeetAgain: row.want_to_meet_again,
          is_hidden: row.is_hidden || false,
          createdAt: row.created_at,
          reviewer: mapDbUserToUser(row.reviewer),
          reviewed: mapDbUserToUser(row.reviewed),
          type: 'person',
        });
      });
    }

    if (!restaurantError && restaurantData) {
      restaurantData.forEach((row: any) => {
        allReviews.push({
          id: row.id,
          dateOrderId: row.date_order_id,
          reviewerId: row.reviewer_id,
          restaurantId: row.restaurant_id,
          foodRating: row.food_rating,
          ambianceRating: row.ambiance_rating,
          serviceRating: row.service_rating,
          overallRating: row.overall_rating,
          comment: row.comment,
          is_hidden: row.is_hidden || false,
          createdAt: row.created_at,
          reviewer: mapDbUserToUser(row.reviewer),
          restaurantName: row.restaurant?.name || 'Unknown',
          type: 'restaurant',
        });
      });
    }

    // Sort by date descending
    allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setReviews(allReviews);
    setLoading(false);
  };

  const toggleHidden = async (review: AdminReview) => {
    const table = review.type === 'person' ? 'person_reviews' : 'restaurant_reviews';
    const { error } = await supabase
      .from(table)
      .update({ is_hidden: !review.is_hidden })
      .eq('id', review.id);

    if (error) {
      toast.error('Lỗi cập nhật');
    } else {
      toast.success(review.is_hidden ? 'Đã hiện review' : 'Đã ẩn review');
      fetchReviews();
    }
  };

  const deleteReview = async (review: AdminReview) => {
    if (!confirm('Chắc chắn xóa review này?')) return;
    
    const table = review.type === 'person' ? 'person_reviews' : 'restaurant_reviews';
    const { error } = await supabase.from(table).delete().eq('id', review.id);
    if (error) {
      toast.error('Lỗi xóa review');
    } else {
      toast.success('Đã xóa review');
      fetchReviews();
    }
  };

  const getRating = (review: AdminReview): number => {
    if (review.type === 'person') return review.rating;
    return review.overallRating;
  };

  const getReviewTarget = (review: AdminReview): string => {
    if (review.type === 'person') return review.reviewed.name;
    return review.restaurantName;
  };

  const filtered = reviews.filter((r) => {
    const matchSearch = 
      r.comment.toLowerCase().includes(search.toLowerCase()) ||
      r.reviewer.name.toLowerCase().includes(search.toLowerCase()) ||
      getReviewTarget(r).toLowerCase().includes(search.toLowerCase());
    
    if (filterType === 'hidden') return matchSearch && r.is_hidden;
    if (filterType === 'visible') return matchSearch && !r.is_hidden;
    if (filterType === 'person') return matchSearch && r.type === 'person';
    if (filterType === 'restaurant') return matchSearch && r.type === 'restaurant';
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
          <option value="person">Đánh giá người</option>
          <option value="restaurant">Đánh giá nhà hàng</option>
          <option value="visible">Đang hiện</option>
          <option value="hidden">Đã ẩn</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Loại</th>
                <th className="px-6 py-4">Người đánh giá</th>
                <th className="px-6 py-4">Đối tượng</th>
                <th className="px-6 py-4">Nội dung</th>
                <th className="px-6 py-4">Điểm</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={`${r.type}-${r.id}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {r.type === 'person' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                          <Users className="w-3 h-3" />
                          Người
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-bold">
                          <UtensilsCrossed className="w-3 h-3" />
                          Nhà hàng
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{r.reviewer.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{getReviewTarget(r)}</div>
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
                        {getRating(r)} <Star className="w-3 h-3 fill-yellow-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatRelativeTime(r.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleHidden(r)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
                          title={r.is_hidden ? "Hiện review" : "Ẩn review"}
                        >
                          {r.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteReview(r)}
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
