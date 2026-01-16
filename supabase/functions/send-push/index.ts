// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Send Push Notification Edge Function
 *
 * Sends push notifications to users via Web Push API
 * For now, stores notification in DB and can trigger local notifications
 * Full web-push implementation requires VAPID keys and web-push library
 */

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "https://www.dinedate.vn").split(",");

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes("*");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

interface SendPushBody {
  userId: string;
  title: string;
  body: string;
  data?: {
    type?: "booking" | "message" | "payment" | "general";
    url?: string;
    bookingId?: string;
    chatId?: string;
    [key: string]: string | undefined;
  };
  // Optional: send to all user's subscriptions or just one endpoint
  endpoint?: string;
}

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  subscription_json: string;
  is_active: boolean;
}

// Placeholder for actual web-push sending
// In production, use web-push library with VAPID keys
async function sendWebPush(
  subscription: PushSubscription,
  payload: { title: string; body: string; data?: Record<string, unknown> }
): Promise<{ success: boolean; error?: string }> {
  // For now, just log the push attempt
  // Full implementation requires:
  // 1. VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars
  // 2. web-push library (or manual implementation)

  console.log("[SendPush] Would send push to:", subscription.endpoint);
  console.log("[SendPush] Payload:", JSON.stringify(payload));

  // Check if VAPID keys are configured
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@dinedate.vn";

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("[SendPush] VAPID keys not configured. Push notification queued but not sent.");
    return { success: true }; // Return success to allow notification to be stored
  }

  // TODO: Implement actual web-push sending
  // Example with web-push (would need to import):
  //
  // import webpush from 'npm:web-push';
  // webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  // await webpush.sendNotification(
  //   JSON.parse(subscription.subscription_json),
  //   JSON.stringify(payload)
  // );

  return { success: true };
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create clients
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    // Verify user is authenticated
    const { data: userData, error: userErr } = await supabaseUserClient.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = (await req.json()) as SendPushBody;

    if (!body.userId || !body.title || !body.body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user's active push subscriptions
    let query = supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", body.userId)
      .eq("is_active", true);

    if (body.endpoint) {
      query = query.eq("endpoint", body.endpoint);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      console.error("[SendPush] Error fetching subscriptions:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("[SendPush] No active subscriptions for user:", body.userId);
      // Still create notification in DB even if no push subscription
    }

    // Create notification record in database
    const notificationPayload = {
      user_id: body.userId,
      type: body.data?.type || "general",
      title: body.title,
      message: body.body,
      data: body.data || {},
      is_read: false,
    };

    const { data: notification, error: notifError } = await supabaseAdmin
      .from("notifications")
      .insert(notificationPayload)
      .select("id")
      .single();

    if (notifError) {
      console.error("[SendPush] Error creating notification:", notifError);
      // Continue even if notification creation fails
    } else {
      console.log("[SendPush] Notification created:", notification?.id);
    }

    // Send push to all active subscriptions
    const pushPayload = {
      title: body.title,
      body: body.body,
      data: {
        ...body.data,
        notificationId: notification?.id,
      },
    };

    const results = await Promise.all(
      (subscriptions || []).map(async (sub: PushSubscription) => {
        try {
          const result = await sendWebPush(sub, pushPayload);
          return { endpoint: sub.endpoint, ...result };
        } catch (error) {
          console.error("[SendPush] Error sending to endpoint:", sub.endpoint, error);

          // Mark subscription as inactive if push fails with 410 (Gone)
          if ((error as any)?.statusCode === 410) {
            await supabaseAdmin
              .from("push_subscriptions")
              .update({ is_active: false })
              .eq("id", sub.id);
          }

          return { endpoint: sub.endpoint, success: false, error: String(error) };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        notificationId: notification?.id,
        pushResults: {
          sent: successCount,
          failed: failCount,
          total: results.length,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[SendPush] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
