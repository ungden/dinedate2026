// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization, x-sepay-secret",
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const webhookSecret = Deno.env.get("SEPAY_WEBHOOK_SECRET");

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ success: false, error: "Missing env" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (webhookSecret) {
    const provided = req.headers.get("x-sepay-secret");
    if (!provided || provided !== webhookSecret) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const payload = await req.json();
    console.log("Webhook payload:", JSON.stringify(payload));

    let matchedRequestId: string | null = null;
    let matchedRequest: any = null;

    // 1. Tìm theo mã chuyển khoản (Ưu tiên)
    const paymentCode = findPaymentCode(payload);
    if (paymentCode) {
      const { data: req, error: reqErr } = await admin
        .from("topup_requests")
        .select("*")
        .eq("transfer_code", paymentCode)
        .eq("status", "pending")
        .maybeSingle();

      if (req) {
        // Verify amount (cho phép sai số nhỏ nếu cần, ở đây yêu cầu chính xác hoặc lớn hơn)
        const amount = findAmount(payload);
        if (amount && amount >= req.amount) {
           matchedRequestId = req.id;
           matchedRequest = req;
        } else {
           console.log(`Amount mismatch or too low. Expected: ${req.amount}, Got: ${amount}`);
        }
      }
    }

    if (!matchedRequestId || !matchedRequest) {
      return new Response(JSON.stringify({ success: true, message: "Ignored: No matching pending request found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Xử lý giao dịch thành công
    
    // a. Cập nhật trạng thái yêu cầu nạp
    const { error: updateReqErr } = await admin
      .from("topup_requests")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", matchedRequestId);

    if (updateReqErr) throw updateReqErr;

    // b. Lấy thông tin user hiện tại để cộng tiền
    const { data: user, error: userErr } = await admin
      .from("users")
      .select("wallet_balance")
      .eq("id", matchedRequest.user_id)
      .single();
      
    if (userErr) throw userErr;

    const newBalance = (Number(user.wallet_balance) || 0) + Number(matchedRequest.amount);

    // c. Cập nhật số dư ví
    const { error: updateWalletErr } = await admin
      .from("users")
      .update({ wallet_balance: newBalance })
      .eq("id", matchedRequest.user_id);

    if (updateWalletErr) throw updateWalletErr;

    // d. Ghi log transaction
    const { error: txErr } = await admin
      .from("transactions")
      .insert({
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