import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { Colors, Spacing, FontSize, BorderRadius, APP_VERSION } from '@/constants/theme';
import { getDiceBearAvatar } from '@/lib/dicebear';

function formatBalance(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.authPrompt}>
        <Text style={styles.authIcon}>👤</Text>
        <Text style={styles.authTitle}>Đăng nhập để sử dụng</Text>
        <Text style={styles.authDesc}>Tạo tài khoản hoặc đăng nhập để bắt đầu hẹn hò!</Text>
        <Pressable
          style={styles.authBtn}
          onPress={() => router.push('/(auth)/login')}
          accessibilityLabel="Đăng nhập"
          accessibilityRole="button"
        >
          <Text style={styles.authBtnText}>Đăng nhập</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(auth)/register')} accessibilityLabel="Đăng ký tài khoản" accessibilityRole="link">
          <Text style={styles.registerLink}>Chưa có tài khoản? Đăng ký</Text>
        </Pressable>
      </View>
    );
  }

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Avatar + Info */}
      <View style={styles.header}>
        <Image
          source={{ uri: user.avatar || getDiceBearAvatar(user.id) }}
          style={styles.avatar}
          contentFit="cover"
          accessibilityLabel={`Ảnh đại diện ${user.name}`}
        />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user.rating?.toFixed(1) || '0'}</Text>
            <Text style={styles.statLabel}>Đánh giá</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatBalance(user.wallet.balance)}</Text>
            <Text style={styles.statLabel}>Ví (VND)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user.vipStatus.tier.toUpperCase()}</Text>
            <Text style={styles.statLabel}>Hạng</Text>
          </View>
        </View>
      </View>

      {/* Menu items */}
      <View style={styles.menu}>
        {[
          { icon: '💰', label: 'Ví của tôi', onPress: () => router.push('/wallet') },
          { icon: '⭐', label: 'Nâng cấp VIP', onPress: () => router.push('/vip') },
          { icon: '💬', label: 'Kết nối của tôi', onPress: () => router.push('/connections') },
          { icon: '📝', label: 'Đánh giá của tôi', onPress: () => router.push('/my-reviews') },
          { icon: '⚙️', label: 'Cài đặt', onPress: () => router.push('/settings') },
          { icon: '🛡️', label: 'An toàn & Bảo mật', onPress: () => router.push('/safety') },
          { icon: '📞', label: 'Hỗ trợ', onPress: () => router.push('/support') },
        ].map((item, i) => (
          <Pressable key={i} style={styles.menuItem} onPress={item.onPress} accessibilityLabel={item.label} accessibilityRole="button">
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        ))}
      </View>

      {/* Logout */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout} accessibilityLabel="Đăng xuất" accessibilityRole="button">
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </Pressable>

      <Text style={styles.version}>DineDate v{APP_VERSION}</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  content: { gap: Spacing.lg },
  authPrompt: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: Spacing.xxxl, gap: Spacing.md,
  },
  authIcon: { fontSize: 64 },
  authTitle: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  authDesc: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  authBtn: {
    backgroundColor: Colors.primary, paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxxl, borderRadius: BorderRadius.full, marginTop: Spacing.md,
  },
  authBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.lg },
  registerLink: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.md, marginTop: Spacing.sm },
  header: {
    backgroundColor: Colors.white, alignItems: 'center',
    paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg, gap: Spacing.sm,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.borderLight, borderWidth: 3, borderColor: Colors.primary,
  },
  name: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  email: { fontSize: FontSize.sm, color: Colors.textSecondary },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, gap: Spacing.lg,
  },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  menu: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight, gap: Spacing.md,
  },
  menuIcon: { fontSize: 20 },
  menuLabel: { flex: 1, fontSize: FontSize.md, color: Colors.text, fontWeight: '500' },
  menuArrow: { fontSize: FontSize.xxl, color: Colors.textTertiary },
  logoutBtn: {
    marginHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg, backgroundColor: Colors.error + '10',
    alignItems: 'center',
  },
  logoutText: { color: Colors.error, fontWeight: '600', fontSize: FontSize.md },
  version: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textTertiary },
});
