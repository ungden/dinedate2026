// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:3000').split(',');

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
}

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
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bankVA = (Deno.env.get("SEPAY_BANK_VA") || "").trim();
    const accountName = (Deno.env.get("SEPAY_VA_ACCOUNT_NAME") || "").trim();
    const bankBinRaw = (Deno.env.get("SEPAY_BANK_BIN") || "").trim();
    const bankNameOverride = (Deno.env.get("SEPAY_BANK_NAME") || "").trim();

    if (!bankVA) {
      return new Response(
        JSON.stringify({
          is_active: false,
          message: "Chưa cấu hình SEPAY_BANK_VA",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resolvedBin = bankBinRaw || DEFAULT_BANK_BIN;

    const bankCode = (bankNameOverride || bankCodes[resolvedBin] || "MB").trim();
    const bankFullName = bankNameOverride
      ? (bankFullNames[resolvedBin] || bankNameOverride)
      : (bankFullNames[resolvedBin] || "MB Bank");

    return new Response(
      JSON.stringify({
        is_active: true,
        bank_name: bankCode,
        bank_full_name: bankFullName,
        bank_account: bankVA, // already trimmed
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