import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { DateOrder } from '@/constants/types';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import { CUISINE_ICONS } from '@/constants/types';
import { formatPriceShort, formatDateTime } from '@/lib/format';

const SPLIT_LABELS: Record<string, string> = {
  split: 'Chia đôi',
  creator_pays: 'Chủ đơn trả',
  applicant_pays: 'Người ứng tuyển trả',
};

export default function DateOrderCard({ order }: { order: DateOrder }) {
  const router = useRouter();
  const cuisine = order.restaurant?.cuisineTypes?.[0];
  const icon = cuisine ? CUISINE_ICONS[cuisine] || '🍽️' : '🍽️';
  const isHot = order.applicantCount >= 5;
  const isNew = Date.now() - new Date(order.createdAt).getTime() <= 60 * 60 * 1000;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/date/${order.id}`)}
      accessibilityLabel={`Đơn hẹn tại ${order.restaurant?.name || 'nhà hàng'} bởi ${order.creator?.name || 'ẩn danh'}`}
      accessibilityRole="button"
    >
      {/* Restaurant cover */}
      <Image
        source={{ uri: order.restaurant?.coverImageUrl || order.combo?.imageUrl || undefined }}
        placeholder={require('../../assets/icon.png')}
        style={styles.cover}
        contentFit="cover"
        accessibilityLabel={`Ảnh nhà hàng ${order.restaurant?.name || ''}`}
      />

      {(isHot || isNew) && (
        <View style={styles.topLeftBadges}>
          {isHot && (
            <View style={[styles.flagBadge, styles.hotFlag]}>
              <Text style={styles.flagText}>🔥 NÓNG</Text>
            </View>
          )}
          {isNew && (
            <View style={[styles.flagBadge, styles.newFlag]}>
              <Text style={styles.flagText}>MỚI</Text>
            </View>
          )}
        </View>
      )}

      {/* Status badge */}
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>
          {order.applicantCount} ứng viên
        </Text>
      </View>

      <View style={styles.body}>
        {/* Creator */}
        <View style={styles.creatorRow}>
          <Image
            source={{ uri: order.creator?.avatar }}
            style={styles.creatorAvatar}
            contentFit="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.creatorName}>{order.creator?.name || 'Ẩn danh'}</Text>
            <Text style={styles.dateTime}>{formatDateTime(order.dateTime)}</Text>
          </View>
          <Text style={styles.priceTag}>{formatPriceShort(order.applicantTotal)} VND</Text>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {order.description}
        </Text>

        {/* Restaurant + Combo */}
        <View style={styles.infoRow}>
          <Text style={styles.cuisineIcon}>{icon}</Text>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {order.restaurant?.name}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.comboName} numberOfLines={1}>
            {order.combo?.name} - {formatPriceShort(order.comboPrice)} VND
          </Text>
        </View>

        {/* Payment split */}
        <View style={styles.splitRow}>
          <View style={styles.splitBadge}>
            <Text style={styles.splitText}>
              {SPLIT_LABELS[order.paymentSplit] || 'Chia đôi'}
            </Text>
          </View>
          {order.preferredGender && (
            <View style={[styles.splitBadge, { backgroundColor: Colors.primaryLight + '30' }]}>
              <Text style={[styles.splitText, { color: Colors.primary }]}>
                {order.preferredGender === 'female' ? 'Nữ' : order.preferredGender === 'male' ? 'Nam' : 'Bất kỳ'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.card,
  },
  cover: {
    width: '100%',
    height: 150,
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  topLeftBadges: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  flagBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  hotFlag: {
    backgroundColor: Colors.secondary,
  },
  newFlag: {
    backgroundColor: Colors.info,
  },
  flagText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  statusText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  body: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  creatorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.borderLight,
  },
  creatorName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  dateTime: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  priceTag: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cuisineIcon: {
    fontSize: 16,
  },
  restaurantName: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  comboName: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    flex: 1,
  },
  splitRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  splitBadge: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  splitText: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: '500',
  },
});
