import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useWallet, WalletTransaction } from '@/hooks/use-wallet';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/auth-guard';

function formatCurrency(amount: number): string {
  return amount.toLocaleString('vi-VN');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month} - ${hours}:${mins}`;
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  topup: { label: 'Nạp tiền', icon: '💰', color: Colors.success },
  payment: { label: 'Thanh toán', icon: '💳', color: Colors.error },
  escrow: { label: 'Đặt cọc', icon: '🔒', color: Colors.warning },
  refund: { label: 'Hoàn tiền', icon: '↩️', color: Colors.info },
  withdraw: { label: 'Rút tiền', icon: '🏦', color: Colors.textSecondary },
};

function TransactionItem({ tx }: { tx: WalletTransaction }) {
  const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.payment;
  const isPositive = tx.amount > 0;

  return (
    <View style={styles.txItem}>
      <View style={styles.txIconWrap}>
        <Text style={styles.txIcon}>{config.icon}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txLabel}>{config.label}</Text>
        <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
        <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
      </View>
      <Text style={[styles.txAmount, { color: isPositive ? Colors.success : Colors.error }]}>
        {isPositive ? '+' : ''}{formatCurrency(tx.amount)} đ
      </Text>
    </View>
  );
}

const TOPUP_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

export default function WalletScreen() {
  const { user, refreshProfile } = useAuth();
  const { balance, escrowBalance, transactions, loading, reload } = useWallet(user?.id);
  const [topUpLoading, setTopUpLoading] = useState(false);

  const handleTopUp = () => {
    Alert.alert(
      'Nạp tiền',
      'Chọn số tiền muốn nạp:',
      [
        ...TOPUP_AMOUNTS.map((amount) => ({
          text: `${amount.toLocaleString('vi-VN')}đ`,
          onPress: () => selectPaymentMethod(amount),
        })),
        { text: 'Hủy', style: 'cancel' as const },
      ],
    );
  };

  const selectPaymentMethod = (amount: number) => {
    Alert.alert(
      'Phương thức thanh toán',
      `Nạp ${amount.toLocaleString('vi-VN')}đ qua:`,
      [
        { text: 'MoMo', onPress: () => processTopUp(amount, 'momo') },
        { text: 'Ngân hàng', onPress: () => processTopUp(amount, 'bank_transfer') },
        { text: 'Hủy', style: 'cancel' },
      ],
    );
  };

  const processTopUp = async (amount: number, method: string) => {
    setTopUpLoading(true);
    try {
      const { data, error } = await supabase.rpc('request_topup', {
        topup_amount: amount,
        payment_method: method,
      });

      if (error) throw error;

      const result = typeof data === 'string' ? JSON.parse(data) : data;
      if (result.success) {
        Alert.alert(
          'Yêu cầu nạp tiền đã gửi',
          `Mã giao dịch: ${result.transaction_id?.slice(0, 8)}...\n` +
          `Số tiền: ${amount.toLocaleString('vi-VN')}đ\n` +
          `Phương thức: ${method === 'momo' ? 'MoMo' : 'Chuyển khoản ngân hàng'}\n\n` +
          'Số dư sẽ được cập nhật sau khi xác nhận thanh toán.',
        );
        reload();
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể tạo yêu cầu nạp tiền');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể nạp tiền';
      Alert.alert('Lỗi', msg);
    } finally {
      setTopUpLoading(false);
    }
  };

  return (
    <AuthGuard>
      <Stack.Screen options={{ headerShown: true, title: 'Ví của tôi', headerBackTitle: 'Quay lại' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceCardInner}>
            <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(balance)} đ</Text>
            <View style={styles.escrowRow}>
              <Text style={styles.escrowLabel}>Đang tạm giữ (escrow)</Text>
              <Text style={styles.escrowAmount}>{formatCurrency(escrowBalance)} đ</Text>
            </View>
            <Pressable style={[styles.topUpBtn, topUpLoading && { opacity: 0.6 }]} onPress={handleTopUp} disabled={topUpLoading}>
              {topUpLoading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={styles.topUpText}>Nạp tiền</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
          ) : transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
            </View>
          ) : (
            <View style={styles.txList}>
              {transactions.map((tx) => (
                <TransactionItem key={tx.id} tx={tx} />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  content: { gap: Spacing.lg, paddingBottom: Spacing.xxxl },
  balanceCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  balanceCardInner: {
    backgroundColor: Colors.primary,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  balanceLabel: {
    color: Colors.white,
    fontSize: FontSize.md,
    opacity: 0.9,
  },
  balanceAmount: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1,
  },
  escrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    backgroundColor: Colors.overlayLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  escrowLabel: {
    color: Colors.white,
    fontSize: FontSize.sm,
    opacity: 0.85,
  },
  escrowAmount: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  topUpBtn: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  topUpText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: FontSize.lg,
  },
  section: {
    marginHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  txList: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.md,
  },
  txIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIcon: {
    fontSize: 18,
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  txDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  txDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  txAmount: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
});
