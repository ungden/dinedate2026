// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

/**
 * Resolve Dispute Edge Function (Admin Only)
 *
 * This function handles dispute resolution:
 * 1. Validates admin role
 * 2. Executes the chosen resolution:
 *    - refund_full: Return 100% to user, partner gets nothing
 *    - refund_partial: Return specified amount to user, rest to partner
 *    - release_to_partner: Partner gets full payment
 *    - no_action: Cancel dispute, booking returns to previous state
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
  resolution: 'refund_full' | 'refund_partial' | 'release_to_partner' | 'no_action';
  resolutionAmount?: number; // For partial refund
  resolutionNotes?: string;
};

const VALID_RESOLUTIONS = ['refund_full', 'refund_partial', 'release_to_partner', 'no_action'];

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

  // Fetch dispute with booking details
  const { data: dispute, error: disputeErr } = await admin
    .from('disputes')
    .select('id, booking_id, user_id, status, reason')
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

  // Fetch booking
  const { data: booking, error: bookingErr } = await admin
    .from('bookings')
    .select('id, user_id, partner_id, total_amount, partner_earning, platform_fee, activity, status')
    .eq('id', dispute.booking_id)
    .single();

  if (bookingErr || !booking) {
    return new Response(JSON.stringify({ error: 'Booking not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const totalAmount = Number(booking.total_amount);
  const partnerEarning = Number(booking.partner_earning);
  const platformFee = Number(booking.platform_fee);
  const bookerId = booking.user_id;
  const partnerId = booking.partner_id;

  // Execute resolution
  try {
    switch (body.resolution) {
      case 'refund_full': {
        // Full refund: Return 100% to user from escrow
        const { data: bookerWallet } = await admin
          .from('users')
          .select('wallet_balance, wallet_escrow')
          .eq('id', bookerId)
          .single();

        const currentBalance = Number(bookerWallet?.wallet_balance || 0);
        const currentEscrow = Number(bookerWallet?.wallet_escrow || 0);

        // Return escrow to balance
        await admin.from('users').update({
          wallet_balance: currentBalance + totalAmount,
          wallet_escrow: currentEscrow - totalAmount,
        }).eq('id', bookerId);

        // Log transaction
        await admin.from('transactions').insert({
          user_id: bookerId,
          type: 'refund',
          amount: totalAmount,
          status: 'completed',
          description: `Hoan tien 100% - Khieu nai don hang: ${booking.activity}`,
          related_id: booking.id,
        });

        // Update booking status
        await admin.from('bookings').update({
          status: 'cancelled',
          payout_status: 'refunded',
        }).eq('id', booking.id);

        break;
      }

      case 'refund_partial': {
        const refundAmount = Math.min(Number(body.resolutionAmount || 0), totalAmount);
        if (refundAmount <= 0) {
          return new Response(JSON.stringify({ error: 'Invalid refund amount' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const partnerAmount = totalAmount - refundAmount;

        // Get booker wallet
        const { data: bookerWallet } = await admin
          .from('users')
          .select('wallet_balance, wallet_escrow')
          .eq('id', bookerId)
          .single();

        const bookerBalance = Number(bookerWallet?.wallet_balance || 0);
        const bookerEscrow = Number(bookerWallet?.wallet_escrow || 0);

        // Return refund to booker
        await admin.from('users').update({
          wallet_balance: bookerBalance + refundAmount,
          wallet_escrow: bookerEscrow - totalAmount,
        }).eq('id', bookerId);

        // Log booker transaction
        await admin.from('transactions').insert({
          user_id: bookerId,
          type: 'refund',
          amount: refundAmount,
          status: 'completed',
          description: `Hoan tien mot phan - Khieu nai don hang: ${booking.activity}`,
          related_id: booking.id,
        });

        // Give remaining to partner (after platform fee)
        if (partnerAmount > 0) {
          // Calculate proportional partner earning
          const partnerPayout = Math.round(partnerAmount * (partnerEarning / totalAmount));

          const { data: partnerWallet } = await admin
            .from('users')
            .select('wallet_balance')
            .eq('id', partnerId)
            .single();

          const partnerBalance = Number(partnerWallet?.wallet_balance || 0);

          await admin.from('users').update({
            wallet_balance: partnerBalance + partnerPayout,
          }).eq('id', partnerId);

          // Log partner transaction
          await admin.from('transactions').insert({
            user_id: partnerId,
            type: 'booking_earning',
            amount: partnerPayout,
            status: 'completed',
            description: `Thu nhap (sau khieu nai): ${booking.activity}`,
            related_id: booking.id,
          });
        }

        // Update booking status
        await admin.from('bookings').update({
          status: 'completed',
          payout_status: 'partial_refund',
        }).eq('id', booking.id);

        break;
      }

      case 'release_to_partner': {
        // Release full payment to partner (same as normal completion)
        const { data: bookerWallet } = await admin
          .from('users')
          .select('wallet_escrow, total_spending, vip_tier')
          .eq('id', bookerId)
          .single();

        const currentEscrow = Number(bookerWallet?.wallet_escrow || 0);
        const currentSpending = Number(bookerWallet?.total_spending || 0);

        // Deduct from escrow, add to spending
        await admin.from('users').update({
          wallet_escrow: currentEscrow - totalAmount,
          total_spending: currentSpending + totalAmount,
        }).eq('id', bookerId);

        // Add to partner balance
        const { data: partnerWallet } = await admin
          .from('users')
          .select('wallet_balance')
          .eq('id', partnerId)
          .single();

        const partnerBalance = Number(partnerWallet?.wallet_balance || 0);

        await admin.from('users').update({
          wallet_balance: partnerBalance + partnerEarning,
        }).eq('id', partnerId);

        // Log transactions
        await admin.from('transactions').insert({
          user_id: bookerId,
          type: 'booking_payment',
          amount: totalAmount,
          status: 'completed',
          description: `Thanh toan (sau khieu nai): ${booking.activity}`,
          related_id: booking.id,
        });

        await admin.from('transactions').insert({
          user_id: partnerId,
          type: 'booking_earning',
          amount: partnerEarning,
          status: 'completed',
          description: `Thu nhap (sau khieu nai): ${booking.activity}`,
          related_id: booking.id,
        });

        // Update booking status
        await admin.from('bookings').update({
          status: 'completed',
          payout_status: 'paid',
          completed_at: new Date().toISOString(),
        }).eq('id', booking.id);

        break;
      }

      case 'no_action': {
        // No financial action, just close the dispute
        // Return booking to completed_pending status
        await admin.from('bookings').update({
          status: 'completed_pending',
          dispute_paused_at: null,
        }).eq('id', booking.id);

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
    const { data: bookerInfo } = await admin
      .from('users')
      .select('name')
      .eq('id', bookerId)
      .single();

    const { data: partnerInfo } = await admin
      .from('users')
      .select('name')
      .eq('id', partnerId)
      .single();

    // Create notifications based on resolution
    const resolutionMessages: Record<string, { booker: string; partner: string }> = {
      refund_full: {
        booker: `Khieu nai cua ban da duoc xu ly. Ban da nhan hoan tien 100% (${totalAmount.toLocaleString('vi-VN')} VND).`,
        partner: `Khieu nai tu khach hang ${bookerInfo?.name} da duoc xu ly. Don hang khong duoc thanh toan do vi pham.`,
      },
      refund_partial: {
        booker: `Khieu nai cua ban da duoc xu ly. Ban nhan hoan tien ${body.resolutionAmount?.toLocaleString('vi-VN')} VND.`,
        partner: `Khieu nai tu khach hang ${bookerInfo?.name} da duoc xu ly. Ban nhan mot phan thanh toan.`,
      },
      release_to_partner: {
        booker: `Khieu nai cua ban da duoc xem xet. Tien da duoc chuyen cho Partner.`,
        partner: `Khieu nai tu khach hang da duoc xu ly. Ban da nhan day du thanh toan (+${partnerEarning.toLocaleString('vi-VN')} VND).`,
      },
      no_action: {
        booker: `Khieu nai cua ban da duoc xem xet. Khong co hanh dong nao duoc thuc hien. Don hang tiep tuc xu ly binh thuong.`,
        partner: `Khieu nai tu khach hang ${bookerInfo?.name} da duoc dong. Don hang tiep tuc xu ly binh thuong.`,
      },
    };

    const messages = resolutionMessages[body.resolution];

    await admin.from('notifications').insert([
      {
        user_id: bookerId,
        type: 'dispute_resolved',
        title: 'Khieu nai da xu ly',
        message: messages.booker,
        data: { disputeId: body.disputeId, bookingId: booking.id, resolution: body.resolution },
        is_read: false,
      },
      {
        user_id: partnerId,
        type: 'dispute_resolved',
        title: 'Khieu nai da xu ly',
        message: messages.partner,
        data: { disputeId: body.disputeId, bookingId: booking.id, resolution: body.resolution },
        is_read: false,
      },
    ]);

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
