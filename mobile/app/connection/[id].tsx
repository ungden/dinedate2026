import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Linking, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { getDiceBearAvatar } from '@/lib/dicebear';
import AuthGuard from '@/components/auth-guard';
import { supabase } from '@/lib/supabase';

interface ConnectionDetail {
  id: string;
  otherUser: {
    id: string;
    name: string;
    realAvatar?: string;
    avatar?: string;
    phone?: string;
    email?: string;
  };
  restaurant: {
    id: string;
    name: string;
    area: string;
    address?: string;
  };
  dateTime: string;
  connectedAt: string;
  myReview?: { rating: number; comment: string };
  otherReview?: { rating: number; comment: string };
}

function renderStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} lúc ${hours}:${mins}`;
}

export default function ConnectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<ConnectionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConnection() {
      if (!id || !user?.id) { setLoading(false); return; }
      try {
        // Fetch the mutual_connection
        const { data: conn, error } = await supabase
          .from('mutual_connections')
          .select('id, user1_id, user2_id, date_order_id, connected_at')
          .eq('id', id)
          .single();

        if (error || !conn) {
          console.warn('[ConnectionDetail] Lỗi:', error?.message);
          setData(null);
          setLoading(false);
          return;
        }

        const isUser1 = conn.user1_id === user.id;
        const otherUserId = isUser1 ? conn.user2_id : conn.user1_id;

        // Fetch date order with restaurant, and other user info in parallel
        const [orderRes, otherUserRes] = await Promise.all([
          supabase
            .from('date_orders')
            .select('id, date_time, restaurant:restaurants!date_orders_restaurant_id_fkey(id, name, area, address)')
            .eq('id', conn.date_order_id)
            .single(),
          supabase
            .from('users')
            .select('id, name, real_avatar, avatar, phone, email')
            .eq('id', otherUserId)
            .single(),
        ]);

        const otherUserData = otherUserRes.data;
        const orderData = orderRes.data;

        // Fetch reviews for both people on this date order
        const [myReviewRes, otherReviewRes] = await Promise.all([
          supabase
            .from('person_reviews')
            .select('rating, comment')
            .eq('date_order_id', conn.date_order_id)
            .eq('reviewer_id', user.id)
            .single(),
          supabase
            .from('person_reviews')
            .select('rating, comment')
            .eq('date_order_id', conn.date_order_id)
            .eq('reviewer_id', otherUserId)
            .single(),
        ]);

        const restaurant = (orderData as any)?.restaurant;

        setData({
          id: conn.id,
          otherUser: {
            id: otherUserData?.id || '',
            name: otherUserData?.name || 'Ẩn danh',
            realAvatar: otherUserData?.real_avatar,
            avatar: otherUserData?.avatar,
            phone: otherUserData?.phone,
            email: otherUserData?.email,
          },
          restaurant: {
            id: restaurant?.id || '',
            name: restaurant?.name || 'Nhà hàng',
            area: restaurant?.area || '',
            address: restaurant?.address,
          },
          dateTime: orderData?.date_time || '',
          connectedAt: conn.connected_at,
          myReview: myReviewRes.data ? { rating: myReviewRes.data.rating, comment: myReviewRes.data.comment } : undefined,
          otherReview: otherReviewRes.data ? { rating: otherReviewRes.data.rating, comment: otherReviewRes.data.comment } : undefined,
        });
      } catch (err) {
        console.warn('[ConnectionDetail] Lỗi:', err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchConnection();
  }, [id, user?.id]);

  const handleMessage = () => {
    if (!data) return;
    Alert.alert(
      'Gửi tin nhắn',
      `Tính năng nhắn tin với ${data.otherUser.name} đang được phát triển. Bạn có thể liên hệ qua thông tin bên dưới.`,
      [{ text: 'Đóng' }],
    );
  };

  const handleCall = () => {
    if (data?.otherUser.phone) {
      Linking.openURL(`tel:${data.otherUser.phone}`);
    } else {
      Alert.alert('Thông báo', 'Người này chưa chia sẻ số điện thoại.');
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <Stack.Screen options={{ headerShown: true, title: 'Chi tiết kết nối', headerBackTitle: 'Quay lại' }} />
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </AuthGuard>
    );
  }

  if (!data) {
    return (
      <AuthGuard>
        <Stack.Screen options={{ headerShown: true, title: 'Chi tiết kết nối', headerBackTitle: 'Quay lại' }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không tìm thấy thông tin kết nối</Text>
        </View>
      </AuthGuard>
    );
  }

  const otherAvatar = data.otherUser.realAvatar || data.otherUser.avatar || getDiceBearAvatar(data.otherUser.id);

  return (
    <AuthGuard>
      <Stack.Screen options={{ headerShown: true, title: 'Chi tiết kết nối', headerBackTitle: 'Quay lại' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        {/* Mutual match banner */}
        <View style={styles.matchBanner}>
          <Text style={styles.matchIcon}>💕</Text>
          <Text style={styles.matchText}>Cả hai đã muốn gặp lại!</Text>
          <Text style={styles.matchSubtext}>Thông tin thật đã được tiết lộ</Text>
        </View>

        {/* Both avatars */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarGroup}>
            <View style={styles.avatarItem}>
              <Image
                source={{ uri: user?.realAvatar || user?.avatar || getDiceBearAvatar(user?.id || 'me') }}
                style={styles.avatar}
                contentFit="cover"
              />
              <Text style={styles.avatarName}>{user?.name || 'Bạn'}</Text>
              <Text style={styles.avatarLabel}>Bạn</Text>
            </View>

            <View style={styles.heartDivider}>
              <Text style={styles.heartIcon}>❤️</Text>
            </View>

            <View style={styles.avatarItem}>
              <Image
                source={{ uri: otherAvatar }}
                style={styles.avatar}
                contentFit="cover"
              />
              <Text style={styles.avatarName}>{data.otherUser.name}</Text>
              <Text style={styles.avatarLabel}>Kết nối</Text>
            </View>
          </View>
        </View>

        {/* Meeting info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Thông tin buổi hẹn</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🍽️</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nhà hàng</Text>
              <Text style={styles.infoValue}>{data.restaurant.name}</Text>
              {data.restaurant.address && (
                <Text style={styles.infoSub}>{data.restaurant.address}</Text>
              )}
            </View>
          </View>
          {data.dateTime && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ngày hẹn</Text>
                <Text style={styles.infoValue}>{formatDate(data.dateTime)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Reviews */}
        {(data.myReview || data.otherReview) && (
          <View style={styles.reviewsSection}>
            <Text style={styles.reviewsSectionTitle}>Đánh giá của cả hai</Text>

            {data.myReview && (
              <View style={styles.reviewCard}>
                <Text style={styles.reviewAuthor}>{user?.name || 'Bạn'} đánh giá:</Text>
                <Text style={styles.reviewStars}>{renderStars(data.myReview.rating)}</Text>
                {data.myReview.comment ? (
                  <Text style={styles.reviewComment}>{data.myReview.comment}</Text>
                ) : null}
              </View>
            )}

            {data.otherReview && (
              <View style={styles.reviewCard}>
                <Text style={styles.reviewAuthor}>{data.otherUser.name} đánh giá:</Text>
                <Text style={styles.reviewStars}>{renderStars(data.otherReview.rating)}</Text>
                {data.otherReview.comment ? (
                  <Text style={styles.reviewComment}>{data.otherReview.comment}</Text>
                ) : null}
              </View>
            )}
          </View>
        )}

        {/* Contact info */}
        <View style={styles.contactSection}>
          <Text style={styles.contactSectionTitle}>Thông tin liên hệ</Text>
          <View style={styles.contactCard}>
            {data.otherUser.phone && (
              <Pressable
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${data.otherUser.phone}`)}
                accessibilityLabel={`Gọi ${data.otherUser.phone}`}
                accessibilityRole="link"
              >
                <Text style={styles.contactIcon}>📞</Text>
                <Text style={[styles.contactText, { color: Colors.primary }]}>{data.otherUser.phone}</Text>
              </Pressable>
            )}
            {data.otherUser.email && (
              <Pressable
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${data.otherUser.email}`)}
                accessibilityLabel={`Gửi email ${data.otherUser.email}`}
                accessibilityRole="link"
              >
                <Text style={styles.contactIcon}>📧</Text>
                <Text style={[styles.contactText, { color: Colors.primary }]}>{data.otherUser.email}</Text>
              </Pressable>
            )}
            {!data.otherUser.phone && !data.otherUser.email && (
              <Text style={styles.noContact}>Chưa có thông tin liên hệ bổ sung</Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.messageBtn} onPress={handleMessage}>
            <Text style={styles.messageBtnText}>Gửi tin nhắn</Text>
          </Pressable>
          <Pressable style={styles.callBtn} onPress={handleCall}>
            <Text style={styles.callBtnText}>Gọi điện</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  content: { gap: Spacing.lg, paddingBottom: Spacing.xxxl },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary },
  matchBanner: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  matchIcon: { fontSize: 36 },
  matchText: {
    color: Colors.white,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  matchSubtext: {
    color: Colors.white,
    fontSize: FontSize.md,
    opacity: 0.85,
  },
  avatarSection: {
    paddingHorizontal: Spacing.lg,
  },
  avatarGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  avatarItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.borderLight,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  avatarLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  heartDivider: {
    paddingBottom: Spacing.xl,
  },
  heartIcon: { fontSize: 28 },
  infoCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  infoCardTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 20, marginTop: 2 },
  infoContent: { flex: 1, gap: 2 },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  infoSub: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  reviewsSection: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  reviewsSectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  reviewAuthor: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  reviewStars: {
    fontSize: FontSize.lg,
    color: Colors.warning,
    letterSpacing: 2,
  },
  reviewComment: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  contactSection: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  contactSectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  contactCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  contactIcon: { fontSize: 18 },
  contactText: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  noContact: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  messageBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  messageBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.lg,
  },
  callBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  callBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: FontSize.lg,
  },
});
