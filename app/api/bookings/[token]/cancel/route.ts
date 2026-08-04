import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { loadBookingByToken, cancelBookingSideEffects } from "@/lib/booking-service";
import { refundDeposit, isStripeConfigured } from "@/lib/stripe";
import { BOOKING_POLICY } from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/auth";

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

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const ip = clientIp(request);
  if (rateLimit(`cancel:${ip}`, { limit: 10 })) {
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

  // Cancel FIRST, refund second. The other order means a failed cancellation
  // leaves the customer refunded, the lesson still confirmed and the slot
  // still blocked. cancel_booking is idempotent, so this ordering is safe.
  const { error } = await supabaseAdmin().rpc("cancel_booking", {
    p_booking_id: booking.id,
    p_actor: "customer",
    p_reason: withinFreeWindow ? "Cancelled online, within notice" : "Cancelled online, late",
  });

  if (error) {
    console.error(`[cancel] cancel_booking failed for ${booking.reference}:`, error);
    return NextResponse.json({ error: "Could not cancel. Please ring us." }, { status: 500 });
  }

  let refundedCents: number | null = null;

  // `refunded_at` is the guard against paying somebody twice: Stripe's
  // idempotency keys only last 24 hours, so they cannot be relied on for this.
  const alreadyRefunded = Boolean(booking.refunded_at);

  if (
    withinFreeWindow &&
    !alreadyRefunded &&
    isStripeConfigured() &&
    booking.deposit_cents > 0
  ) {
    try {
      refundedCents = await refundDeposit({
        bookingId: booking.id,
        paymentIntentId: booking.stripe_payment_intent_id,
        amountCents: booking.deposit_cents,
      });

      if (refundedCents) {
        await supabaseAdmin()
          .from("bookings")
          .update({ refunded_at: new Date().toISOString(), refund_cents: refundedCents })
          .eq("id", booking.id);
      }
    } catch (error) {
      // Never block the cancellation on a refund failure. The slot is already
      // released; the instructor settles the money manually.
      console.error(`[cancel] refund failed for ${booking.reference}:`, error);
      await supabaseAdmin().from("booking_events").insert({
        booking_id: booking.id,
        event: "refund_failed",
        detail: { error: error instanceof Error ? error.message : String(error) },
        actor: "system",
      });
    }
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
