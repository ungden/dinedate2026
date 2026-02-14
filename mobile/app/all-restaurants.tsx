import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useRestaurants } from '@/hooks/use-restaurants';
import { Restaurant, CUISINE_ICONS, CUISINE_LABELS } from '@/constants/types';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';

function RestaurantListCard({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  const icon = restaurant.cuisineTypes?.[0]
    ? CUISINE_ICONS[restaurant.cuisineTypes[0]] || '🍽️'
    : '🍽️';

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/restaurants/${restaurant.id}`)}
    >
      <Image
        source={{ uri: restaurant.coverImageUrl || restaurant.logoUrl }}
        style={styles.cardImage}
        contentFit="cover"
      />
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{restaurant.description}</Text>
        <View style={styles.cardTags}>
          {restaurant.cuisineTypes?.slice(0, 3).map((c, i) => (
            <View key={i} style={styles.cuisineTag}>
              <Text style={styles.cuisineTagText}>
                {CUISINE_ICONS[c] || '🍽️'} {CUISINE_LABELS[c] || c}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingValue}>{restaurant.averageRating?.toFixed(1) || '0'}</Text>
            <Text style={styles.reviewCount}>({restaurant.reviewCount || 0} đánh giá)</Text>
          </View>
          <Text style={styles.area}>{restaurant.area}, {restaurant.city}</Text>
        </View>
        {restaurant.openingHours && (
          <Text style={styles.hours}>⏰ {restaurant.openingHours}</Text>
        )}
      </View>
    </Pressable>
  );
}

export default function AllRestaurantsScreen() {
  const { restaurants, loading } = useRestaurants();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Tất cả nhà hàng', headerBackTitle: 'Quay lại' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <Text style={styles.subtitle}>
          {restaurants.length} nhà hàng đối tác
        </Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xxxl }} />
        ) : (
          <View style={styles.list}>
            {restaurants.map((restaurant) => (
              <RestaurantListCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  content: { paddingBottom: Spacing.xxxl },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.card,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardBody: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  cardDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  cuisineTag: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  cuisineTagText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingStar: {
    fontSize: FontSize.md,
    color: Colors.warning,
  },
  ratingValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  reviewCount: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  area: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  hours: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
});
