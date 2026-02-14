import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { VIPTier } from '@/constants/types';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/auth-guard';

interface TierInfo {
  tier: VIPTier;
  label: string;
  price: string;
  priceValue: number;
  color: string;
  bgColor: string;
  borderColor: string;
  benefits: string[];
}

const TIERS: TierInfo[] = [
  {
    tier: 'free',
    label: 'Miễn phí',
    price: '0đ/tháng',
    priceValue: 0,
    color: Colors.textSecondary,
    bgColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    benefits: [
      'Tạo tối đa 3 đơn hẹn/tháng',
      'Ứng tuyển 5 đơn hẹn/tháng',
      'Avatar ẩn danh DiceBear',
      'Xem đánh giá cơ bản',
    ],
  },
  {
    tier: 'vip',
    label: 'VIP',
    price: '99.000đ/tháng',
    priceValue: 99000,
    color: Colors.vipGold,
    bgColor: Colors.vipGoldBg,
    borderColor: Colors.vipGold,
    benefits: [
      'Tạo không giới hạn đơn hẹn',
      'Ứng tuyển không giới hạn',
      'Huy hiệu VIP nổi bật',
      'Xem ai đã ứng tuyển trước',
      'Ưu tiên hiển thị đơn hẹn',
      'Giảm 20% phí nền tảng',
    ],
  },
  {
    tier: 'svip',
    label: 'SVIP',
    price: '199.000đ/tháng',
    priceValue: 199000,
    color: Colors.vipPurple,
    bgColor: Colors.vipPurpleBg,
    borderColor: Colors.vipPurple,
    benefits: [
      'Tất cả quyền lợi VIP',
      'Huy hiệu SVIP kim cương',
      'Xem thông tin chi tiết ứng viên',
      'Tự chọn nhà hàng ngoài danh sách',
      'Hỗ trợ 24/7 riêng biệt',
      'Miễn phí nền tảng hoàn toàn',
      'Mời bạn bè nhận thưởng 50k',
    ],
  },
];

export default function VIPScreen() {
  const { user, refreshProfile } = useAuth();
  const currentTier = user?.vipStatus?.tier || 'free';
  const [selectedTier, setSelectedTier] = useState<VIPTier>(currentTier);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const handleUpgrade = (tier: TierInfo) => {
    if (tier.tier === currentTier) {
      Alert.alert('Thông báo', 'Đây là gói hiện tại của bạn.');
      return;
    }
    if (tier.tier === 'free') {
      Alert.alert(
        'Hạ cấp',
        'Bạn có chắc muốn hủy gói VIP và chuyển về miễn phí?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xác nhận', onPress: () => processDowngrade() },
        ],
      );
      return;
    }
    Alert.alert(
      `Nâng cấp ${tier.label}`,
      `Số dư ví: ${(user?.wallet?.balance || 0).toLocaleString('vi-VN')}đ\nGiá gói: ${tier.price}\n\nXác nhận nâng cấp?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Nâng cấp', onPress: () => processUpgrade(tier) },
      ],
    );
  };

  const processUpgrade = async (tier: TierInfo) => {
    setUpgradeLoading(true);
    try {
      const { data, error } = await supabase.rpc('upgrade_vip', {
        target_tier: tier.tier,
        plan_type: 'monthly',
      });

      if (error) throw error;

      const result = typeof data === 'string' ? JSON.parse(data) : data;
      if (result.success) {
        await refreshProfile();
        Alert.alert('Thành công', `Đã nâng cấp lên ${tier.label}! Chúc bạn có trải nghiệm tuyệt vời.`);
      } else {
        Alert.alert('Không thể nâng cấp', result.error || 'Vui lòng thử lại sau.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể nâng cấp';
      Alert.alert('Lỗi', msg);
    } finally {
      setUpgradeLoading(false);
    }
  };

  const processDowngrade = async () => {
    setUpgradeLoading(true);
    try {
      const { data, error } = await supabase.rpc('downgrade_vip');

      if (error) throw error;

      const result = typeof data === 'string' ? JSON.parse(data) : data;
      if (result.success) {
        await refreshProfile();
        Alert.alert('Thành công', 'Đã chuyển về gói miễn phí.');
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể hạ cấp');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể hạ cấp';
      Alert.alert('Lỗi', msg);
    } finally {
      setUpgradeLoading(false);
    }
  };

  return (
    <AuthGuard>
      <Stack.Screen options={{ headerShown: true, title: 'Nâng cấp VIP', headerBackTitle: 'Quay lại' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        {/* Current tier header */}
        <View style={styles.currentTierCard}>
          <Text style={styles.currentLabel}>Gói hiện tại của bạn</Text>
          <Text style={[styles.currentTier, { color: TIERS.find(t => t.tier === currentTier)?.color || Colors.text }]}>
            {TIERS.find(t => t.tier === currentTier)?.label || 'Miễn phí'}
          </Text>
        </View>

        {/* Tier cards */}
        {TIERS.map((tier) => {
          const isCurrent = tier.tier === currentTier;
          const isSelected = tier.tier === selectedTier;
          return (
            <Pressable
              key={tier.tier}
              style={[
                styles.tierCard,
                { backgroundColor: tier.bgColor, borderColor: isSelected ? tier.borderColor : Colors.borderLight },
                isSelected && { borderWidth: 2 },
              ]}
              onPress={() => setSelectedTier(tier.tier)}
            >
              {/* Header */}
              <View style={styles.tierHeader}>
                <View style={styles.tierLabelRow}>
                  <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
                    <Text style={styles.tierBadgeText}>{tier.label}</Text>
                  </View>
                  {isCurrent && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Đang dùng</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tierPrice, { color: tier.color }]}>{tier.price}</Text>
              </View>

              {/* Benefits */}
              <View style={styles.benefitsList}>
                {tier.benefits.map((benefit, i) => (
                  <View key={i} style={styles.benefitRow}>
                    <Text style={[styles.benefitCheck, { color: tier.color }]}>✓</Text>
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>

              {/* CTA */}
              {!isCurrent && (
                <Pressable
                  style={[styles.upgradeBtn, { backgroundColor: tier.color }]}
                  onPress={() => handleUpgrade(tier)}
                >
                  <Text style={styles.upgradeBtnText}>
                    {tier.priceValue > (TIERS.find(t => t.tier === currentTier)?.priceValue || 0)
                      ? `Nâng cấp ${tier.label}`
                      : `Chuyển sang ${tier.label}`}
                  </Text>
                </Pressable>
              )}
            </Pressable>
          );
        })}

        <Text style={styles.note}>
          * Thanh toán sẽ được trừ trực tiếp từ ví DineDate. Bạn có thể hủy bất cứ lúc nào.
        </Text>

        {upgradeLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.loadingText}>Đang xử lý...</Text>
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
  currentTierCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  currentLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  currentTier: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
  },
  tierCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    gap: Spacing.lg,
  },
  tierHeader: {
    gap: Spacing.sm,
  },
  tierLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tierBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tierBadgeText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  currentBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  currentBadgeText: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  tierPrice: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  benefitsList: {
    gap: Spacing.sm,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  benefitCheck: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginTop: 1,
  },
  benefitText: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
    lineHeight: 22,
  },
  upgradeBtn: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.lg,
  },
  note: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
    lineHeight: 20,
  },
  loadingOverlay: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
});
