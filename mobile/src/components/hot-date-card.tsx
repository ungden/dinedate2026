import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { DateOrder } from '@/constants/types';
import { BorderRadius, Colors, FontSize, Shadows, Spacing } from '@/constants/theme';
import { formatPriceShort } from '@/lib/format';

function getCountdownLabel(expiresAt: string, nowTs: number): string {
  const endTs = new Date(expiresAt).getTime();
  const diffMs = Math.max(endTs - nowTs, 0);
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours <= 0) return `Còn ${mins} phút`;
  return `Còn ${hours}h ${mins}p`;
}

export default function HotDateCard({ order, nowTs }: { order: DateOrder; nowTs: number }) {
  const router = useRouter();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const countdownLabel = useMemo(() => getCountdownLabel(order.expiresAt, nowTs), [order.expiresAt, nowTs]);

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/date/${order.id}`)}
      accessibilityLabel={`Đơn hẹn nóng tại ${order.restaurant?.name || 'nhà hàng'}`}
      accessibilityRole="button"
    >
      <Image
        source={{ uri: order.restaurant?.coverImageUrl || order.combo?.imageUrl || undefined }}
        placeholder={require('../../assets/icon.png')}
        style={styles.cover}
        contentFit="cover"
      />

      <View style={styles.overlayTop}>
        <View style={styles.hotBadge}>
          <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulse }] }]} />
          <Text style={styles.hotText}>Sắp hết hạn</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{order.restaurant?.name || 'Nhà hàng đối tác'}</Text>
        <Text style={styles.sub} numberOfLines={1}>{order.combo?.name || 'Combo đặc biệt'}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.countdown}>{countdownLabel}</Text>
          <Text style={styles.applicants}>{order.applicantCount} ứng viên</Text>
        </View>

        <Text style={styles.price}>Từ {formatPriceShort(order.applicantTotal)} VND</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 230,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.card,
    marginRight: Spacing.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  cover: {
    width: '100%',
    height: 120,
  },
  overlayTop: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  hotText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.secondary,
  },
  body: {
    padding: Spacing.md,
    gap: 6,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countdown: {
    fontSize: FontSize.xs,
    color: Colors.error,
    fontWeight: '700',
  },
  applicants: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
  price: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '700',
  },
});
