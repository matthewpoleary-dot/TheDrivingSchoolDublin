import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { loadBookingByToken, cancelBookingSideEffects } from "@/lib/booking-service";
import { refundDeposit, isStripeConfigured } from "@/lib/stripe";
import { BOOKING_POLICY } from "@/lib/config";
import { clientIp } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Customer-initiated cancellation, authorised by the unguessable manage token
 * from their confirmation email.
 *
 * The refund decision is made here from the booking's own start time, never
 * from anything the client sends. Inside the free-cancellation window the
 * deposit comes back; outside it, it does not, which is stated on the page
 * before the button is pressed and in the Checkout terms before payment.
 */

const recent = new Map<string, number[]>();

function throttled(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 60_000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 10;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const ip = clientIp(request);
  if (throttled(ip)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const { token } = await context.params;
  const booking = await loadBookingByToken(token);

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ ok: true, alreadyCancelled: true });
  }

  if (!["held", "pending", "confirmed"].includes(booking.status)) {
    return NextResponse.json(
      { error: "This booking can no longer be cancelled. Please ring us." },
      { status: 409 }
    );
  }

  const startsAt = new Date(booking.starts_at);
  const hoursUntil = (startsAt.getTime() - Date.now()) / 3_600_000;
  const withinFreeWindow = hoursUntil >= BOOKING_POLICY.freeCancellationHours;

  let refundedCents: number | null = null;

  if (withinFreeWindow && isStripeConfigured() && booking.deposit_cents > 0) {
    try {
      refundedCents = await refundDeposit({
        bookingId: booking.id,
        paymentIntentId: booking.stripe_payment_intent_id,
        amountCents: booking.deposit_cents,
      });
    } catch (error) {
      // Do not block the cancellation on a refund failure. The slot must be
      // released either way; the instructor settles the money manually.
      console.error(`[cancel] refund failed for ${booking.reference}:`, error);
      await supabaseAdmin().from("booking_events").insert({
        booking_id: booking.id,
        event: "refund_failed",
        detail: { error: error instanceof Error ? error.message : String(error) },
        actor: "system",
      });
    }
  }

  const { error } = await supabaseAdmin().rpc("cancel_booking", {
    p_booking_id: booking.id,
    p_actor: "customer",
    p_reason: withinFreeWindow ? "Cancelled online, within notice" : "Cancelled online, late",
  });

  if (error) {
    console.error(`[cancel] cancel_booking failed for ${booking.reference}:`, error);
    return NextResponse.json({ error: "Could not cancel. Please ring us." }, { status: 500 });
  }

  await cancelBookingSideEffects(booking.id, {
    cancelledBy: "customer",
    refundedCents,
  });

  return NextResponse.json({
    ok: true,
    refunded: refundedCents !== null && refundedCents > 0,
    refundedCents,
    withinFreeWindow,
  });
}
