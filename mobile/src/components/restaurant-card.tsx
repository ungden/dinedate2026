import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Restaurant, CUISINE_ICONS, CUISINE_LABELS } from '@/constants/types';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(Math.round(width * 0.55), 260);
  const icon = restaurant.cuisineTypes?.[0]
    ? CUISINE_ICONS[restaurant.cuisineTypes[0]] || '🍽️'
    : '🍽️';

  return (
    <Pressable
      style={[styles.card, { width: cardWidth }]}
      onPress={() => router.push(`/restaurants/${restaurant.id}`)}
      accessibilityLabel={`Nhà hàng ${restaurant.name}`}
      accessibilityRole="button"
    >
      <Image
        source={{ uri: restaurant.coverImageUrl || restaurant.logoUrl }}
        style={styles.image}
        contentFit="cover"
        accessibilityLabel={`Ảnh nhà hàng ${restaurant.name}`}
      />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
        <View style={styles.row}>
          <Text style={styles.cuisine}>{icon} {restaurant.cuisineTypes?.map(c => CUISINE_LABELS[c] || c).join(', ')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rating}>★ {restaurant.averageRating?.toFixed(1) || '0'}</Text>
          <Text style={styles.reviews}>({restaurant.reviewCount || 0})</Text>
          <Text style={styles.area}>{restaurant.area}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginRight: Spacing.md,
    ...Shadows.card,
  },
  image: {
    width: '100%',
    height: 120,
  },
  body: {
    padding: Spacing.md,
    gap: 4,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cuisine: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  rating: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: '600',
  },
  reviews: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  area: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginLeft: 'auto',
  },
});
