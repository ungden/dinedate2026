import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { HomeComboDeal } from '@/hooks/use-home-stats';
import { BorderRadius, Colors, FontSize, Shadows, Spacing } from '@/constants/theme';
import { CUISINE_ICONS, CUISINE_LABELS } from '@/constants/types';
import { formatPriceShort } from '@/lib/format';

export default function ComboDealCard({ deal }: { deal: HomeComboDeal }) {
  const router = useRouter();
  const icon = deal.cuisineType ? CUISINE_ICONS[deal.cuisineType] || '🍽️' : '🍽️';
  const cuisineLabel = deal.cuisineType ? CUISINE_LABELS[deal.cuisineType] || 'Ẩm thực' : 'Ẩm thực';

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/restaurants/${deal.restaurantId}`)}
      accessibilityLabel={`Combo ${deal.name} tại ${deal.restaurantName}`}
      accessibilityRole="button"
    >
      <Image
        source={{ uri: deal.imageUrl }}
        placeholder={require('../../assets/icon.png')}
        style={styles.image}
        contentFit="cover"
      />

      <View style={styles.priceBadge}>
        <Text style={styles.priceText}>{formatPriceShort(deal.price)} VND</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.comboName} numberOfLines={1}>{deal.name}</Text>
        <Text style={styles.restaurantName} numberOfLines={1}>{deal.restaurantName}</Text>
        <Text style={styles.cuisine} numberOfLines={1}>{icon} {cuisineLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.card,
    marginRight: Spacing.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  image: {
    width: '100%',
    height: 110,
  },
  priceBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  priceText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  body: {
    padding: Spacing.md,
    gap: 4,
  },
  comboName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  restaurantName: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  cuisine: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
});
