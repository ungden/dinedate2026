import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, TextInput, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { CUISINE_ICONS, DateOrder } from '@/constants/types';
import { useApplyToDate } from '@/hooks/use-applications';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { getDiceBearAvatar } from '@/lib/dicebear';
import { formatPrice } from '@/lib/format';

const SPLIT_LABELS: Record<string, string> = {
  split: 'Chia đôi', creator_pays: 'Chủ đơn trả', applicant_pays: 'Đối phương trả',
};

export default function DateOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<DateOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const { apply, loading: applyLoading, applied } = useApplyToDate(id || '');
  const [applyMessage, setApplyMessage] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const { data, error } = await supabase
          .from('date_orders')
          .select(`*, creator:users!date_orders_creator_id_fkey(id, name, avatar), restaurant:restaurants!date_orders_restaurant_id_fkey(*), combo:combos!date_orders_combo_id_fkey(*)`)
          .eq('id', id)
          .single();
        if (error || !data) {
          console.warn('[DateOrderDetail] Lỗi tải đơn hẹn:', error?.message);
          setOrder(null);
        } else {
          setOrder({
            id: data.id, creatorId: data.creator_id,
            creator: data.creator ? { id: data.creator.id, name: data.creator.name || 'Ẩn danh', age: 0, avatar: data.creator.avatar || getDiceBearAvatar(data.creator.id), bio: '', location: '', wallet: { balance: 0, escrowBalance: 0, currency: 'VND' }, vipStatus: { tier: 'free', benefits: [] } } : undefined,
            restaurantId: data.restaurant_id,
            restaurant: data.restaurant ? { id: data.restaurant.id, name: data.restaurant.name, description: data.restaurant.description || '', address: data.restaurant.address || '', area: data.restaurant.area || '', city: data.restaurant.city || '', cuisineTypes: data.restaurant.cuisine_types || [], commissionRate: 0.15, status: 'active', logoUrl: data.restaurant.logo_url, coverImageUrl: data.restaurant.cover_image_url, averageRating: data.restaurant.average_rating, reviewCount: data.restaurant.review_count, createdAt: data.restaurant.created_at } : undefined,
            comboId: data.combo_id,
            combo: data.combo ? { id: data.combo.id, restaurantId: data.combo.restaurant_id, name: data.combo.name, description: data.combo.description || '', items: data.combo.items || [], price: data.combo.price, imageUrl: data.combo.image_url, isAvailable: true, createdAt: data.combo.created_at } : undefined,
            dateTime: data.date_time, description: data.description || '', preferredGender: data.preferred_gender,
            paymentSplit: data.payment_split || 'split', comboPrice: data.combo_price || 0,
            platformFee: data.platform_fee || 100000, creatorTotal: data.creator_total || 0,
            applicantTotal: data.applicant_total || 0, status: data.status,
            matchedUserId: data.matched_user_id, applicantCount: data.applicant_count || 0,
            createdAt: data.created_at, expiresAt: data.expires_at,
          });
        }
      } catch (err) {
        console.warn('[DateOrderDetail] Lỗi:', err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Không tìm thấy đơn hẹn</Text>
      </View>
    );
  }

  const cuisine = order.restaurant?.cuisineTypes?.[0];
  const icon = cuisine ? CUISINE_ICONS[cuisine] || '🍽️' : '🍽️';

  return (
    <>
      <Stack.Screen options={{ title: order.restaurant?.name || 'Đơn hẹn' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Cover */}
        <Image
          source={{ uri: order.restaurant?.coverImageUrl || order.combo?.imageUrl }}
          style={styles.cover}
          contentFit="cover"
        />

        {/* Creator info */}
        <View style={styles.section}>
          <View style={styles.creatorRow}>
            <Image source={{ uri: order.creator?.avatar }} style={styles.avatar} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.creatorName}>{order.creator?.name}</Text>
              <Text style={styles.creatorAge}>Avatar ẩn danh</Text>
            </View>
            <View style={styles.applicantBadge}>
              <Text style={styles.applicantCount}>{order.applicantCount} ứng viên</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.description}>{order.description}</Text>
        </View>

        {/* Date + Restaurant */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin hẹn</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoLabel}>Ngày</Text>
              <Text style={styles.infoValue}>
                {new Date(order.dateTime).toLocaleDateString('vi-VN')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>⏰</Text>
              <Text style={styles.infoLabel}>Giờ</Text>
              <Text style={styles.infoValue}>
                {new Date(order.dateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>{icon}</Text>
              <Text style={styles.infoLabel}>Nhà hàng</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{order.restaurant?.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>💰</Text>
              <Text style={styles.infoLabel}>Chia tiền</Text>
              <Text style={styles.infoValue}>{SPLIT_LABELS[order.paymentSplit]}</Text>
            </View>
          </View>
        </View>

        {/* Combo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Combo</Text>
          <View style={styles.comboCard}>
            <Image source={{ uri: order.combo?.imageUrl }} style={styles.comboImage} contentFit="cover" />
            <View style={styles.comboInfo}>
              <Text style={styles.comboName}>{order.combo?.name}</Text>
              <Text style={styles.comboPrice}>{formatPrice(order.comboPrice)}</Text>
              <Text style={styles.comboItems} numberOfLines={2}>
                {order.combo?.items.join(' - ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi phí</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Combo (phần của bạn)</Text>
            <Text style={styles.priceValue}>{formatPrice(order.creatorTotal - order.platformFee)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Phí nền tảng</Text>
            <Text style={styles.priceValue}>{formatPrice(order.platformFee)}</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Bạn trả</Text>
            <Text style={styles.totalValue}>{formatPrice(order.applicantTotal)}</Text>
          </View>
        </View>

        {/* Apply section */}
        {applied ? (
          <View style={styles.appliedBanner}>
            <Text style={styles.appliedText}>Bạn đã ứng tuyển đơn hẹn này</Text>
          </View>
        ) : showApplyForm ? (
          <View style={styles.applyForm}>
            <Text style={styles.applyFormTitle}>Gửi lời ứng tuyển</Text>
            <TextInput
              style={styles.applyInput}
              placeholder="Viết lời nhắn cho người tạo đơn hẹn..."
              placeholderTextColor={Colors.textTertiary}
              value={applyMessage}
              onChangeText={setApplyMessage}
              multiline
              maxLength={200}
            />
            <Text style={styles.applyCharCount}>{applyMessage.length}/200</Text>
            <View style={styles.applyFormButtons}>
              <Pressable style={styles.applyCancelBtn} onPress={() => setShowApplyForm(false)}>
                <Text style={styles.applyCancelText}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[styles.applyBtn, applyLoading && { opacity: 0.6 }]}
                onPress={async () => {
                  if (!user) {
                    Alert.alert('Thông báo', 'Vui lòng đăng nhập để ứng tuyển');
                    return;
                  }
                  await apply(applyMessage || 'Mình muốn tham gia buổi hẹn này!');
                  setShowApplyForm(false);
                  Alert.alert('Thành công!', 'Đã gửi ứng tuyển. Chờ người tạo đơn phản hồi nhé!');
                }}
                disabled={applyLoading}
              >
                <Text style={styles.applyBtnText}>{applyLoading ? 'Đang gửi...' : 'Gửi ứng tuyển'}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.applyBtn} onPress={() => {
            if (!user) {
              Alert.alert('Thông báo', 'Vui lòng đăng nhập để ứng tuyển');
              return;
            }
            setShowApplyForm(true);
          }} accessibilityLabel="Ứng tuyển đơn hẹn này" accessibilityRole="button">
            <Text style={styles.applyBtnText}>Ứng tuyển ngay</Text>
          </Pressable>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  content: { gap: 0 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary },
  cover: { width: '100%', height: 200 },
  section: {
    backgroundColor: Colors.card, padding: Spacing.lg, marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.borderLight },
  creatorName: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  creatorAge: { fontSize: FontSize.sm, color: Colors.textSecondary },
  applicantBadge: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, borderRadius: BorderRadius.full,
  },
  applicantCount: { color: Colors.white, fontSize: FontSize.xs, fontWeight: '600' },
  description: { fontSize: FontSize.md, color: Colors.text, lineHeight: 22 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  infoGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
  },
  infoItem: {
    width: '48%', backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md, padding: Spacing.md, gap: 2,
  },
  infoIcon: { fontSize: 20 },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
  infoValue: { fontSize: FontSize.sm, color: Colors.text, fontWeight: '600' },
  comboCard: {
    flexDirection: 'row', backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg, overflow: 'hidden',
  },
  comboImage: { width: 100, height: 80 },
  comboInfo: { flex: 1, padding: Spacing.md, gap: 2 },
  comboName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  comboPrice: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  comboItems: { fontSize: FontSize.xs, color: Colors.textTertiary },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs,
  },
  priceLabel: { fontSize: FontSize.md, color: Colors.textSecondary },
  priceValue: { fontSize: FontSize.md, color: Colors.text },
  totalRow: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingTop: Spacing.md, marginTop: Spacing.xs,
  },
  totalLabel: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary },
  appliedBanner: {
    backgroundColor: Colors.success + '15', marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.success + '30',
  },
  appliedText: { color: Colors.success, fontSize: FontSize.md, fontWeight: '600' },
  applyForm: {
    marginHorizontal: Spacing.lg, backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.sm,
  },
  applyFormTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  applyInput: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.md,
    padding: Spacing.md, fontSize: FontSize.md, color: Colors.text,
    minHeight: 80, textAlignVertical: 'top',
  },
  applyCharCount: { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'right' },
  applyFormButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  applyCancelBtn: {
    flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSecondary, alignItems: 'center',
  },
  applyCancelText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
  applyBtn: {
    flex: 2, backgroundColor: Colors.primary, marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg, alignItems: 'center',
  },
  applyBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
});
