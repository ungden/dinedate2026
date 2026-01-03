// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map BIN to bank code (format Sepay QR yêu cầu)
const bankCodes: Record<string, string> = {
  "970422": "MB",
  "970436": "VCB",
  "970407": "TCB",
  "970418": "BIDV",
  "970432": "VPB",
  "970416": "ACB",
  "970423": "TPB",
  "970403": "STB",
  "970415": "CTG",
  "970405": "AGRIBANK",
};

const bankFullNames: Record<string, string> = {
  "970422": "MB Bank",
  "970436": "Vietcombank",
  "970407": "Techcombank",
  "970418": "BIDV",
  "970432": "VPBank",
  "970416": "ACB",
  "970423": "TPBank",
  "970403": "Sacombank",
  "970415": "VietinBank",
  "970405": "Agribank",
};

const DEFAULT_BANK_BIN = "970422"; // MB Bank default

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bankVA = Deno.env.get("SEPAY_BANK_VA") || "";
    const accountName = Deno.env.get("SEPAY_VA_ACCOUNT_NAME") || "";
    const bankBinRaw = Deno.env.get("SEPAY_BANK_BIN") || "";
    const bankNameOverride = Deno.env.get("SEPAY_BANK_NAME") || "";

    if (!bankVA) {
      return new Response(
        JSON.stringify({
          is_active: false,
          message: "Chưa cấu hình SEPAY_BANK_VA",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resolvedBin = bankBinRaw.trim() || DEFAULT_BANK_BIN;
    
    const bankCode = bankNameOverride.trim() || bankCodes[resolvedBin] || "MB";
    const bankFullName = bankNameOverride.trim() 
      ? (bankFullNames[resolvedBin] || bankNameOverride) 
      : (bankFullNames[resolvedBin] || "MB Bank");

    return new Response(
      JSON.stringify({
        is_active: true,
        bank_name: bankCode,
        bank_full_name: bankFullName,
        bank_account: bankVA,
        bank_holder: accountName || "SEPAY",
        bank_bin: resolvedBin,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ is_active: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});