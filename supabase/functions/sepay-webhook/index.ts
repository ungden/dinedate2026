// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization",
};

// Regex bắt mã DDXXXXXXXX (ví dụ DD17364822) - Khớp với logic generateTransferNote ở client
const CODE_REGEX = /(DD[0-9]{8,})/i;

function findPaymentCode(payload: any): string | null {
  const textSources = [
    payload.content,
    payload.description,
    payload.addInfo,
    payload.contentStr,
    payload.referenceCode,
    payload.code,
  ];

  for (const source of textSources) {
    if (typeof source === "string") {
      const match = source.match(CODE_REGEX);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
  }
  return null;
}

function findAmount(payload: any): number | null {
  const amount = payload?.transferAmount ?? payload?.amount ?? payload?.transAmount;
  if (typeof amount === "number" && isFinite(amount)) return amount;
  if (typeof amount === "string") {
    const num = parseFloat(amount);
    if (!isNaN(num)) return num;
  }
  return null;
}

function parseSepayApiKeyFromAuthHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const trimmed = authHeader.trim();

  // Expected format: "Apikey <key>" (case-insensitive)
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return null;
  if (parts[0].toLowerCase() !== "apikey") return null;

  return parts.slice(1).join(" ").trim();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  // Reuse existing secret name as SePay webhook API key
  const sepayApiKey = (Deno.env.get("SEPAY_WEBHOOK_SECRET") || "").trim();

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ success: false, error: "Missing env" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Strict auth: require Authorization: Apikey <SEPAY_WEBHOOK_SECRET>
  if (sepayApiKey) {
    const providedKey = parseSepayApiKeyFromAuthHeader(req.headers.get("Authorization"));
    if (!providedKey || providedKey !== sepayApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing or invalid Authorization Apikey",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const payload = await req.json();
    console.log("Webhook payload:", JSON.stringify(payload));

    let matchedRequestId: string | null = null;
    let matchedRequest: any = null;

    // 1) Match pending topup_requests by transfer_code
    const paymentCode = findPaymentCode(payload);
    if (paymentCode) {
      const { data: reqRow, error: reqErr } = await admin
        .from("topup_requests")
        .select("*")
        .eq("transfer_code", paymentCode)
        .eq("status", "pending")
        .maybeSingle();

      if (reqErr) {
        console.log("Find request error:", reqErr);
      }

      if (reqRow) {
        const amount = findAmount(payload);
        if (amount && amount >= reqRow.amount) {
          matchedRequestId = reqRow.id;
          matchedRequest = reqRow;
        } else {
          console.log(`Amount mismatch or too low. Expected: ${reqRow.amount}, Got: ${amount}`);
        }
      }
    }

    if (!matchedRequestId || !matchedRequest) {
      return new Response(
        JSON.stringify({ success: true, message: "Ignored: No matching pending request found" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2) Confirm topup request
    const { error: updateReqErr } = await admin
      .from("topup_requests")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", matchedRequestId);

    if (updateReqErr) throw updateReqErr;

    // 3) Add wallet balance
    const { data: userRow, error: userErr } = await admin
      .from("users")
      .select("wallet_balance")
      .eq("id", matchedRequest.user_id)
      .single();

    if (userErr) throw userErr;

    const newBalance = (Number(userRow.wallet_balance) || 0) + Number(matchedRequest.amount);

    const { error: updateWalletErr } = await admin
      .from("users")
      .update({ wallet_balance: newBalance })
      .eq("id", matchedRequest.user_id);

    if (updateWalletErr) throw updateWalletErr;

    // 4) Log transaction
    const { error: txErr } = await admin.from("transactions").insert({
      user_id: matchedRequest.user_id,
      type: "top_up",
      amount: matchedRequest.amount,
      status: "completed",
      description: `Nạp tiền tự động qua Sepay (${matchedRequest.transfer_code})`,
      payment_method: "banking",
      related_id: matchedRequestId,
      completed_at: new Date().toISOString(),
    });

    if (txErr) console.error("Transaction log error:", txErr);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Topup confirmed",
        requestId: matchedRequestId,
        amount: matchedRequest.amount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Webhook Error:", e);
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});