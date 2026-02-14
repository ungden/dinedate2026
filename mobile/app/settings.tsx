import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Switch } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { Colors, Spacing, FontSize, BorderRadius, APP_VERSION } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/auth-guard';

export default function SettingsScreen() {
  const { user, logout, resetPassword, deleteAccount } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Load email notification preference from Supabase
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('users')
      .select('email_notifications')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.email_notifications !== undefined) {
          setEmailNotifications(data.email_notifications);
        }
      });
  }, [user?.id]);

  const handleToggleEmailNotifications = async (value: boolean) => {
    setEmailNotifications(value);
    if (!user?.id) return;
    try {
      await supabase.from('users').update({ email_notifications: value }).eq('id', user.id);
    } catch (err) {
      console.warn('[settings] Lỗi cập nhật email_notifications:', err);
      setEmailNotifications(!value); // revert on error
    }
  };

  const handleEditProfile = () => {
    Alert.alert('Chỉnh sửa hồ sơ', 'Tính năng chỉnh sửa hồ sơ đang được phát triển.', [{ text: 'Đóng' }]);
  };

  const handleChangePassword = () => {
    const email = user?.email;
    if (!email) {
      Alert.alert('Lỗi', 'Không tìm thấy email tài khoản.');
      return;
    }
    Alert.alert(
      'Đổi mật khẩu',
      `Chúng tôi sẽ gửi email hướng dẫn đổi mật khẩu đến ${email}.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi email',
          onPress: async () => {
            const result = await resetPassword(email);
            if (result.error) {
              Alert.alert('Lỗi', result.error);
            } else {
              Alert.alert('Thành công', 'Đã gửi email đổi mật khẩu. Vui lòng kiểm tra hộp thư.');
            }
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Xóa tài khoản',
      'Bạn có chắc chắn muốn xóa tài khoản? Tất cả dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận xóa',
          style: 'destructive',
          onPress: () => {
            // Double confirm for safety
            Alert.alert(
              'Xác nhận lần cuối',
              'Hành động này KHÔNG THỂ hoàn tác. Bạn chắc chắn muốn xóa tài khoản?',
              [
                { text: 'Giữ tài khoản', style: 'cancel' },
                {
                  text: 'Xóa vĩnh viễn',
                  style: 'destructive',
                  onPress: async () => {
                    const result = await deleteAccount();
                    if (result.error) {
                      Alert.alert('Lỗi', result.error);
                    } else {
                      Alert.alert('Hoàn tất', 'Tài khoản của bạn đã được xóa.');
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <AuthGuard>
      <Stack.Screen options={{ headerShown: true, title: 'Cài đặt', headerBackTitle: 'Quay lại' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <View style={styles.sectionCard}>
            <Pressable style={styles.menuItem} onPress={handleEditProfile}>
              <Text style={styles.menuIcon}>👤</Text>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>Chỉnh sửa hồ sơ</Text>
                <Text style={styles.menuDesc}>{user?.name || 'Người dùng'}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            <Pressable style={styles.menuItem} onPress={handleChangePassword}>
              <Text style={styles.menuIcon}>🔑</Text>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>Đổi mật khẩu</Text>
                <Text style={styles.menuDesc}>{user?.email || ''}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            <View style={styles.menuItem}>
              <Text style={styles.menuIcon}>📧</Text>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>Thông báo email</Text>
                <Text style={styles.menuDesc}>Nhận email về đơn hẹn và kết nối</Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={handleToggleEmailNotifications}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={emailNotifications ? Colors.primary : Colors.textTertiary}
              />
            </View>
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ứng dụng</Text>
          <View style={styles.sectionCard}>
            <View style={styles.menuItem}>
              <Text style={styles.menuIcon}>🌐</Text>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>Ngôn ngữ</Text>
                <Text style={styles.menuDesc}>Tiếng Việt</Text>
              </View>
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedText}>Đang chọn</Text>
              </View>
            </View>

            <View style={styles.menuItem}>
              <Text style={styles.menuIcon}>🌙</Text>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>Chế độ tối</Text>
                <Text style={styles.menuDesc}>Sắp ra mắt</Text>
              </View>
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedText}>Sắp có</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.error }]}>Vùng nguy hiểm</Text>
          <View style={[styles.sectionCard, { borderColor: Colors.error + '30', borderWidth: 1 }]}>
            <Pressable style={styles.menuItem} onPress={handleDeleteAccount}>
              <Text style={styles.menuIcon}>⚠️</Text>
              <View style={styles.menuInfo}>
                <Text style={[styles.menuLabel, { color: Colors.error }]}>Xóa tài khoản</Text>
                <Text style={styles.menuDesc}>Xóa vĩnh viễn tài khoản và dữ liệu</Text>
              </View>
              <Text style={[styles.menuArrow, { color: Colors.error }]}>›</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.version}>DineDate v{APP_VERSION}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  content: { gap: Spacing.lg, paddingBottom: Spacing.xxxl },
  section: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.lg,
    marginLeft: Spacing.xs,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.md,
  },
  menuIcon: { fontSize: 20 },
  menuInfo: { flex: 1, gap: 2 },
  menuLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  menuDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  menuArrow: {
    fontSize: FontSize.xxl,
    color: Colors.textTertiary,
  },
  selectedBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  selectedText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
  },
});
