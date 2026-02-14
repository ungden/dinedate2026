import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  ScrollView, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function LoginScreen() {
  const { login, resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.error) {
      Alert.alert('Đăng nhập thất bại', result.error);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🍽️</Text>
          <Text style={styles.title}>DineDate</Text>
          <Text style={styles.subtitle}>Đăng nhập để bắt đầu hẹn hò</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            placeholderTextColor={Colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Pressable
            style={[styles.loginBtn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
            accessibilityLabel={loading ? 'Đang xử lý đăng nhập' : 'Đăng nhập'}
            accessibilityRole="button"
          >
            <Text style={styles.loginBtnText}>
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </Text>
          </Pressable>

          <Pressable
            onPress={async () => {
              if (!email) {
                Alert.alert('Quên mật khẩu', 'Vui lòng nhập email trước khi nhấn quên mật khẩu.');
                return;
              }
              if (!isValidEmail(email)) {
                Alert.alert('Lỗi', 'Email không hợp lệ.');
                return;
              }
              const result = await resetPassword(email);
              if (result.error) {
                Alert.alert('Lỗi', result.error);
              } else {
                Alert.alert('Thành công', 'Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.');
              }
            }}
            style={styles.forgotBtn}
            accessibilityLabel="Quên mật khẩu"
            accessibilityRole="link"
          >
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản?</Text>
          <Pressable onPress={() => router.push('/(auth)/register')} accessibilityLabel="Đăng ký tài khoản" accessibilityRole="link">
            <Text style={styles.registerLink}>Đăng ký ngay</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => router.back()} style={styles.closeBtn} accessibilityLabel="Đóng" accessibilityRole="button">
          <Text style={styles.closeBtnText}>Đóng</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flexGrow: 1, justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.xxl,
  },
  header: { alignItems: 'center', gap: Spacing.sm },
  logo: { fontSize: 64 },
  title: { fontSize: FontSize.title, fontWeight: '800', color: Colors.primary },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  form: { gap: Spacing.md },
  input: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, fontSize: FontSize.md, color: Colors.text,
  },
  loginBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm,
  },
  loginBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
  forgotBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  forgotText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '500' },
  footer: {
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs,
  },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.md },
  registerLink: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.md },
  closeBtn: { alignItems: 'center', padding: Spacing.md },
  closeBtnText: { color: Colors.textTertiary, fontSize: FontSize.md },
});
