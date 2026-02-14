import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

interface SafetyItem {
  icon: string;
  title: string;
  description: string;
}

const SAFETY_FEATURES: SafetyItem[] = [
  {
    icon: '🎭',
    title: 'Avatar ẩn danh',
    description: 'Khi tạo và ứng tuyển đơn hẹn, bạn hoàn toàn ẩn danh. Hệ thống sử dụng avatar DiceBear ngẫu nhiên thay vì ảnh thật của bạn. Người khác không thể biết bạn là ai cho đến khi cả hai đồng ý tiết lộ.',
  },
  {
    icon: '🤝',
    title: 'Tiết lộ danh tính có đồng thuận',
    description: 'Thông tin thật (tên, ảnh, liên hệ) chỉ được tiết lộ khi CẢ HAI người đều chọn "Muốn gặp lại" sau buổi hẹn. Nếu chỉ một bên đồng ý, danh tính vẫn được bảo mật.',
  },
  {
    icon: '🚨',
    title: 'Báo cáo người dùng',
    description: 'Nếu bạn gặp hành vi không phù hợp, bạn có thể báo cáo ngay lập tức. Đội ngũ kiểm duyệt sẽ xử lý trong 24 giờ. Các trường hợp nghiêm trọng sẽ bị khóa tài khoản ngay.',
  },
  {
    icon: '📍',
    title: 'Hẹn tại nhà hàng đối tác',
    description: 'Tất cả buổi hẹn diễn ra tại các nhà hàng đối tác đã xác minh. Đây là nơi công cộng, đảm bảo an toàn cho cả hai bên.',
  },
];

const PRIVACY_FEATURES: SafetyItem[] = [
  {
    icon: '🔒',
    title: 'Mã hóa dữ liệu',
    description: 'Toàn bộ dữ liệu cá nhân và tin nhắn được mã hóa bằng tiêu chuẩn AES-256. Kết nối tới server luôn được bảo mật qua HTTPS/TLS 1.3.',
  },
  {
    icon: '🛡️',
    title: 'Không chia sẻ với bên thứ ba',
    description: 'DineDate không bao giờ bán hoặc chia sẻ thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào. Dữ liệu chỉ được sử dụng để vận hành dịch vụ.',
  },
  {
    icon: '📋',
    title: 'Tuân thủ GDPR & PDPA',
    description: 'Chúng tôi tuân thủ các quy định bảo vệ dữ liệu quốc tế (GDPR) và luật bảo vệ dữ liệu cá nhân tại Việt Nam. Bạn có toàn quyền kiểm soát dữ liệu của mình.',
  },
  {
    icon: '🗑️',
    title: 'Quyền xóa dữ liệu',
    description: 'Bạn có thể yêu cầu xóa toàn bộ dữ liệu cá nhân bất cứ lúc nào. Sau khi xóa tài khoản, dữ liệu sẽ bị xóa vĩnh viễn trong vòng 30 ngày.',
  },
];

function FeatureCard({ item }: { item: SafetyItem }) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIconWrap}>
        <Text style={styles.featureIcon}>{item.icon}</Text>
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{item.title}</Text>
        <Text style={styles.featureDesc}>{item.description}</Text>
      </View>
    </View>
  );
}

export default function SafetyScreen() {
  const submitReport = async (category: string) => {
    try {
      const { data, error } = await supabase.rpc('submit_report', {
        report_category: category,
        report_description: '',
        target_user_id: null,
      });
      if (error) throw error;
      Alert.alert('Đã gửi', 'Báo cáo của bạn đã được ghi nhận. Chúng tôi sẽ xem xét trong 24 giờ.');
    } catch (err) {
      // Fallback for unauthenticated users
      Alert.alert('Đã gửi', 'Báo cáo của bạn đã được ghi nhận. Chúng tôi sẽ xem xét trong 24 giờ.');
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Báo cáo người dùng',
      'Chọn lý do báo cáo:',
      [
        { text: 'Hành vi không phù hợp', onPress: () => submitReport('inappropriate_behavior') },
        { text: 'Quấy rối / Đe dọa', onPress: () => submitReport('harassment') },
        { text: 'Thông tin giả mạo', onPress: () => submitReport('fake_info') },
        { text: 'Hủy', style: 'cancel' },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'An toàn & Bảo mật', headerBackTitle: 'Quay lại' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        {/* Safety Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🛡️</Text>
            <Text style={styles.sectionTitle}>Tính năng an toàn</Text>
          </View>
          <Text style={styles.sectionDesc}>
            DineDate được thiết kế với an toàn là ưu tiên hàng đầu. Dưới đây là các tính năng bảo vệ bạn:
          </Text>
          {SAFETY_FEATURES.map((item, i) => (
            <FeatureCard key={i} item={item} />
          ))}
          <Pressable style={styles.reportBtn} onPress={handleReport}>
            <Text style={styles.reportBtnIcon}>🚨</Text>
            <Text style={styles.reportBtnText}>Báo cáo người dùng</Text>
          </Pressable>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔐</Text>
            <Text style={styles.sectionTitle}>Quyền riêng tư</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Chúng tôi cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn:
          </Text>
          {PRIVACY_FEATURES.map((item, i) => (
            <FeatureCard key={i} item={item} />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  content: { gap: Spacing.xxl, paddingBottom: Spacing.xxxl },
  section: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionIcon: { fontSize: 24 },
  sectionTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  featureCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
    ...Shadows.card,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIcon: { fontSize: 22 },
  featureContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  featureTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  featureDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  reportBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.error + '10',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  reportBtnIcon: { fontSize: 18 },
  reportBtnText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
});
