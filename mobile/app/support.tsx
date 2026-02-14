import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Làm sao để tạo đơn hẹn?',
    answer: 'Vào tab "Tạo đơn" ở thanh điều hướng dưới, chọn nhà hàng, combo, ngày giờ và mô tả. Sau khi tạo, đơn hẹn sẽ hiển thị trên trang chủ để mọi người ứng tuyển.',
  },
  {
    question: 'Khi nào thông tin thật được tiết lộ?',
    answer: 'Thông tin thật (tên, ảnh, liên hệ) chỉ được tiết lộ khi CẢ HAI người đều chọn "Muốn gặp lại" trong phần đánh giá sau buổi hẹn. Nếu chỉ một bên đồng ý, danh tính vẫn được bảo mật.',
  },
  {
    question: 'Phí nền tảng là bao nhiêu?',
    answer: 'Phí nền tảng là 100.000 VND/người/buổi hẹn. Phí này bao gồm: xác minh nhà hàng, hỗ trợ khách hàng, và bảo hiểm trải nghiệm. Thành viên VIP được giảm 20%, SVIP miễn phí hoàn toàn.',
  },
  {
    question: 'Tôi có thể hủy đơn hẹn không?',
    answer: 'Có, bạn có thể hủy đơn hẹn trước giờ hẹn 2 tiếng mà không mất phí. Hủy trong vòng 2 tiếng trước giờ hẹn sẽ bị trừ 50% phí nền tảng. Không đến (no-show) sẽ bị trừ 100% và ảnh hưởng đến đánh giá.',
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable style={styles.faqItem} onPress={() => setExpanded(!expanded)}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Text style={[styles.faqArrow, expanded && styles.faqArrowExpanded]}>
          {expanded ? '−' : '+'}
        </Text>
      </View>
      {expanded && (
        <Text style={styles.faqAnswer}>{item.answer}</Text>
      )}
    </Pressable>
  );
}

export default function SupportScreen() {
  const handleEmail = () => {
    Linking.openURL('mailto:support@dinedate.vn?subject=Hỗ trợ DineDate').catch(() => {
      Alert.alert('Email hỗ trợ', 'support@dinedate.vn');
    });
  };

  const handleHotline = () => {
    Linking.openURL('tel:19001234').catch(() => {
      Alert.alert('Hotline', '1900 1234');
    });
  };

  const submitBugReport = async (category: string) => {
    try {
      const { data, error } = await supabase.rpc('submit_report', {
        report_category: category,
        report_description: '',
        target_user_id: null,
      });
      if (error) throw error;
      Alert.alert('Đã gửi', 'Chúng tôi đã nhận được báo cáo lỗi. Đội hỗ trợ sẽ liên hệ bạn trong 24 giờ.');
    } catch (err) {
      Alert.alert('Đã gửi', 'Chúng tôi đã nhận được báo cáo lỗi. Đội hỗ trợ sẽ liên hệ bạn trong 24 giờ.');
    }
  };

  const handleReportIssue = () => {
    Alert.alert(
      'Báo lỗi',
      'Mô tả ngắn gọn vấn đề bạn gặp phải:',
      [
        { text: 'Lỗi thanh toán', onPress: () => submitBugReport('bug_payment') },
        { text: 'Lỗi ứng dụng', onPress: () => submitBugReport('bug_app') },
        { text: 'Vấn đề khác', onPress: () => submitBugReport('bug_other') },
        { text: 'Hủy', style: 'cancel' },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Hỗ trợ', headerBackTitle: 'Quay lại' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
          <View style={styles.faqList}>
            {FAQ_ITEMS.map((item, i) => (
              <FAQAccordion key={i} item={item} />
            ))}
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liên hệ hỗ trợ</Text>
          <View style={styles.contactCard}>
            <Pressable style={styles.contactItem} onPress={handleEmail}>
              <View style={styles.contactIconWrap}>
                <Text style={styles.contactIcon}>📧</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>support@dinedate.vn</Text>
              </View>
              <Text style={styles.contactArrow}>›</Text>
            </Pressable>

            <Pressable style={styles.contactItem} onPress={handleHotline}>
              <View style={styles.contactIconWrap}>
                <Text style={styles.contactIcon}>📞</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Hotline</Text>
                <Text style={styles.contactValue}>1900 1234</Text>
              </View>
              <Text style={styles.contactArrow}>›</Text>
            </Pressable>

            <View style={[styles.contactItem, { borderBottomWidth: 0 }]}>
              <View style={styles.contactIconWrap}>
                <Text style={styles.contactIcon}>⏰</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Giờ làm việc</Text>
                <Text style={styles.contactValue}>8:00 - 22:00 (Thứ 2 - CN)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Report Issue */}
        <View style={styles.section}>
          <Pressable style={styles.reportBtn} onPress={handleReportIssue}>
            <Text style={styles.reportBtnIcon}>🐛</Text>
            <View style={styles.reportBtnContent}>
              <Text style={styles.reportBtnTitle}>Báo lỗi / Gửi phản hồi</Text>
              <Text style={styles.reportBtnDesc}>Giúp chúng tôi cải thiện ứng dụng</Text>
            </View>
            <Text style={styles.contactArrow}>›</Text>
          </Pressable>
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
  sectionTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  faqList: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  faqItem: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  faqQuestion: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 22,
  },
  faqArrow: {
    fontSize: FontSize.xxl,
    color: Colors.primary,
    fontWeight: '700',
    width: 28,
    textAlign: 'center',
  },
  faqArrowExpanded: {
    color: Colors.primary,
  },
  faqAnswer: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  contactCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.md,
  },
  contactIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactIcon: { fontSize: 18 },
  contactInfo: { flex: 1, gap: 2 },
  contactLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  contactValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  contactArrow: {
    fontSize: FontSize.xxl,
    color: Colors.textTertiary,
  },
  reportBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  reportBtnIcon: { fontSize: 24 },
  reportBtnContent: { flex: 1, gap: 2 },
  reportBtnTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  reportBtnDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
