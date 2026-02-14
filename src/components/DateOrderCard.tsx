'use client';

import { cn, formatCurrency, getCuisineIcon, formatDateTime, formatRelativeTime, getDateOrderStatusLabel, getDateOrderStatusColor } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { DateOrder, PaymentSplit } from '@/types';
import DiceBearAvatar from '@/components/DiceBearAvatar';
import { Calendar, Users, ArrowRight, Utensils, CreditCard } from 'lucide-react';

interface DateOrderCardProps {
  order: DateOrder;
  currentUserId?: string;
  onApply?: () => void;
  onViewDetail?: () => void;
}

function getPaymentSplitLabel(split: PaymentSplit): string {
  switch (split) {
    case 'split':
      return 'Chia đôi';
    case 'creator_pays':
      return 'Người tạo mời';
    case 'applicant_pays':
      return 'Người join mời';
    default:
      return split;
  }
}

function getPaymentSplitIcon(split: PaymentSplit): string {
  switch (split) {
    case 'split':
      return '🤝';
    case 'creator_pays':
      return '🎁';
    case 'applicant_pays':
      return '💝';
    default:
      return '💰';
  }
}

export default function DateOrderCard({
  order,
  currentUserId,
  onApply,
  onViewDetail,
}: DateOrderCardProps) {
  const isOwner = currentUserId === order.creatorId;
  const isActive = order.status === 'active';
  const canApply = isActive && !isOwner && !!onApply;

  const creator = order.creator;
  const restaurant = order.restaurant;
  const combo = order.combo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      onClick={onViewDetail}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="p-4">
        {/* Header: Creator + Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <DiceBearAvatar
              userId={order.creatorId}
              size="md"
              showVipBadge={!!creator?.vipStatus?.tier && creator.vipStatus.tier !== 'free'}
              vipTier={creator?.vipStatus?.tier}
            />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {creator?.name || 'Ẩn danh'}
              </p>
              <p className="text-xs text-gray-400">
                {formatRelativeTime(order.createdAt)}
              </p>
            </div>
          </div>

          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0',
              getDateOrderStatusColor(order.status)
            )}
          >
            {getDateOrderStatusLabel(order.status)}
          </span>
        </div>

        {/* Description */}
        {order.description && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {order.description}
          </p>
        )}

        {/* Restaurant + Combo info */}
        <div className="rounded-xl bg-gray-50 p-3 mb-3 space-y-2">
          {/* Restaurant */}
          <div className="flex items-center gap-2">
            <span className="text-base">
              {restaurant?.cuisineTypes?.[0]
                ? getCuisineIcon(restaurant.cuisineTypes[0])
                : '🍽️'}
            </span>
            <span className="font-semibold text-gray-800 text-sm truncate">
              {restaurant?.name || 'Nhà hàng'}
            </span>
          </div>

          {/* Combo + Price */}
          {combo && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Utensils className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-600 truncate">
                  {combo.name}
                </span>
              </div>
              <span className="text-sm font-bold text-primary-600 flex-shrink-0 ml-2">
                {formatCurrency(order.comboPrice)}
              </span>
            </div>
          )}
        </div>

        {/* Date/Time + Payment split row */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{formatDateTime(order.dateTime)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span>{getPaymentSplitIcon(order.paymentSplit)}</span>
            <span className="font-medium text-gray-600">
              {getPaymentSplitLabel(order.paymentSplit)}
            </span>
          </div>
        </div>

        {/* Footer: Applicants + Apply button */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <span>
              {order.applicantCount} ứng viên
            </span>
          </div>

          {canApply && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 active:scale-95 transition-all"
            >
              Ứng tuyển
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {isOwner && isActive && (
            <div className="flex items-center gap-1 text-xs text-primary-600 font-medium">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Đơn của bạn</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
