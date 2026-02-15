import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useDateOrders } from '@/hooks/use-date-orders';
import { useRestaurants } from '@/hooks/use-restaurants';
import { useHomeStats } from '@/hooks/use-home-stats';
import { CUISINE_ICONS, CUISINE_LABELS, CuisineType } from '@/constants/types';
import DateOrderCard from '@/components/date-order-card';
import RestaurantCard from '@/components/restaurant-card';
import HotDateCard from '@/components/hot-date-card';
import ComboDealCard from '@/components/combo-deal-card';

const CUISINE_FILTERS: Array<{ id: 'all' | CuisineType; label: string; icon: string }> = [
  { id: 'all', label: 'Tất cả', icon: '✨' },
  { id: 'vietnamese', label: CUISINE_LABELS.vietnamese, icon: CUISINE_ICONS.vietnamese },
  { id: 'japanese', label: CUISINE_LABELS.japanese, icon: CUISINE_ICONS.japanese },
  { id: 'korean', label: CUISINE_LABELS.korean, icon: CUISINE_ICONS.korean },
  { id: 'italian', label: CUISINE_LABELS.italian, icon: CUISINE_ICONS.italian },
  { id: 'thai', label: CUISINE_LABELS.thai, icon: CUISINE_ICONS.thai },
  { id: 'bbq', label: CUISINE_LABELS.bbq, icon: CUISINE_ICONS.bbq },
  { id: 'hotpot', label: CUISINE_LABELS.hotpot, icon: CUISINE_ICONS.hotpot },
  { id: 'seafood', label: CUISINE_LABELS.seafood, icon: CUISINE_ICONS.seafood },
];

function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 1) return 'Vừa xong';
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${diffDays} ngày trước`;
}

function renderStars(rating: number): string {
  return '★'.repeat(Math.max(Math.min(rating, 5), 0)) + '☆'.repeat(Math.max(5 - rating, 0));
}

export default function ExploreScreen() {
  const router = useRouter();
  const ctaScale = useRef(new Animated.Value(1)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<'all' | CuisineType>('all');
  const [nowTs, setNowTs] = useState(Date.now());
  const { restaurants, loading: restaurantsLoading, reload: reloadRestaurants } = useRestaurants();
  const { orders: dateOrders, loading: ordersLoading, reload } = useDateOrders();
  const { stats, comboDeals, highlightReviews, loading: statsLoading, reload: reloadStats } = useHomeStats();

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTs(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaScale, { toValue: 1.03, duration: 900, useNativeDriver: true }),
        Animated.timing(ctaScale, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [ctaScale]);

  const filteredOrders = useMemo(() => {
    if (selectedCuisine === 'all') return dateOrders;
    return dateOrders.filter((order) => (order.restaurant?.cuisineTypes || []).includes(selectedCuisine));
  }, [dateOrders, selectedCuisine]);

  const hotOrders = useMemo(() => {
    const in3HoursMs = 3 * 60 * 60 * 1000;
    return dateOrders
      .filter((order) => {
        const expireMs = new Date(order.expiresAt).getTime() - nowTs;
        return expireMs > 0 && expireMs <= in3HoursMs;
      })
      .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())
      .slice(0, 8);
  }, [dateOrders, nowTs]);

  const feedOrders = filteredOrders.slice(0, 5);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([reload(), reloadRestaurants(), reloadStats()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      <View style={styles.liveStatsWrap}>
        <View style={styles.liveStatItem}>
          <Text style={styles.liveStatIcon}>🟢</Text>
          <Text style={styles.liveStatValue}>{stats.onlineCount}</Text>
          <Text style={styles.liveStatLabel}>đang online</Text>
        </View>
        <View style={styles.liveDivider} />
        <View style={styles.liveStatItem}>
          <Text style={styles.liveStatIcon}>🌆</Text>
          <Text style={styles.liveStatValue}>{stats.tonightOrdersCount}</Text>
          <Text style={styles.liveStatLabel}>hẹn tối nay</Text>
        </View>
        <View style={styles.liveDivider} />
        <View style={styles.liveStatItem}>
          <Text style={styles.liveStatIcon}>💕</Text>
          <Text style={styles.liveStatValue}>{stats.activeOrdersCount}</Text>
          <Text style={styles.liveStatLabel}>chờ match</Text>
        </View>
      </View>

      <View style={styles.liveTickerWrap}>
        <Text style={styles.liveTickerText}>
          🔥 {stats.activeOrdersCount} đơn đang chờ match • 💘 {stats.newConnectionsCount} kết nối mới tuần này
        </Text>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Đêm nay đi ăn cùng ai?</Text>
        <Text style={styles.heroSub}>
          Có <Text style={styles.heroSubStrong}>{stats.activeOrdersCount}</Text> đơn hẹn đang chờ bạn tham gia
        </Text>
        <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
          <Pressable
            style={styles.heroCta}
          onPress={() => router.push('/(tabs)/create')}
          accessibilityLabel="Tạo đơn hẹn mới"
          accessibilityRole="button"
          >
            <Text style={styles.heroCtaText}>Tạo Đơn Hẹn Ngay</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Quick Filters */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lọc nhanh theo khẩu vị</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {CUISINE_FILTERS.map((filter) => {
            const isActive = selectedCuisine === filter.id;
            return (
              <Pressable
                key={filter.id}
                onPress={() => setSelectedCuisine(filter.id)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={styles.filterEmoji}>{filter.icon}</Text>
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Hot Orders */}
      {hotOrders.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Đơn hẹn HOT - sắp chốt</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCardsRow}>
            {hotOrders.map((order) => (
              <HotDateCard key={order.id} order={order} nowTs={nowTs} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Active Match Feed */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đơn hẹn đang chờ match</Text>
          <Pressable onPress={() => router.push('/all-date-orders')} accessibilityLabel="Xem tất cả đơn hẹn" accessibilityRole="link">
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionDesc}>Đang hiển thị {feedOrders.length}/{filteredOrders.length} đơn phù hợp</Text>
        {ordersLoading ? (
          <View style={styles.orderSkeletonWrap}>
            <View style={styles.orderSkeletonCard} />
            <View style={styles.orderSkeletonCard} />
          </View>
        ) : feedOrders.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateIcon}>💌</Text>
            <Text style={styles.emptyStateTitle}>Chưa có đơn phù hợp</Text>
            <Text style={styles.emptyStateSub}>Thử đổi bộ lọc hoặc tạo đơn đầu tiên của bạn.</Text>
          </View>
        ) : (
          feedOrders.map((order) => (
            <DateOrderCard key={order.id} order={order} />
          ))
        )}
      </View>

      {/* Positive Reviews */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cảm nhận nổi bật sau buổi hẹn</Text>
          <Pressable onPress={() => router.push('/my-reviews')} accessibilityLabel="Xem tất cả review" accessibilityRole="link">
            <Text style={styles.seeAll}>Xem thêm</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionDesc}>Những chia sẻ chân thật từ các buổi hẹn được đánh giá tích cực</Text>
        {statsLoading ? (
          <View style={styles.orderSkeletonWrap}>
            <View style={styles.reviewSkeletonCard} />
            <View style={styles.reviewSkeletonCard} />
          </View>
        ) : highlightReviews.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateIcon}>🌟</Text>
            <Text style={styles.emptyStateTitle}>Chưa có cảm nhận nổi bật</Text>
            <Text style={styles.emptyStateSub}>Sau các buổi hẹn thành công, chia sẻ từ người dùng sẽ xuất hiện tại đây.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCardsRow}>
            {highlightReviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <Text style={styles.reviewStars}>{renderStars(review.rating)}</Text>
                <Text style={styles.reviewComment} numberOfLines={4}>“{review.comment}”</Text>
                <View style={styles.reviewFooter}>
                  <Text style={styles.reviewAuthor} numberOfLines={1}>— {review.reviewerName}</Text>
                  <Text style={styles.reviewMeta} numberOfLines={1}>
                    tại {review.restaurantName} • {formatRelativeDate(review.createdAt)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Combo Deals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Combo deals nổi bật</Text>
        </View>
        {statsLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCardsRow}>
            <View style={styles.horizontalSkeletonCard} />
            <View style={styles.horizontalSkeletonCard} />
            <View style={styles.horizontalSkeletonCard} />
          </ScrollView>
        ) : comboDeals.length === 0 ? (
          <View style={styles.inlineEmptyState}>
            <Text style={styles.inlineEmptyText}>Hiện chưa có combo nổi bật</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCardsRow}>
            {comboDeals.map((deal) => <ComboDealCard key={deal.id} deal={deal} />)}
          </ScrollView>
        )}
      </View>

      {/* Featured Restaurants */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nhà hàng nổi bật</Text>
          <Pressable onPress={() => router.push('/all-restaurants')} accessibilityLabel="Xem tất cả nhà hàng" accessibilityRole="link">
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </Pressable>
        </View>
        {restaurantsLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCardsRow}>
            <View style={styles.horizontalSkeletonCard} />
            <View style={styles.horizontalSkeletonCard} />
            <View style={styles.horizontalSkeletonCard} />
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCardsRow}>
            {restaurants.map((item) => <RestaurantCard key={item.id} restaurant={item} />)}
          </ScrollView>
        )}
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  content: {
    paddingTop: 0,
  },
  liveStatsWrap: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  liveStatIcon: {
    fontSize: 12,
  },
  liveStatValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  liveStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  liveDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  liveTickerWrap: {
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  liveTickerText: {
    fontSize: FontSize.sm,
    color: Colors.secondaryDark,
    fontWeight: '700',
  },
  hero: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  heroTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.white,
  },
  heroSub: {
    fontSize: FontSize.md,
    color: Colors.white,
    opacity: 0.9,
    lineHeight: 22,
  },
  heroSubStrong: {
    fontWeight: '800',
    color: Colors.white,
  },
  heroCta: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  heroCtaText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: FontSize.lg,
  },
  section: {
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },
  sectionDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionCount: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  seeAll: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  filtersRow: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  filterEmoji: {
    fontSize: 14,
  },
  filterText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.primary,
  },
  horizontalCardsRow: {
    paddingHorizontal: Spacing.lg,
  },
  horizontalSkeletonCard: {
    width: 180,
    height: 180,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.borderLight,
    marginRight: Spacing.md,
  },
  orderSkeletonWrap: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  orderSkeletonCard: {
    height: 220,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.borderLight,
  },
  emptyStateBox: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyStateIcon: {
    fontSize: 28,
  },
  emptyStateTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyStateSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  inlineEmptyState: {
    paddingHorizontal: Spacing.lg,
  },
  inlineEmptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  reviewSkeletonCard: {
    height: 170,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.borderLight,
  },
  reviewCard: {
    width: 280,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginRight: Spacing.md,
    gap: Spacing.sm,
  },
  reviewStars: {
    color: Colors.warning,
    fontSize: FontSize.md,
    letterSpacing: 1,
    fontWeight: '700',
  },
  reviewComment: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 21,
    minHeight: 84,
  },
  reviewFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    gap: 2,
  },
  reviewAuthor: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  reviewMeta: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
});
