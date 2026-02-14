import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useConnections, Connection } from '@/hooks/use-connections';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import AuthGuard from '@/components/auth-guard';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function ConnectionCard({ connection }: { connection: Connection }) {
  const router = useRouter();

  const handleChat = () => {
    Alert.alert(
      'Gửi tin nhắn',
      `Gửi tin nhắn cho ${connection.otherUser.name}? Tính năng chat đang được phát triển.`,
      [{ text: 'Đóng' }],
    );
  };

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/connection/[id]', params: { id: connection.id } })}
    >
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: connection.otherUser.avatar }}
          style={styles.avatar}
          contentFit="cover"
        />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{connection.otherUser.name}</Text>
          <Text style={styles.cardRestaurant}>{connection.restaurant.name}</Text>
          <Text style={styles.cardDate}>Ngày hẹn: {formatDate(connection.dateTime)}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <Pressable style={styles.chatBtn} onPress={handleChat}>
          <Text style={styles.chatBtnText}>Nhắn tin</Text>
        </Pressable>
        <Pressable
          style={styles.viewBtn}
          onPress={() => router.push({ pathname: '/connection/[id]', params: { id: connection.id } })}
        >
          <Text style={styles.viewBtnText}>Xem chi tiết</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function ConnectionsScreen() {
  const { user } = useAuth();
  const { connections, loading, reload } = useConnections(user?.id);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  return (
    <AuthGuard>
      <Stack.Screen options={{ headerShown: true, title: 'Kết nối của tôi', headerBackTitle: 'Quay lại' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>💕</Text>
          <Text style={styles.infoText}>
            Đây là những người cả hai đều chọn "Muốn gặp lại" sau buổi hẹn. Thông tin thật đã được tiết lộ cho cả hai!
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xxxl }} />
        ) : connections.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🤝</Text>
            <Text style={styles.emptyTitle}>Chưa có kết nối nào</Text>
            <Text style={styles.emptyDesc}>
              Khi cả hai người đều chọn "Muốn gặp lại" sau buổi hẹn, thông tin thật sẽ được tiết lộ và hiển thị ở đây.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {connections.map((conn) => (
              <ConnectionCard key={conn.id} connection={conn} />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  content: { gap: Spacing.lg, paddingBottom: Spacing.xxxl },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.accent,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 20 },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.borderLight,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  cardRestaurant: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  cardDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chatBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  chatBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  viewBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  viewBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyIcon: { fontSize: 64 },
  emptyTitle: {
    fontSize: FontSize.xxl,
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
