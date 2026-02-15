import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors, Spacing, FontSize, BorderRadius, PLATFORM_FEE_PER_PERSON } from '@/constants/theme';
import { hapticSuccess, hapticError, hapticSelection } from '@/lib/haptics';
import { useRestaurants } from '@/hooks/use-restaurants';
import { useCombos } from '@/hooks/use-restaurants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useLocalSearchParams } from 'expo-router';
import { Restaurant, Combo, PaymentSplit } from '@/constants/types';
import { formatPrice } from '@/lib/format';

type Step = 'restaurant' | 'combo' | 'datetime' | 'details' | 'payment' | 'review';
type PreferredGender = 'male' | 'female' | 'other' | null;

const STEPS: Step[] = ['restaurant', 'combo', 'datetime', 'details', 'payment', 'review'];
const STEP_TITLES: Record<Step, string> = {
  restaurant: 'Chọn nhà hàng',
  combo: 'Chọn combo',
  datetime: 'Chọn ngày giờ',
  details: 'Mô tả & ưu tiên',
  payment: 'Thanh toán',
  review: 'Xác nhận',
};

const GENDER_OPTIONS: { value: PreferredGender; label: string }[] = [
  { value: null, label: 'Không giới hạn' },
  { value: 'female', label: 'Nữ' },
  { value: 'male', label: 'Nam' },
  { value: 'other', label: 'Khác' },
];

export default function CreateDateScreen() {
  const { user } = useAuth();
  const { restaurants } = useRestaurants();
  const params = useLocalSearchParams<{ restaurantId?: string }>();

  const [step, setStep] = useState<Step>('restaurant');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [description, setDescription] = useState('');
  const [paymentSplit, setPaymentSplit] = useState<PaymentSplit>('split');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(19, 0, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [preferredGender, setPreferredGender] = useState<PreferredGender>(null);
  const [submitting, setSubmitting] = useState(false);

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  // Pre-select restaurant from URL params
  useEffect(() => {
    if (params.restaurantId && restaurants.length > 0) {
      const r = restaurants.find(rest => rest.id === params.restaurantId);
      if (r) {
        setSelectedRestaurant(r);
        setSelectedCombo(null);
      }
    }
  }, [params.restaurantId, restaurants]);

  const { combos } = useCombos(selectedRestaurant?.id);

  const stepIndex = STEPS.indexOf(step);
  const canNext = () => {
    switch (step) {
      case 'restaurant': return !!selectedRestaurant;
      case 'combo': return !!selectedCombo;
      case 'datetime': return selectedDate.getTime() > Date.now();
      case 'details': return description.length > 10;
      case 'payment': return true;
      default: return true;
    }
  };

  const next = async () => {
    if (stepIndex < STEPS.length - 1) {
      setStep(STEPS[stepIndex + 1]);
    } else {
      // Submit to Supabase
      setSubmitting(true);
      try {
        // Calculate required fields
        const comboPrice = selectedCombo?.price || 0;
        const commissionRate = selectedRestaurant?.commissionRate || 0.15;
        const restaurantCommission = Math.round(comboPrice * commissionRate);

        // Calculate creator total
        const calcCreatorTotal = selectedCombo
          ? PLATFORM_FEE_PER_PERSON + (paymentSplit === 'applicant_pays' ? 0 : paymentSplit === 'split' ? Math.round(comboPrice / 2) : comboPrice)
          : PLATFORM_FEE_PER_PERSON;

        const applicantTotal = selectedCombo
          ? PLATFORM_FEE_PER_PERSON + (paymentSplit === 'creator_pays' ? 0 : paymentSplit === 'split' ? Math.round(comboPrice / 2) : comboPrice)
          : PLATFORM_FEE_PER_PERSON;

        // expires_at = 1 hour before date_time
        const expiresAt = new Date(selectedDate.getTime() - 60 * 60 * 1000).toISOString();

        const { error } = await supabase.from('date_orders').insert({
          creator_id: user?.id,
          restaurant_id: selectedRestaurant?.id,
          combo_id: selectedCombo?.id,
          date_time: selectedDate.toISOString(),
          description,
          preferred_gender: preferredGender,
          payment_split: paymentSplit,
          combo_price: comboPrice,
          platform_fee: PLATFORM_FEE_PER_PERSON,
          creator_total: calcCreatorTotal,
          applicant_total: applicantTotal,
          restaurant_commission: restaurantCommission,
          expires_at: expiresAt,
          status: 'active',
        });
        if (error) throw error;
        hapticSuccess();
        Alert.alert('Thành công!', 'Đơn hẹn đã được tạo thành công!');
      } catch (err) {
        hapticError();
        const msg = err instanceof Error ? err.message : 'Không thể tạo đơn hẹn';
        Alert.alert('Lỗi', msg + '. Vui lòng thử lại.');
        return;
      } finally {
        setSubmitting(false);
      }
      // Reset
      setStep('restaurant');
      setSelectedRestaurant(null);
      setSelectedCombo(null);
      setDescription('');
      setPaymentSplit('split');
      setPreferredGender(null);
    }
  };

  const back = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
  };

  const creatorTotal = selectedCombo
    ? PLATFORM_FEE_PER_PERSON + (paymentSplit === 'applicant_pays' ? 0 : paymentSplit === 'split' ? Math.round(selectedCombo.price / 2) : selectedCombo.price)
    : PLATFORM_FEE_PER_PERSON;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Progress */}
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              i <= stepIndex && { backgroundColor: Colors.primary },
            ]}
          />
        ))}
      </View>
      <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>

      {/* Step: Restaurant */}
      {step === 'restaurant' && (
        <View style={styles.stepBody}>
          {restaurants.map((r) => (
            <Pressable
              key={r.id}
              style={[
                styles.selectCard,
                selectedRestaurant?.id === r.id && styles.selectedCard,
              ]}
              onPress={() => {
                setSelectedRestaurant(r);
                setSelectedCombo(null);
              }}
            >
              <Image source={{ uri: r.coverImageUrl }} style={styles.selectImage} contentFit="cover" />
              <View style={styles.selectInfo}>
                <Text style={styles.selectName}>{r.name}</Text>
                <Text style={styles.selectSub}>{r.area} - ★ {r.averageRating?.toFixed(1)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Step: Combo */}
      {step === 'combo' && (
        <View style={styles.stepBody}>
          {combos.length === 0 ? (
            <Text style={styles.emptyText}>Không có combo cho nhà hàng này</Text>
          ) : (
            combos.map((c) => (
              <Pressable
                key={c.id}
                style={[
                  styles.selectCard,
                  selectedCombo?.id === c.id && styles.selectedCard,
                ]}
                onPress={() => setSelectedCombo(c)}
              >
                <Image source={{ uri: c.imageUrl }} style={styles.selectImage} contentFit="cover" />
                <View style={styles.selectInfo}>
                  <Text style={styles.selectName}>{c.name}</Text>
                  <Text style={styles.selectSub}>{formatPrice(c.price)}</Text>
                  <Text style={styles.selectDesc} numberOfLines={2}>{c.items.join(', ')}</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      )}

      {/* Step: DateTime */}
      {step === 'datetime' && (
        <View style={styles.stepBody}>
          <Text style={styles.label}>Chọn ngày và giờ hẹn</Text>

          {/* Date selector */}
          <Pressable style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.datePickerIcon}>📅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.datePickerLabel}>Ngày</Text>
              <Text style={styles.datePickerValue}>
                {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <Text style={styles.datePickerArrow}>›</Text>
          </Pressable>

          {/* Time selector */}
          <Pressable style={styles.datePickerBtn} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.datePickerIcon}>⏰</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.datePickerLabel}>Giờ</Text>
              <Text style={styles.datePickerValue}>
                {selectedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Text style={styles.datePickerArrow}>›</Text>
          </Pressable>

          {(showDatePicker || Platform.OS === 'web') && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              maximumDate={maxDate}
              onChange={(event: DateTimePickerEvent, date?: Date) => {
                setShowDatePicker(false);
                if (date) {
                  const newDate = new Date(selectedDate);
                  newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                  setSelectedDate(newDate);
                }
              }}
            />
          )}
          {(showTimePicker || Platform.OS === 'web') && (
            <DateTimePicker
              value={selectedDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minuteInterval={15}
              onChange={(event: DateTimePickerEvent, date?: Date) => {
                setShowTimePicker(false);
                if (date) {
                  const newDate = new Date(selectedDate);
                  newDate.setHours(date.getHours(), date.getMinutes());
                  setSelectedDate(newDate);
                }
              }}
            />
          )}

          {selectedDate.getTime() <= Date.now() && (
            <Text style={styles.dateWarning}>Vui lòng chọn thời gian trong tương lai</Text>
          )}
        </View>
      )}

      {/* Step: Details (description + preferred gender) */}
      {step === 'details' && (
        <View style={styles.stepBody}>
          <Text style={styles.label}>Mô tả buổi hẹn của bạn</Text>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="VD: Tìm bạn ăn tối nay, thích người vui tính và hài hước..."
            placeholderTextColor={Colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            maxLength={300}
          />
          <Text style={styles.charCount}>{description.length}/300</Text>

          <Text style={[styles.label, { marginTop: Spacing.lg }]}>Giới tính ưu tiên</Text>
          {GENDER_OPTIONS.map((opt) => (
            <Pressable
              key={String(opt.value)}
              style={[
                styles.radioRow,
                preferredGender === opt.value && styles.radioSelected,
              ]}
              onPress={() => setPreferredGender(opt.value)}
            >
              <View style={[styles.radioCircle, preferredGender === opt.value && styles.radioCircleSelected]} />
              <Text style={styles.radioLabel}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Step: Payment */}
      {step === 'payment' && (
        <View style={styles.stepBody}>
          <Text style={styles.label}>Phương thức chia tiền</Text>
          {(['split', 'creator_pays', 'applicant_pays'] as PaymentSplit[]).map((split) => (
            <Pressable
              key={split}
              style={[
                styles.radioRow,
                paymentSplit === split && styles.radioSelected,
              ]}
              onPress={() => setPaymentSplit(split)}
            >
              <View style={[styles.radioCircle, paymentSplit === split && styles.radioCircleSelected]} />
              <Text style={styles.radioLabel}>
                {split === 'split' ? 'Chia đôi' : split === 'creator_pays' ? 'Mình trả hết' : 'Đối phương trả hết'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <View style={styles.stepBody}>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Nhà hàng</Text>
            <Text style={styles.reviewValue}>{selectedRestaurant?.name}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Combo</Text>
            <Text style={styles.reviewValue}>{selectedCombo?.name}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Ngày giờ</Text>
            <Text style={styles.reviewValue}>
              {selectedDate.toLocaleDateString('vi-VN')} - {selectedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Giới tính ưu tiên</Text>
            <Text style={styles.reviewValue}>
              {GENDER_OPTIONS.find(g => g.value === preferredGender)?.label || 'Không giới hạn'}
            </Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Giá combo</Text>
            <Text style={styles.reviewValue}>{formatPrice(selectedCombo?.price || 0)}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Phí nền tảng</Text>
            <Text style={styles.reviewValue}>{formatPrice(PLATFORM_FEE_PER_PERSON)}</Text>
          </View>
          <View style={[styles.reviewRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md }]}>
            <Text style={[styles.reviewLabel, { fontWeight: '700' }]}>Bạn trả</Text>
            <Text style={[styles.reviewValue, { color: Colors.primary, fontWeight: '700' }]}>
              {formatPrice(creatorTotal)}
            </Text>
          </View>
        </View>
      )}

      {/* Navigation */}
      <View style={styles.navRow}>
        {stepIndex > 0 && (
          <Pressable style={styles.backBtn} onPress={back}>
            <Text style={styles.backBtnText}>Quay lại</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.nextBtn, (!canNext() || submitting) && styles.nextBtnDisabled]}
          onPress={canNext() && !submitting ? next : undefined}
          disabled={submitting}
        >
          <Text style={styles.nextBtnText}>
            {submitting ? 'Đang tạo...' : step === 'review' ? 'Tạo Đơn Hẹn' : 'Tiếp theo'}
          </Text>
        </Pressable>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  progress: {
    flexDirection: 'row', gap: Spacing.xs, justifyContent: 'center', marginTop: Spacing.sm,
  },
  progressDot: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight,
  },
  stepTitle: {
    fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, textAlign: 'center',
  },
  stepBody: { gap: Spacing.md },
  selectCard: {
    flexDirection: 'row', backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    overflow: 'hidden', borderWidth: 2, borderColor: Colors.transparent,
  },
  selectedCard: {
    borderColor: Colors.primary,
  },
  selectImage: { width: 100, height: 80 },
  selectInfo: { flex: 1, padding: Spacing.md, gap: 2 },
  selectName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  selectSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  selectDesc: { fontSize: FontSize.xs, color: Colors.textTertiary },
  emptyText: { fontSize: FontSize.md, color: Colors.textTertiary, textAlign: 'center', padding: Spacing.xxl },
  label: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  datePickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.backgroundSecondary, padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  datePickerIcon: { fontSize: 24 },
  datePickerLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
  datePickerValue: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  datePickerArrow: { fontSize: FontSize.xxl, color: Colors.textTertiary },
  dateWarning: { fontSize: FontSize.sm, color: Colors.error, textAlign: 'center' },
  textArea: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, fontSize: FontSize.md, color: Colors.text,
    minHeight: 120, textAlignVertical: 'top',
  },
  charCount: { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'right' },
  radioRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg, backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: Colors.transparent,
  },
  radioSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border,
  },
  radioCircleSelected: {
    borderColor: Colors.primary, backgroundColor: Colors.primary,
  },
  radioLabel: { fontSize: FontSize.md, color: Colors.text, fontWeight: '500' },
  reviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm,
  },
  reviewLabel: { fontSize: FontSize.md, color: Colors.textSecondary },
  reviewValue: { fontSize: FontSize.md, color: Colors.text, fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: Spacing.lg },
  navRow: {
    flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg,
  },
  backBtn: {
    flex: 1, paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSecondary, alignItems: 'center',
  },
  backBtnText: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textSecondary },
  nextBtn: {
    flex: 2, paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
});
