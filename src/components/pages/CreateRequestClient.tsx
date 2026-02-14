'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  Users,
  CreditCard,
  CheckCircle,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn, formatCurrency, getCuisineIcon } from '@/lib/utils';
import { calcDateOrderPricing, PLATFORM_FEE_PER_PERSON } from '@/lib/platform';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useCombos } from '@/hooks/useCombos';
import { useCreateDateOrder } from '@/hooks/useDateOrders';
import RestaurantPicker from '@/components/RestaurantPicker';
import ComboSelector from '@/components/ComboSelector';
import PaymentSplitSelector from '@/components/PaymentSplitSelector';
import { Restaurant, Combo, PaymentSplit, Gender } from '@/types';
import toast from 'react-hot-toast';

interface FormValues {
  restaurantId: string;
  comboId: string;
  date: string;
  time: string;
  description: string;
  preferredGender: Gender | 'any';
  paymentSplit: PaymentSplit;
}

const TOTAL_STEPS = 7;

const STEP_LABELS = [
  'Chon nha hang',
  'Chon combo',
  'Ngay & gio',
  'Mo ta',
  'Gioi tinh',
  'Thanh toan',
  'Xac nhan',
];

function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export default function CreateRequestClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRestaurantId = searchParams.get('restaurantId') || '';

  const { user, isAuthenticated } = useAuth();
  const { restaurants, loading: restaurantsLoading } = useRestaurants();
  const { createDateOrder, loading: creating } = useCreateDateOrder();

  const [step, setStep] = useState(1);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      restaurantId: preselectedRestaurantId,
      comboId: '',
      date: getTomorrowDate(),
      time: '19:00',
      description: '',
      preferredGender: 'any',
      paymentSplit: 'split',
    },
  });

  const watchRestaurantId = watch('restaurantId');
  const watchComboId = watch('comboId');
  const watchPaymentSplit = watch('paymentSplit');
  const watchDescription = watch('description');

  const { combos, loading: combosLoading } = useCombos(watchRestaurantId);

  // Pre-select restaurant from URL
  useEffect(() => {
    if (preselectedRestaurantId && restaurants.length > 0 && !selectedRestaurant) {
      const found = restaurants.find((r) => r.id === preselectedRestaurantId);
      if (found) {
        setSelectedRestaurant(found);
        setValue('restaurantId', found.id);
      }
    }
  }, [preselectedRestaurantId, restaurants, selectedRestaurant, setValue]);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated && !user) {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  // Pricing calculation
  const pricing = useMemo(() => {
    if (!selectedCombo) return null;
    const restaurantCommissionRate = selectedRestaurant?.commissionRate ?? 0.15;
    return calcDateOrderPricing({
      comboPrice: selectedCombo.price,
      paymentSplit: watchPaymentSplit,
      restaurantCommissionRate,
      creatorIsVip: user?.vipStatus?.tier !== 'free',
    });
  }, [selectedCombo, selectedRestaurant, watchPaymentSplit, user]);

  // Step navigation
  const canGoNext = useMemo(() => {
    switch (step) {
      case 1:
        return !!watchRestaurantId;
      case 2:
        return !!watchComboId;
      case 3:
        return true; // date/time have defaults
      case 4:
        return true; // description is optional
      case 5:
        return true; // gender preference is optional
      case 6:
        return true; // payment split has default
      case 7:
        return !!pricing;
      default:
        return false;
    }
  }, [step, watchRestaurantId, watchComboId, pricing]);

  function goNext() {
    if (canGoNext && step < TOTAL_STEPS) setStep(step + 1);
  }

  function goBack() {
    if (step > 1) setStep(step - 1);
  }

  const onSubmit = async (data: FormValues) => {
    if (!user || !pricing || !selectedCombo || !selectedRestaurant) return;

    const dateTimeStr = `${data.date}T${data.time}:00`;
    const expiresAt = new Date(dateTimeStr);
    expiresAt.setHours(expiresAt.getHours() - 1); // Expires 1 hour before date

    const result = await createDateOrder({
      creatorId: user.id,
      restaurantId: data.restaurantId,
      comboId: data.comboId,
      dateTime: dateTimeStr,
      description: data.description,
      preferredGender: data.preferredGender === 'any' ? undefined : data.preferredGender,
      paymentSplit: data.paymentSplit,
      comboPrice: selectedCombo.price,
      platformFee: pricing.creatorFee,
      creatorTotal: pricing.creatorTotal,
      applicantTotal: pricing.applicantTotal,
      restaurantCommission: pricing.restaurantCommission,
      expiresAt: expiresAt.toISOString(),
    });

    if (result) {
      toast.success('Tao Date Order thanh cong!');
      router.push(`/request/${result.id}`);
    } else {
      toast.error('Co loi xay ra. Vui long thu lai.');
    }
  };

  // Step progress bar
  const progressPercent = (step / TOTAL_STEPS) * 100;

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => (step > 1 ? goBack() : router.back())}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Tao Date Order</h1>
          <p className="text-sm text-gray-500">
            Buoc {step}/{TOTAL_STEPS} - {STEP_LABELS[step - 1]}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-rose-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {/* Step 1: Pick Restaurant */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Chon nha hang
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Chon nha hang ban muon den cho buoi hen
                </p>
                <RestaurantPicker
                  restaurants={restaurants}
                  selectedId={watchRestaurantId}
                  onSelect={(r) => {
                    setSelectedRestaurant(r);
                    setValue('restaurantId', r.id);
                    // Reset combo when restaurant changes
                    if (r.id !== watchRestaurantId) {
                      setSelectedCombo(null);
                      setValue('comboId', '');
                    }
                  }}
                  loading={restaurantsLoading}
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: Pick Combo */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Chon combo
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {selectedRestaurant
                    ? `${getCuisineIcon(selectedRestaurant.cuisineTypes[0] || '')} ${selectedRestaurant.name}`
                    : 'Chon combo set menu cho 2 nguoi'}
                </p>

                {combosLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    <span className="ml-2 text-sm text-gray-500">Dang tai combo...</span>
                  </div>
                ) : combos.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-500">
                      Nha hang nay chua co combo nao.
                    </p>
                  </div>
                ) : (
                  <ComboSelector
                    combos={combos}
                    selectedId={watchComboId}
                    onSelect={(c) => {
                      setSelectedCombo(c);
                      setValue('comboId', c.id);
                    }}
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Chon ngay & gio
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-primary-500" />
                      <label className="text-sm font-medium text-gray-700">
                        Ngay <span className="text-red-500">*</span>
                      </label>
                    </div>
                    <Controller
                      name="date"
                      control={control}
                      rules={{ required: 'Vui long chon ngay' }}
                      render={({ field }) => (
                        <input
                          type="date"
                          {...field}
                          min={getTomorrowDate()}
                          className={cn(
                            'w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none',
                            errors.date ? 'border-red-300' : 'border-gray-200'
                          )}
                        />
                      )}
                    />
                    {errors.date && (
                      <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-primary-500" />
                      <label className="text-sm font-medium text-gray-700">
                        Gio
                      </label>
                    </div>
                    <Controller
                      name="time"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="time"
                          {...field}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Description */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-primary-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Mo ta</h2>
                </div>
                <Controller
                  name="description"
                  control={control}
                  rules={{ maxLength: { value: 200, message: 'Toi da 200 ky tu' } }}
                  render={({ field }) => (
                    <div>
                      <textarea
                        {...field}
                        rows={4}
                        maxLength={200}
                        placeholder="Mo ta ngan ve buoi hen..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm"
                      />
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-400">
                          {watchDescription.length}/200
                        </p>
                        {errors.description && (
                          <p className="text-red-500 text-xs">{errors.description.message}</p>
                        )}
                      </div>
                    </div>
                  )}
                />
              </div>
            </motion.div>
          )}

          {/* Step 5: Preferred Gender */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary-500" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Gioi tinh mong muon
                  </h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Tuy chon, ban co the de mac dinh neu khong co yeu cau
                </p>
                <Controller
                  name="preferredGender"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { value: 'male', label: 'Nam', icon: '👨' },
                        { value: 'female', label: 'Nu', icon: '👩' },
                        { value: 'any', label: 'Khong quan tam', icon: '🤝' },
                      ] as const).map((opt) => (
                        <motion.button
                          key={opt.value}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => field.onChange(opt.value)}
                          className={cn(
                            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition',
                            field.value === opt.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <span className="text-2xl">{opt.icon}</span>
                          <span className="font-medium text-sm">{opt.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                />
              </div>
            </motion.div>
          )}

          {/* Step 6: Payment Split */}
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-primary-500" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Hinh thuc thanh toan
                  </h2>
                </div>
                <Controller
                  name="paymentSplit"
                  control={control}
                  render={({ field }) => (
                    <PaymentSplitSelector
                      value={field.value}
                      onChange={field.onChange}
                      comboPrice={selectedCombo?.price ?? 0}
                    />
                  )}
                />
              </div>
            </motion.div>
          )}

          {/* Step 7: Review & Confirm */}
          {step === 7 && (
            <motion.div
              key="step7"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Summary Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-primary-500" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Xac nhan Date Order
                  </h2>
                </div>

                {/* Restaurant */}
                {selectedRestaurant && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-xl">
                      {getCuisineIcon(selectedRestaurant.cuisineTypes[0] || '')}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {selectedRestaurant.name}
                      </p>
                      <p className="text-xs text-gray-500">{selectedRestaurant.address}</p>
                    </div>
                  </div>
                )}

                {/* Combo */}
                {selectedCombo && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {selectedCombo.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedCombo.items.slice(0, 3).join(', ')}
                        {selectedCombo.items.length > 3 && '...'}
                      </p>
                    </div>
                    <p className="font-bold text-primary-600 text-sm">
                      {formatCurrency(selectedCombo.price)}
                    </p>
                  </div>
                )}

                {/* Date/Time */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {watch('date')} luc {watch('time')}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {watchDescription && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-700 italic">
                      &quot;{watchDescription}&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              {pricing && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Chi tiet chi phi</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Combo</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(pricing.comboPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Phi nen tang (cua ban)
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(pricing.creatorFee)}
                      </span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-900">Ban tra</span>
                      <span className="font-bold text-primary-600 text-base">
                        {formatCurrency(pricing.creatorTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Doi phuong tra</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(pricing.applicantTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Nav Buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={goBack}
              className="flex-1 py-3.5 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              Quay lai
            </motion.button>
          )}

          {step < TOTAL_STEPS ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={goNext}
              disabled={!canGoNext}
              className={cn(
                'flex-1 py-3.5 flex items-center justify-center gap-2 rounded-xl font-semibold transition',
                canGoNext
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              Tiep tuc
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={creating || !pricing}
              className={cn(
                'flex-1 py-3.5 flex items-center justify-center gap-2 rounded-xl font-bold transition shadow-lg',
                creating || !pricing
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-rose-500 text-white hover:opacity-90'
              )}
            >
              {creating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              {creating ? 'Dang tao...' : 'Tao Date Order'}
            </motion.button>
          )}
        </div>
      </form>
    </div>
  );
}
