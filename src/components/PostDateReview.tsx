'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { PersonReview, RestaurantReview } from '@/types';
import DiceBearAvatar from '@/components/DiceBearAvatar';
import { Star, Heart, Send, Utensils, Palette, HeadphonesIcon } from 'lucide-react';

interface PostDateReviewProps {
  dateOrderId: string;
  partnerId: string;
  partnerName: string;
  restaurantId: string;
  restaurantName: string;
  onSubmit: (
    personReview: Omit<PersonReview, 'id' | 'createdAt' | 'reviewerId' | 'reviewer' | 'reviewed'>,
    restaurantReview: Omit<RestaurantReview, 'id' | 'createdAt' | 'reviewerId' | 'reviewer' | 'restaurant'>
  ) => void;
}

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md';
}

function StarRatingInput({ value, onChange, size = 'md' }: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0);
  const iconSize = size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              iconSize,
              'transition-colors',
              (hovered || value) >= star
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function PostDateReview({
  dateOrderId,
  partnerId,
  partnerName,
  restaurantId,
  restaurantName,
  onSubmit,
}: PostDateReviewProps) {
  // Person review state
  const [personRating, setPersonRating] = useState(0);
  const [personComment, setPersonComment] = useState('');
  const [wantToMeetAgain, setWantToMeetAgain] = useState(false);

  // Restaurant review state
  const [foodRating, setFoodRating] = useState(0);
  const [ambianceRating, setAmbianceRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [restaurantComment, setRestaurantComment] = useState('');

  const isValid =
    personRating > 0 &&
    foodRating > 0 &&
    ambianceRating > 0 &&
    serviceRating > 0 &&
    overallRating > 0;

  function handleSubmit() {
    if (!isValid) return;

    onSubmit(
      {
        dateOrderId,
        reviewedId: partnerId,
        rating: personRating,
        comment: personComment,
        wantToMeetAgain,
      },
      {
        dateOrderId,
        restaurantId,
        foodRating,
        ambianceRating,
        serviceRating,
        overallRating,
        comment: restaurantComment,
      }
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Rate the person */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl border border-gray-100 p-5"
      >
        <h3 className="font-bold text-gray-900 text-base mb-4">
          Đánh giá buổi hẹn
        </h3>

        <div className="flex items-center gap-3 mb-4">
          <DiceBearAvatar userId={partnerId} size="lg" />
          <div>
            <p className="font-semibold text-gray-800 text-sm">{partnerName}</p>
            <p className="text-xs text-gray-400">Đối phương của bạn</p>
          </div>
        </div>

        {/* Star rating */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Đánh giá chung
          </label>
          <StarRatingInput value={personRating} onChange={setPersonRating} />
        </div>

        {/* Comment */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nhận xét
          </label>
          <textarea
            value={personComment}
            onChange={(e) => setPersonComment(e.target.value)}
            placeholder="Chia sẻ cảm nhận của bạn..."
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
          />
        </div>

        {/* Want to meet again */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={cn(
              'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors',
              wantToMeetAgain
                ? 'bg-primary-500 border-primary-500'
                : 'border-gray-300 group-hover:border-primary-300'
            )}
            onClick={() => setWantToMeetAgain(!wantToMeetAgain)}
          >
            {wantToMeetAgain && <Heart className="w-3.5 h-3.5 text-white fill-white" />}
          </div>
          <span className="text-sm text-gray-700 font-medium">
            Muốn gặp lại?
          </span>
          <span className="text-xs text-gray-400">
            (Nếu cả 2 đều chọn, bạn sẽ được kết nối!)
          </span>
        </label>
      </motion.div>

      {/* Section 2: Rate the restaurant */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 p-5"
      >
        <h3 className="font-bold text-gray-900 text-base mb-4">
          Đánh giá nhà hàng
        </h3>

        <p className="text-sm text-gray-600 font-medium mb-4">
          {restaurantName}
        </p>

        {/* Rating rows */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Utensils className="w-4 h-4 text-gray-400" />
              <span>Món ăn</span>
            </div>
            <StarRatingInput value={foodRating} onChange={setFoodRating} size="sm" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Palette className="w-4 h-4 text-gray-400" />
              <span>Không gian</span>
            </div>
            <StarRatingInput value={ambianceRating} onChange={setAmbianceRating} size="sm" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <HeadphonesIcon className="w-4 h-4 text-gray-400" />
              <span>Phục vụ</span>
            </div>
            <StarRatingInput value={serviceRating} onChange={setServiceRating} size="sm" />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-800 font-semibold">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Tổng thể</span>
            </div>
            <StarRatingInput value={overallRating} onChange={setOverallRating} size="sm" />
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nhận xét nhà hàng
          </label>
          <textarea
            value={restaurantComment}
            onChange={(e) => setRestaurantComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm tại nhà hàng..."
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
          />
        </div>
      </motion.div>

      {/* Submit */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={handleSubmit}
        disabled={!isValid}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-colors',
          isValid
            ? 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        )}
      >
        <Send className="w-4 h-4" />
        Gửi đánh giá
      </motion.button>
    </div>
  );
}
