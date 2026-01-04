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

  // Supabase function invoke errors often look like:
  // { message, name, context: { body: { message } } }
  const msg =
    anyErr?.context?.body?.message ||
    anyErr?.message ||
    anyErr?.error_description ||
    anyErr?.error ||
    fallback;

  return new Error(String(msg));
}

// Generate QR Code URL using VietQR API
export function generateVietQRUrl(config: PaymentConfig, amount: number, transferContent: string): string {
  // Use BIN or Bank Name (e.g., 970422 or MB)
  const bankId = config.bank_bin || config.bank_name || "MB";
  const accountNo = config.bank_account;
  
  // Template 'compact2' is clean and standard
  const template = "compact2";
  
  const content = encodeURIComponent(transferContent);
  const accountName = encodeURIComponent(config.bank_holder || "");
  
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${content}&accountName=${accountName}`;
}

export function getBankDisplayName(config: PaymentConfig): string {
  return config.bank_full_name || config.bank_name;
}

export async function getPaymentConfig(): Promise<PaymentConfig | null> {
  const { data, error } = await supabase.functions.invoke("get-payment-config");
  if (error) {
    throw toError(error, 'Không lấy được cấu hình thanh toán');
  }
  return (data as PaymentConfig) ?? null;
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