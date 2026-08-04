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
    const shouldRefund = parsed.data.refund ?? true;
    let refundedCents: number | null = null;

    if (shouldRefund && isStripeConfigured() && booking.deposit_cents > 0) {
      try {
        refundedCents = await refundDeposit({
          bookingId: booking.id,
          paymentIntentId: booking.stripe_payment_intent_id,
          amountCents: booking.deposit_cents,
        });
      } catch (error) {
        console.error(`[admin] refund failed for ${booking.reference}:`, error);
        await logEvent(booking.id, "refund_failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const { error } = await supabaseAdmin().rpc("cancel_booking", {
      p_booking_id: id,
      p_actor: "instructor",
      p_reason: reason ?? "Cancelled by instructor",
    });

    if (error) {
      return NextResponse.json({ error: "Could not cancel booking" }, { status: 500 });
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
