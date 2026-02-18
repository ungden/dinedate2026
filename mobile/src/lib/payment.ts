import { supabase } from './supabase';

export interface PaymentConfig {
  is_active: boolean;
  bank_name: string;
  bank_full_name?: string;
  bank_account: string;
  bank_holder: string;
  bank_bin: string;
}

export interface TopupRequest {
  id: string;
  transfer_code: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
}

/**
 * Fetch SePay payment config from Edge Function
 */
export async function getPaymentConfig(): Promise<PaymentConfig | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-payment-config');
    if (error) {
      console.warn('[payment] Lỗi lấy config:', error.message);
      return null;
    }
    return (data as PaymentConfig) ?? null;
  } catch (err) {
    console.warn('[payment] Lỗi lấy config:', err);
    return null;
  }
}

/**
 * Generate VietQR URL via SePay QR service
 */
export function generateVietQRUrl(
  config: PaymentConfig,
  amount: number,
  transferCode: string,
): string {
  const bankCode = (config.bank_name || '').trim();
  const accountNo = (config.bank_account || '').replace(/\s+/g, '').trim();
  const content = (transferCode || '').trim();

  return `https://qr.sepay.vn/img?acc=${encodeURIComponent(accountNo)}&bank=${encodeURIComponent(bankCode)}&amount=${amount}&des=${encodeURIComponent(content)}`;
}

/**
 * Get display name for bank
 */
export function getBankDisplayName(config: PaymentConfig): string {
  return config.bank_full_name || config.bank_name;
}

/**
 * Create a topup request in topup_requests table
 */
export async function createTopupRequest(
  userId: string,
  amount: number,
): Promise<TopupRequest | null> {
  const code = `DD${Date.now().toString().slice(-8)}`;

  const { data, error } = await supabase
    .from('topup_requests')
    .insert({
      user_id: userId,
      amount,
      transfer_code: code,
      status: 'pending',
    })
    .select('id, transfer_code, status')
    .single();

  if (error) {
    console.warn('[payment] Lỗi tạo topup request:', error.message);
    return null;
  }

  return data as TopupRequest;
}

/**
 * Check status of a topup request
 */
export async function checkTopupStatus(
  requestId: string,
): Promise<'pending' | 'confirmed' | 'cancelled' | 'expired' | null> {
  const { data, error } = await supabase
    .from('topup_requests')
    .select('status')
    .eq('id', requestId)
    .maybeSingle();

  if (error || !data) return null;
  return data.status as TopupRequest['status'];
}

/**
 * Cancel a pending topup request
 */
export async function cancelTopupRequest(requestId: string): Promise<boolean> {
  const { error } = await supabase
    .from('topup_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .eq('status', 'pending');

  return !error;
}
