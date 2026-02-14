import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  ScrollView, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    const result = await register(email, password, name);
    setLoading(false);
    if (result.error) {
      Alert.alert('Đăng ký thất bại', result.error);
    } else {
      Alert.alert('Thành công!', 'Tài khoản đã được tạo. Vui lòng xác minh email để đăng nhập.');
      router.replace('/(auth)/login');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🍽️</Text>
          <Text style={styles.title}>Tạo tài khoản</Text>
          <Text style={styles.subtitle}>Đăng ký để tham gia DineDate</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Họ và tên"
            placeholderTextColor={Colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
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
            placeholder="Mật khẩu (ít nhất 6 ký tự)"
            placeholderTextColor={Colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Pressable
            style={[styles.registerBtn, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerBtnText}>
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản?</Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>Đăng nhập</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
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
  title: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.primary },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  form: { gap: Spacing.md },
  input: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, fontSize: FontSize.md, color: Colors.text,
  },
  registerBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm,
  },
  registerBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
  footer: {
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs,
  },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.md },
  loginLink: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.md },
  closeBtn: { alignItems: 'center', padding: Spacing.md },
  closeBtnText: { color: Colors.textTertiary, fontSize: FontSize.md },
});
