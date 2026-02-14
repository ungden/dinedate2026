import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useMyReviews, PersonReview } from '@/hooks/use-reviews';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import AuthGuard from '@/components/auth-guard';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function renderStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function ReviewCard({ review, type }: { review: PersonReview; type: 'sent' | 'received' }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewMeta}>
          <Text style={styles.reviewStars}>{renderStars(review.rating)}</Text>
          <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
        </View>
        {review.wantToMeetAgain && (
          <View style={styles.meetAgainBadge}>
            <Text style={styles.meetAgainText}>Muốn gặp lại</Text>
          </View>
        )}
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
      <View style={styles.reviewFooter}>
        {review.restaurantName && (
          <Text style={styles.reviewRestaurant}>{review.restaurantName}</Text>
        )}
        {type === 'sent' && review.reviewedName && (
          <Text style={styles.reviewTarget}>Gửi cho: {review.reviewedName}</Text>
        )}
        {type === 'received' && review.reviewerName && (
          <Text style={styles.reviewTarget}>Từ: {review.reviewerName}</Text>
        )}
      </View>
    </View>
  );
}

export default function MyReviewsScreen() {
  const { user } = useAuth();
  const { sentReviews, receivedReviews, loading, reload } = useMyReviews(user?.id);
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const reviews = activeTab === 'sent' ? sentReviews : receivedReviews;

  return (
    <AuthGuard>
      <Stack.Screen options={{ headerShown: true, title: 'Đánh giá của tôi', headerBackTitle: 'Quay lại' }} />
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
            onPress={() => setActiveTab('sent')}
          >
            <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
              Đánh giá đã gửi
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'received' && styles.tabActive]}
            onPress={() => setActiveTab('received')}
          >
            <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
              Đánh giá nhận được
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xxxl }} />
          ) : reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'sent' ? 'Chưa gửi đánh giá nào' : 'Chưa nhận đánh giá nào'}
              </Text>
              <Text style={styles.emptyDesc}>
                {activeTab === 'sent'
                  ? 'Sau mỗi buổi hẹn, bạn có thể đánh giá người hẹn và nhà hàng.'
                  : 'Đánh giá từ người hẹn sẽ hiển thị ở đây sau mỗi buổi hẹn.'}
              </Text>
            </View>
          ) : (
            <View style={styles.reviewList}>
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} type={activeTab} />
              ))}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.transparent,
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  reviewList: {
    gap: Spacing.md,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewMeta: {
    gap: 2,
  },
  reviewStars: {
    fontSize: FontSize.lg,
    color: Colors.warning,
    letterSpacing: 2,
  },
  reviewDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  meetAgainBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  meetAgainText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  reviewComment: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  reviewFooter: {
    gap: 2,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  reviewRestaurant: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  reviewTarget: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
    gap: Spacing.md,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.xl,
  },
});
