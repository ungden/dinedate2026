import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Đang tải...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>Đăng nhập để tiếp tục</Text>
        <Text style={styles.desc}>Bạn cần đăng nhập để sử dụng tính năng này</Text>
        <Pressable style={styles.btn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.btnText}>Đăng nhập</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxxl, gap: Spacing.md, backgroundColor: Colors.background },
  loading: { fontSize: FontSize.lg, color: Colors.textSecondary },
  icon: { fontSize: 48 },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  desc: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  btn: { backgroundColor: Colors.primary, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxxl, borderRadius: BorderRadius.full, marginTop: Spacing.md },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.lg },
  backText: { color: Colors.textTertiary, fontSize: FontSize.md, marginTop: Spacing.sm },
});
