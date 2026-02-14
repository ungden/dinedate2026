// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

/**
 * Resolve Dispute Edge Function (Admin Only)
 *
 * This function handles dispute resolution for date orders:
 * 1. Validates admin role
 * 2. Executes the chosen resolution:
 *    - refund_full: Return 100% of disputing user's charge back to their wallet
 *    - refund_partial: Return specified amount to disputing user's wallet
 *    - no_action: Cancel dispute, date order returns to previous state
 * 3. Updates dispute record
 * 4. Notifies both parties
 */

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://www.dinedate.vn').split(',');

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

type ResolveDisputeBody = {
  disputeId: string;
  resolution: 'refund_full' | 'refund_partial' | 'no_action';
  resolutionAmount?: number; // For partial refund
  resolutionNotes?: string;
};

const VALID_RESOLUTIONS = ['refund_full', 'refund_partial', 'no_action'];

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.replace('Bearer ', '');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const admin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // Verify user and check admin role
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const adminId = userData.user.id;

  // Check if user is admin
  const { data: adminUser, error: adminCheckErr } = await admin
    .from('users')
    .select('role')
    .eq('id', adminId)
    .single();

  if (adminCheckErr || adminUser?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Parse body
  let body: ResolveDisputeBody;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Validate required fields
  if (!body?.disputeId || !body?.resolution) {
    return new Response(JSON.stringify({ error: 'Missing required fields: disputeId, resolution' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Validate resolution type
  if (!VALID_RESOLUTIONS.includes(body.resolution)) {
    return new Response(JSON.stringify({ error: 'Invalid resolution. Must be one of: ' + VALID_RESOLUTIONS.join(', ') }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Fetch dispute
  const { data: dispute, error: disputeErr } = await admin
    .from('disputes')
    .select('id, date_order_id, user_id, status, reason')
    .eq('id', body.disputeId)
    .single();

  if (disputeErr || !dispute) {
    return new Response(JSON.stringify({ error: 'Dispute not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Check if already resolved
  if (dispute.status === 'resolved') {
    return new Response(JSON.stringify({ error: 'Dispute already resolved' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Fetch date_order
  const { data: dateOrder, error: dateOrderErr } = await admin
    .from('date_orders')
    .select('id, creator_id, matched_user_id, combo_price, creator_charge, applicant_charge, creator_platform_fee, applicant_platform_fee, status')
    .eq('id', dispute.date_order_id)
    .single();

  if (dateOrderErr || !dateOrder) {
    return new Response(JSON.stringify({ error: 'Date order not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Determine who filed the dispute and what they were charged
  const disputerId = dispute.user_id;
  const isDisputerCreator = disputerId === dateOrder.creator_id;
  const disputerCharge = isDisputerCreator
    ? Number(dateOrder.creator_charge || 0)
    : Number(dateOrder.applicant_charge || 0);

  const otherUserId = isDisputerCreator ? dateOrder.matched_user_id : dateOrder.creator_id;

  // Execute resolution
  try {
    switch (body.resolution) {
      case 'refund_full': {
        // Full refund: Return disputer's charge back to their wallet
        const { data: disputerWallet } = await admin
          .from('users')
          .select('wallet_balance, wallet_escrow')
          .eq('id', disputerId)
          .single();

        const currentBalance = Number(disputerWallet?.wallet_balance || 0);
        const currentEscrow = Number(disputerWallet?.wallet_escrow || 0);

        // Return escrow to balance
        await admin.from('users').update({
          wallet_balance: currentBalance + disputerCharge,
          wallet_escrow: Math.max(0, currentEscrow - disputerCharge),
        }).eq('id', disputerId);

        // Log transaction
        await admin.from('transactions').insert({
          user_id: disputerId,
          type: 'refund',
          amount: disputerCharge,
          status: 'completed',
          description: `Hoan tien 100% - Khieu nai date order`,
          related_id: dateOrder.id,
        });

        // Update date_order status
        await admin.from('date_orders').update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        }).eq('id', dateOrder.id);

        break;
      }

      case 'refund_partial': {
        const refundAmount = Math.min(Number(body.resolutionAmount || 0), disputerCharge);
        if (refundAmount <= 0) {
          return new Response(JSON.stringify({ error: 'Invalid refund amount' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get disputer wallet
        const { data: disputerWallet } = await admin
          .from('users')
          .select('wallet_balance, wallet_escrow')
          .eq('id', disputerId)
          .single();

        const disputerBalance = Number(disputerWallet?.wallet_balance || 0);
        const disputerEscrow = Number(disputerWallet?.wallet_escrow || 0);

        // Return partial refund to disputer
        await admin.from('users').update({
          wallet_balance: disputerBalance + refundAmount,
          wallet_escrow: Math.max(0, disputerEscrow - refundAmount),
        }).eq('id', disputerId);

        // Log transaction
        await admin.from('transactions').insert({
          user_id: disputerId,
          type: 'refund',
          amount: refundAmount,
          status: 'completed',
          description: `Hoan tien mot phan - Khieu nai date order`,
          related_id: dateOrder.id,
        });

        // Update date_order status
        await admin.from('date_orders').update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        }).eq('id', dateOrder.id);

        break;
      }

      case 'no_action': {
        // No financial action, just close the dispute
        // Return date_order to 'matched' status
        await admin.from('date_orders').update({
          status: 'matched',
          updated_at: new Date().toISOString(),
        }).eq('id', dateOrder.id);

        break;
      }
    }

    // Update dispute record
    await admin.from('disputes').update({
      status: 'resolved',
      resolution: body.resolution,
      resolution_amount: body.resolution === 'refund_partial' ? body.resolutionAmount : null,
      resolution_notes: body.resolutionNotes || null,
      resolved_by: adminId,
      resolved_at: new Date().toISOString(),
    }).eq('id', body.disputeId);

    // Get user names for notifications
    const { data: disputerInfo } = await admin
      .from('users')
      .select('name')
      .eq('id', disputerId)
      .single();

    // Create notifications based on resolution
    const resolutionMessages: Record<string, { disputer: string; other: string }> = {
      refund_full: {
        disputer: `Khieu nai cua ban da duoc xu ly. Ban da nhan hoan tien 100% (${disputerCharge.toLocaleString('vi-VN')} VND).`,
        other: `Khieu nai tu ${disputerInfo?.name || 'nguoi dung'} da duoc xu ly. Date order da bi huy.`,
      },
      refund_partial: {
        disputer: `Khieu nai cua ban da duoc xu ly. Ban nhan hoan tien ${(body.resolutionAmount || 0).toLocaleString('vi-VN')} VND.`,
        other: `Khieu nai tu ${disputerInfo?.name || 'nguoi dung'} da duoc xu ly voi hoan tien mot phan.`,
      },
      no_action: {
        disputer: `Khieu nai cua ban da duoc xem xet. Khong co hanh dong nao duoc thuc hien. Date tiep tuc xu ly binh thuong.`,
        other: `Khieu nai tu ${disputerInfo?.name || 'nguoi dung'} da duoc dong. Date tiep tuc xu ly binh thuong.`,
      },
    };

    const messages = resolutionMessages[body.resolution];

    const notifications = [
      {
        user_id: disputerId,
        type: 'dispute_resolved',
        title: 'Khieu nai da xu ly',
        message: messages.disputer,
        data: { disputeId: body.disputeId, dateOrderId: dateOrder.id, resolution: body.resolution },
        is_read: false,
      },
    ];

    if (otherUserId) {
      notifications.push({
        user_id: otherUserId,
        type: 'dispute_resolved',
        title: 'Khieu nai da xu ly',
        message: messages.other,
        data: { disputeId: body.disputeId, dateOrderId: dateOrder.id, resolution: body.resolution },
        is_read: false,
      });
    }

    await admin.from('notifications').insert(notifications);

    console.log(`[RESOLVE-DISPUTE] Dispute ${body.disputeId} resolved with ${body.resolution} by admin ${adminId}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Dispute resolved successfully',
      resolution: body.resolution,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('[RESOLVE-DISPUTE] Error:', err);
    return new Response(JSON.stringify({ error: 'Failed to resolve dispute: ' + err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
