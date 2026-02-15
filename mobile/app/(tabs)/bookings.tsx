import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import { useMyDateOrders } from '@/hooks/use-date-orders';
import { useAuth } from '@/contexts/auth-context';
import { DateOrderStatus } from '@/constants/types';
import AuthGuard from '@/components/auth-guard';

type Tab = 'active' | 'upcoming' | 'past';

const STATUS_COLORS: Record<DateOrderStatus, string> = {
  active: Colors.success,
  matched: Colors.info,
  confirmed: Colors.secondary,
  completed: Colors.textTertiary,
  expired: Colors.textTertiary,
  cancelled: Colors.error,
  no_show: Colors.warning,
};

const STATUS_LABELS: Record<DateOrderStatus, string> = {
  active: 'Đang tìm', matched: 'Đã match', confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành', expired: 'Hết hạn', cancelled: 'Đã hủy', no_show: 'Vắng mặt',
};

const ACTIVE_STATUSES: DateOrderStatus[] = ['active', 'matched'];
const UPCOMING_STATUSES: DateOrderStatus[] = ['confirmed'];
const PAST_STATUSES: DateOrderStatus[] = ['completed', 'expired', 'cancelled', 'no_show'];

export default function BookingsScreen() {
  return (
    <AuthGuard>
      <BookingsContent />
    </AuthGuard>
  );
}

function BookingsContent() {
  const [tab, setTab] = useState<Tab>('active');
  const router = useRouter();
  const { user } = useAuth();
  const { created, matched, loading, reload } = useMyDateOrders(user?.id);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const allOrders = useMemo(() => {
    const combined = [...created, ...matched];
    // Deduplicate by id
    const seen = new Set<string>();
    return combined.filter((o) => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
  }, [created, matched]);

  const filteredOrders = useMemo(() => {
    switch (tab) {
      case 'active':
        return allOrders.filter((o) => ACTIVE_STATUSES.includes(o.status));
      case 'upcoming':
        return allOrders.filter((o) => UPCOMING_STATUSES.includes(o.status));
      case 'past':
        return allOrders.filter((o) => PAST_STATUSES.includes(o.status));
      default:
        return [];
    }
  }, [tab, allOrders]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['active', 'upcoming', 'past'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.activeTab]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
              {t === 'active' ? 'Đang hoạt động' : t === 'upcoming' ? 'Sắp tới' : 'Đã qua'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Orders */}
      {filteredOrders.length > 0 ? (
        filteredOrders.map((order) => (
          <Pressable
            key={order.id}
            style={styles.orderCard}
            onPress={() => router.push(`/date/${order.id}`)}
          >
            <Image
              source={{ uri: order.restaurant?.logoUrl }}
              style={styles.orderLogo}
              contentFit="cover"
            />
            <View style={styles.orderInfo}>
              <Text style={styles.orderRestaurant} numberOfLines={1}>
                {order.restaurant?.name}
              </Text>
              <Text style={styles.orderCombo} numberOfLines={1}>
                {order.combo?.name}
              </Text>
              <Text style={styles.orderDate}>
                {new Date(order.dateTime).toLocaleDateString('vi-VN')} - {new Date(order.dateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] + '20' }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] }]}>
                {STATUS_LABELS[order.status]}
              </Text>
            </View>
          </Pressable>
        ))
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>
            {tab === 'active' ? 'Chưa có đơn hẹn nào' : tab === 'upcoming' ? 'Không có lịch hẹn sắp tới' : 'Chưa có đơn hẹn đã qua'}
          </Text>
          <Text style={styles.emptyDesc}>Tạo đơn hẹn mới để bắt đầu!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  content: { padding: Spacing.lg, gap: Spacing.md },
  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.lg, padding: 3,
  },
  tab: {
    flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center',
  },
  activeTab: { backgroundColor: Colors.white },
  tabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  activeTabText: { color: Colors.text, fontWeight: '600' },
  orderCard: {
    flexDirection: 'row', backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, alignItems: 'center', gap: Spacing.md,
    ...Shadows.card,
  },
  orderLogo: { width: 50, height: 50, borderRadius: BorderRadius.md, backgroundColor: Colors.borderLight },
  orderInfo: { flex: 1, gap: 2 },
  orderRestaurant: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  orderCombo: { fontSize: FontSize.sm, color: Colors.textSecondary },
  orderDate: { fontSize: FontSize.xs, color: Colors.textTertiary },
  statusBadge: {
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: '600' },
  empty: {
    alignItems: 'center', padding: Spacing.xxxl, gap: Spacing.md,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  emptyDesc: { fontSize: FontSize.md, color: Colors.textSecondary },
});
