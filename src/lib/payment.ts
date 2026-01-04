import { supabase } from "@/integrations/supabase/client";

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
  user_id: string;
  amount: number;
  transfer_code: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  created_at: string;
  expires_at: string;
}

function toError(err: unknown, fallback = 'Đã xảy ra lỗi') {
  if (err instanceof Error) return err;

  if (typeof err === 'string') return new Error(err);

  const anyErr = err as any;

  const msg =
    anyErr?.context?.body?.message ||
    anyErr?.message ||
    anyErr?.error_description ||
    anyErr?.error ||
    fallback;

  return new Error(String(msg));
}

/**
 * Generate VietQR URL using SePay QR service
 * Format: https://qr.sepay.vn/img?acc={account}&bank={bankCode}&amount={amount}&des={content}
 * 
 * This matches the implementation in tien-nhan-chi-lo-new project
 */
export function generateVietQRUrl(config: PaymentConfig, amount: number, transferContent: string): string {
  // bank_name from edge function should already be short code like "MB", "VCB", etc.
  const bankCode = config.bank_name;
  const accountNo = config.bank_account;
  
  // Build URL exactly like tien-nhan-chi-lo-new
  const url = `https://qr.sepay.vn/img?acc=${encodeURIComponent(accountNo)}&bank=${encodeURIComponent(bankCode)}&amount=${amount}&des=${encodeURIComponent(transferContent)}`;
  
  // Debug log in development
  if (typeof window !== 'undefined') {
    console.log('[QR Debug] Generated URL:', url);
    console.log('[QR Debug] Config:', { bankCode, accountNo, amount, transferContent });
  }
  
  return url;
}

export function getBankDisplayName(config: PaymentConfig): string {
  return config.bank_full_name || config.bank_name;
}

export async function getPaymentConfig(): Promise<PaymentConfig | null> {
  try {
    const { data, error } = await supabase.functions.invoke("get-payment-config");
    
    if (error) {
      console.error('[Payment] Error fetching config:', error);
      throw toError(error, 'Không lấy được cấu hình thanh toán');
    }
    
    // Debug log
    if (typeof window !== 'undefined') {
      console.log('[Payment] Config received:', data);
    }
    
    return (data as PaymentConfig) ?? null;
  } catch (err) {
    console.error('[Payment] Exception:', err);
    throw toError(err, 'Không lấy được cấu hình thanh toán');
  }
}

export async function cancelTopupRequest(requestId: string): Promise<boolean> {
  const { error } = await supabase
    .from("topup_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
    .eq("status", "pending");

  return !error;
}

export async function checkTopupStatus(requestId: string): Promise<'pending' | 'confirmed' | 'cancelled' | 'expired' | null> {
  const { data, error } = await supabase
    .from("topup_requests")
    .select("status")
    .eq("id", requestId)
    .maybeSingle();

  if (error || !data) return null;
  return data.status as any;
}