import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { CUISINE_LABELS, Restaurant, Combo } from '@/constants/types';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [restRes, comboRes] = await Promise.all([
          supabase.from('restaurants').select('*').eq('id', id).single(),
          supabase.from('combos').select('*').eq('restaurant_id', id).eq('is_available', true),
        ]);
        if (restRes.error || !restRes.data) {
          console.warn('[RestaurantDetail] Lỗi tải nhà hàng:', restRes.error?.message);
          setRestaurant(null);
        } else {
          const r = restRes.data;
          setRestaurant({
            id: r.id, name: r.name, description: r.description || '',
            address: r.address || '', area: r.area || '', city: r.city || '',
            cuisineTypes: r.cuisine_types || [], commissionRate: r.commission_rate || 0.15,
            status: r.status, averageRating: r.average_rating, reviewCount: r.review_count,
            openingHours: r.opening_hours, logoUrl: r.logo_url, coverImageUrl: r.cover_image_url,
            createdAt: r.created_at,
          });
        }
        if (comboRes.error || !comboRes.data) {
          console.warn('[RestaurantDetail] Lỗi tải combo:', comboRes.error?.message);
          setCombos([]);
        } else {
          setCombos(comboRes.data.map((c: any) => ({
            id: c.id, restaurantId: c.restaurant_id, name: c.name,
            description: c.description || '', items: c.items || [],
            price: c.price, imageUrl: c.image_url, isAvailable: c.is_available,
            createdAt: c.created_at,
          })));
        }
      } catch (err) {
        console.warn('[RestaurantDetail] Lỗi:', err);
        setRestaurant(null);
        setCombos([]);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.empty}>
        <Text>Không tìm thấy nhà hàng</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: restaurant.name }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Cover */}
        <Image source={{ uri: restaurant.coverImageUrl }} style={styles.cover} contentFit="cover" />

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.rating}>★ {restaurant.averageRating?.toFixed(1)}</Text>
            <Text style={styles.reviews}>({restaurant.reviewCount} đánh giá)</Text>
            <Text style={styles.area}>{restaurant.area}, {restaurant.city}</Text>
          </View>
          <Text style={styles.cuisines}>
            {restaurant.cuisineTypes.map(c => CUISINE_LABELS[c]).join(' - ')}
          </Text>
          <Text style={styles.description}>{restaurant.description}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText} selectable>{restaurant.address}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🕐</Text>
            <Text style={styles.detailText}>{restaurant.openingHours || 'Không rõ'}</Text>
          </View>
        </View>

        {/* Combos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Combo cho 2 người</Text>
          {combos.map((combo) => (
            <View key={combo.id} style={styles.comboCard}>
              <Image source={{ uri: combo.imageUrl }} style={styles.comboImage} contentFit="cover" />
              <View style={styles.comboInfo}>
                <Text style={styles.comboName}>{combo.name}</Text>
                <Text style={styles.comboPrice}>{formatPrice(combo.price)}</Text>
                <Text style={styles.comboItems} numberOfLines={2}>
                  {combo.items.join(' - ')}
                </Text>
              </View>
            </View>
          ))}
          {combos.length === 0 && (
            <Text style={styles.emptyCombo}>Chưa có combo cho nhà hàng này</Text>
          )}
        </View>

        {/* CTA */}
        <Pressable
          style={styles.ctaBtn}
          onPress={() => router.push({ pathname: '/(tabs)/create', params: { restaurantId: id } })}
        >
          <Text style={styles.ctaBtnText}>Tạo đơn hẹn tại đây</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  content: { gap: 0 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cover: { width: '100%', height: 220 },
  section: {
    backgroundColor: Colors.card, padding: Spacing.lg, marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  name: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rating: { fontSize: FontSize.md, color: Colors.warning, fontWeight: '600' },
  reviews: { fontSize: FontSize.sm, color: Colors.textTertiary },
  area: { fontSize: FontSize.sm, color: Colors.textSecondary, marginLeft: 'auto' },
  cuisines: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '500' },
  description: { fontSize: FontSize.md, color: Colors.text, lineHeight: 22 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailIcon: { fontSize: 16 },
  detailText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  comboCard: {
    flexDirection: 'row', backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg, overflow: 'hidden',
  },
  comboImage: { width: 100, height: 80 },
  comboInfo: { flex: 1, padding: Spacing.md, gap: 2 },
  comboName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  comboPrice: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  comboItems: { fontSize: FontSize.xs, color: Colors.textTertiary },
  emptyCombo: { fontSize: FontSize.md, color: Colors.textTertiary, textAlign: 'center', padding: Spacing.xxl },
  ctaBtn: {
    backgroundColor: Colors.primary, marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg, alignItems: 'center',
  },
  ctaBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
});
