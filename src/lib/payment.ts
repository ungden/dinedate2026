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

// Generate QR Code URL
export function generateVietQRUrl(config: PaymentConfig, amount: number, transferContent: string): string {
  const bankCode = config.bank_name || "MB";
  return `https://qr.sepay.vn/img?acc=${encodeURIComponent(config.bank_account)}&bank=${encodeURIComponent(bankCode)}&amount=${amount}&des=${encodeURIComponent(transferContent)}`;
}

export function getBankDisplayName(config: PaymentConfig): string {
  return config.bank_full_name || config.bank_name;
}

export async function getPaymentConfig(): Promise<PaymentConfig | null> {
  try {
    const { data, error } = await supabase.functions.invoke("get-payment-config");
    if (error) {
      console.error("Error fetching payment config:", error);
      return null;
    }
    return data as PaymentConfig;
  } catch (err) {
    console.error("Error calling get-payment-config:", err);
    return null;
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