import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useSubmitReview } from '@/hooks/use-reviews';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { hapticSuccess, hapticError, hapticSelection } from '@/lib/haptics';
import AuthGuard from '@/components/auth-guard';
import { supabase } from '@/lib/supabase';

function StarRating({ rating, onRate, label }: { rating: number; onRate: (n: number) => void; label?: string }) {
  return (
    <View style={styles.ratingRow}>
      {label && <Text style={styles.ratingLabel}>{label}</Text>}
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => { hapticSelection(); onRate(star); }} style={styles.starBtn}>
            <Text style={[styles.starText, star <= rating && styles.starActive]}>
              {star <= rating ? '★' : '☆'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { submitPersonReview, submitRestaurantReview, loading } = useSubmitReview();

  // Person review
  const [personRating, setPersonRating] = useState(0);
  const [personComment, setPersonComment] = useState('');
  const [wantToMeetAgain, setWantToMeetAgain] = useState(false);

  // Restaurant review — 4 separate ratings
  const [foodRating, setFoodRating] = useState(0);
  const [ambianceRating, setAmbianceRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [restaurantComment, setRestaurantComment] = useState('');

  // Fetch date order to get actual target user and restaurant IDs
  const [order, setOrder] = useState<{ matchedUserId?: string; creatorId?: string; restaurantId?: string } | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('date_orders')
          .select('matched_user_id, creator_id, restaurant_id')
          .eq('id', id)
          .single();
        if (!error && data) {
          setOrder({
            matchedUserId: data.matched_user_id,
            creatorId: data.creator_id,
            restaurantId: data.restaurant_id,
          });
        }
      } catch {
        // order stays null
      }
    }
    fetchOrder();
  }, [id]);

  const handleSubmit = async () => {
    if (personRating === 0) {
      Alert.alert('Lỗi', 'Vui lòng đánh giá người hẹn (ít nhất 1 sao).');
      return;
    }
    if (foodRating === 0 || ambianceRating === 0 || serviceRating === 0 || overallRating === 0) {
      Alert.alert('Lỗi', 'Vui lòng đánh giá đầy đủ 4 mục cho nhà hàng (ít nhất 1 sao mỗi mục).');
      return;
    }

    try {
      // Determine target user: if I'm the creator, target is matched user, and vice versa
      const targetUserId = user?.id === order?.creatorId
        ? (order?.matchedUserId || '')
        : (order?.creatorId || '');
      const restaurantId = order?.restaurantId || '';

      const [personOk, restaurantOk] = await Promise.all([
        submitPersonReview(id || '', targetUserId, personRating, personComment, wantToMeetAgain),
        submitRestaurantReview(id || '', restaurantId, foodRating, ambianceRating, serviceRating, overallRating, restaurantComment),
      ]);

      if (!personOk || !restaurantOk) {
        throw new Error('Gửi đánh giá thất bại');
      }

      hapticSuccess();
      Alert.alert(
        'Thành công',
        wantToMeetAgain
          ? 'Đánh giá đã được gửi! Nếu cả hai đều muốn gặp lại, thông tin thật sẽ được tiết lộ.'
          : 'Đánh giá đã được gửi! Cảm ơn bạn đã chia sẻ.',
        [{ text: 'Đóng', onPress: () => router.back() }],
      );
    } catch {
      hapticError();
      Alert.alert('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại.');
    }
  };

  return (
    <AuthGuard>
      <Stack.Screen options={{ headerShown: true, title: 'Đánh giá sau hẹn', headerBackTitle: 'Quay lại' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Đánh giá của bạn giúp cộng đồng DineDate tốt hơn. Nếu cả hai đều chọn "Muốn gặp lại", thông tin thật sẽ được tiết lộ!
          </Text>
        </View>

        {/* Person Review Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👤</Text>
            <Text style={styles.sectionTitle}>Đánh giá người hẹn</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Điểm đánh giá *</Text>
            <StarRating rating={personRating} onRate={setPersonRating} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nhận xét</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Chia sẻ cảm nhận của bạn về buổi hẹn..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={personComment}
              onChangeText={setPersonComment}
            />
          </View>

          <View style={styles.meetAgainRow}>
            <View style={styles.meetAgainInfo}>
              <Text style={styles.meetAgainLabel}>Muốn gặp lại?</Text>
              <Text style={styles.meetAgainDesc}>
                Nếu cả hai chọn "Có", thông tin thật sẽ được tiết lộ cho nhau.
              </Text>
            </View>
            <Switch
              value={wantToMeetAgain}
              onValueChange={setWantToMeetAgain}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={wantToMeetAgain ? Colors.primary : Colors.textTertiary}
            />
          </View>

          {wantToMeetAgain && (
            <View style={styles.meetAgainAlert}>
              <Text style={styles.meetAgainAlertText}>
                Bạn đã chọn muốn gặp lại! Nếu người kia cũng đồng ý, tên thật và ảnh sẽ được tiết lộ cho cả hai.
              </Text>
            </View>
          )}
        </View>

        {/* Restaurant Review Section — 4 ratings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🍽️</Text>
            <Text style={styles.sectionTitle}>Đánh giá nhà hàng</Text>
          </View>

          <StarRating rating={foodRating} onRate={setFoodRating} label="Đồ ăn *" />
          <StarRating rating={ambianceRating} onRate={setAmbianceRating} label="Không gian *" />
          <StarRating rating={serviceRating} onRate={setServiceRating} label="Phục vụ *" />
          <StarRating rating={overallRating} onRate={setOverallRating} label="Tổng thể *" />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nhận xét</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Chia sẻ trải nghiệm tại nhà hàng..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={restaurantComment}
              onChangeText={setRestaurantComment}
            />
          </View>
        </View>

        {/* Submit */}
        <View style={styles.submitSection}>
          <Pressable
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Gửi đánh giá</Text>
            )}
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  content: { gap: Spacing.lg, paddingBottom: Spacing.xxxl },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.accent,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 18 },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  section: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionIcon: { fontSize: 22 },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  fieldGroup: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  ratingRow: {
    gap: Spacing.xs,
  },
  ratingLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  starRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  starBtn: {
    padding: Spacing.xs,
  },
  starText: {
    fontSize: 32,
    color: Colors.border,
  },
  starActive: {
    color: Colors.warning,
  },
  textInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  meetAgainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  meetAgainInfo: {
    flex: 1,
    gap: 3,
  },
  meetAgainLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  meetAgainDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  meetAgainAlert: {
    backgroundColor: Colors.primary + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  meetAgainAlertText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    lineHeight: 20,
    fontWeight: '500',
  },
  submitSection: {
    paddingHorizontal: Spacing.lg,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.lg,
  },
});
