export const PLATFORM_FEE_RATE = 0.3;
export const PARTNER_EARNING_RATE = 1 - PLATFORM_FEE_RATE; // 0.7

export function calcPlatformFee(amount: number) {
  return Math.round(amount * PLATFORM_FEE_RATE);
}

export function calcPartnerEarning(amount: number) {
  return Math.round(amount * PARTNER_EARNING_RATE);
}