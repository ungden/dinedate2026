import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useDateOrders } from '@/hooks/use-date-orders';
import { useRestaurants } from '@/hooks/use-restaurants';
import DateOrderCard from '@/components/date-order-card';
import RestaurantCard from '@/components/restaurant-card';

export default function ExploreScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { restaurants } = useRestaurants();
  const { orders: dateOrders, loading: ordersLoading, reload } = useDateOrders();

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
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
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Tìm bạn ăn tối nay?</Text>
        <Text style={styles.heroSub}>
          Chọn nhà hàng, đặt combo, và hẹn hò hoàn toàn ẩn danh
        </Text>
        <Pressable
          style={styles.heroCta}
          onPress={() => router.push('/(tabs)/create')}
          accessibilityLabel="Tạo đơn hẹn mới"
          accessibilityRole="button"
        >
          <Text style={styles.heroCtaText}>Tạo Đơn Hẹn Ngay</Text>
        </Pressable>
      </View>

      {/* Featured Restaurants */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nhà hàng nổi bật</Text>
          <Pressable onPress={() => router.push('/all-restaurants')} accessibilityLabel="Xem tất cả nhà hàng" accessibilityRole="link">
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.lg }}>
          {restaurants.map((item) => <RestaurantCard key={item.id} restaurant={item} />)}
        </ScrollView>
      </View>

      {/* Date Orders Feed */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đơn hẹn mới nhất</Text>
          <Pressable onPress={() => router.push('/all-date-orders')} accessibilityLabel="Xem tất cả đơn hẹn" accessibilityRole="link">
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </Pressable>
        </View>
        {dateOrders.map((order) => (
          <DateOrderCard key={order.id} order={order} />
        ))}
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
  hero: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
    paddingTop: Spacing.xl,
    gap: Spacing.sm,
  },
  heroTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.white,
  },
  heroSub: {
    fontSize: FontSize.md,
    color: Colors.white,
    opacity: 0.9,
    lineHeight: 22,
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
});
