import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { useDateOrders } from '@/hooks/use-date-orders';
import DateOrderCard from '@/components/date-order-card';
import { Colors, Spacing, FontSize } from '@/constants/theme';

export default function AllDateOrdersScreen() {
  const { orders, loading, reload } = useDateOrders();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Tất cả đơn hẹn', headerBackTitle: 'Quay lại' }} />
      <View style={styles.container}>
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DateOrderCard order={item} />}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListHeaderComponent={
            <Text style={styles.subtitle}>
              {orders.length} đơn hẹn đang hoạt động
            </Text>
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xxxl }} />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>Chưa có đơn hẹn nào</Text>
                <Text style={styles.emptyDesc}>
                  Các đơn hẹn mới sẽ hiển thị ở đây. Kéo xuống để làm mới.
                </Text>
              </View>
            )
          }
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  content: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
