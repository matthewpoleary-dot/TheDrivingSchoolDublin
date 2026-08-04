import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/auth";
import { loadBooking, cancelBookingSideEffects, logEvent } from "@/lib/booking-service";
import { refundDeposit, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  action: z.enum(["cancel", "complete", "no_show"]),
  reason: z.string().max(500).optional(),
  /** Instructor's explicit choice. Defaults to refunding on a cancellation. */
  refund: z.boolean().optional(),
});

/**
 * Instructor actions on a booking.
 *
 * A cancellation by the instructor refunds by default regardless of notice,
 * because the pupil did nothing wrong. That default can be overridden in the
 * request, which is the honest place for that decision to live.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const booking = await loadBooking(id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const { action, reason } = parsed.data;

  if (action === "cancel") {
    // Already cancelled is a no-op, not a second refund. Without this an
    // instructor who taps cancel twice more than 24 hours apart pays the pupil
    // back twice: Stripe's idempotency keys expire after a day.
    if (booking.status === "cancelled") {
      return NextResponse.json({ ok: true, alreadyCancelled: true, refundedCents: null });
    }

    const shouldRefund = parsed.data.refund ?? true;
    const alreadyRefunded = Boolean(booking.refunded_at);

    // Cancel first: a refund issued before a failed cancellation leaves the
    // pupil paid back with the lesson still on the books.
    const { error } = await supabaseAdmin().rpc("cancel_booking", {
      p_booking_id: id,
      p_actor: "instructor",
      p_reason: reason ?? "Cancelled by instructor",
    });

    if (error) {
      return NextResponse.json({ error: "Could not cancel booking" }, { status: 500 });
    }

    let refundedCents: number | null = null;

    if (
      shouldRefund &&
      !alreadyRefunded &&
      isStripeConfigured() &&
      booking.deposit_cents > 0 &&
      // No payment intent means the money never actually landed, typically
      // because the pupil is still in Checkout. Nothing to give back.
      booking.stripe_payment_intent_id
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
            .eq("id", id);
        }
      } catch (error) {
        console.error(`[admin] refund failed for ${booking.reference}:`, error);
        await logEvent(booking.id, "refund_failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await cancelBookingSideEffects(id, { cancelledBy: "instructor", refundedCents });

    return NextResponse.json({ ok: true, refundedCents });
  }

  // complete / no_show: terminal states, no side effects beyond the log.
  const status = action === "complete" ? "completed" : "no_show";

  const { error } = await supabaseAdmin()
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .in("status", ["confirmed", "pending"]);

  if (error) {
    return NextResponse.json({ error: "Could not update booking" }, { status: 500 });
  }

  await logEvent(id, status, { reason: reason ?? null }, "instructor");

  return NextResponse.json({ ok: true });
}
