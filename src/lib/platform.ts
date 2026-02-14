// DineDate 2026 - Platform Fee & Pricing Constants

// Fixed platform fee per person per date (VND)
export const PLATFORM_FEE_PER_PERSON = 100000; // 100k VND

// VIP discount on platform fee (50% off)
export const VIP_PLATFORM_FEE_DISCOUNT = 0.5;

// Default restaurant commission rate (15%)
export const DEFAULT_RESTAURANT_COMMISSION_RATE = 0.15;

// Calculate what each person pays
export function calcDateOrderPricing(params: {
  comboPrice: number;
  paymentSplit: 'split' | 'creator_pays' | 'applicant_pays';
  restaurantCommissionRate: number;
  creatorIsVip?: boolean;
  applicantIsVip?: boolean;
}) {
  const { comboPrice, paymentSplit, restaurantCommissionRate, creatorIsVip, applicantIsVip } = params;

  const creatorFee = creatorIsVip
    ? Math.round(PLATFORM_FEE_PER_PERSON * (1 - VIP_PLATFORM_FEE_DISCOUNT))
    : PLATFORM_FEE_PER_PERSON;
  const applicantFee = applicantIsVip
    ? Math.round(PLATFORM_FEE_PER_PERSON * (1 - VIP_PLATFORM_FEE_DISCOUNT))
    : PLATFORM_FEE_PER_PERSON;

  let creatorComboShare = 0;
  let applicantComboShare = 0;

  switch (paymentSplit) {
    case 'split':
      creatorComboShare = Math.round(comboPrice / 2);
      applicantComboShare = Math.round(comboPrice / 2);
      break;
    case 'creator_pays':
      creatorComboShare = comboPrice;
      applicantComboShare = 0;
      break;
    case 'applicant_pays':
      creatorComboShare = 0;
      applicantComboShare = comboPrice;
      break;
  }

  const creatorTotal = creatorFee + creatorComboShare;
  const applicantTotal = applicantFee + applicantComboShare;
  const restaurantCommission = Math.round(comboPrice * restaurantCommissionRate);
  const totalPlatformRevenue = creatorFee + applicantFee + restaurantCommission;

  return {
    creatorFee,
    applicantFee,
    creatorComboShare,
    applicantComboShare,
    creatorTotal,
    applicantTotal,
    comboPrice,
    restaurantCommission,
    totalPlatformRevenue,
  };
}
