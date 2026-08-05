import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { constructWebhookEvent, refundDeposit } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import {
  confirmBookingSideEffects,
  cancelBookingSideEffects,
  logEvent,
} from "@/lib/booking-service";

/**
 * Money arrived for a booking that can never be confirmed. Give it straight
 * back rather than sitting on it, and leave a loud trail either way.
 */
async function autoRefundOrphanedPayment(
  bookingId: string,
  paymentIntentId: string | null,
  session: Stripe.Checkout.Session
): Promise<void> {
  const amount = session.amount_total ?? 0;

  try {
    const refunded = await refundDeposit({
      bookingId,
      paymentIntentId,
      amountCents: amount,
      reason: "duplicate",
    });
    await logEvent(
      bookingId,
      "orphaned_payment_refunded",
      { session: session.id, amount: refunded },
      "system"
    );
  } catch (error) {
    // Now it genuinely needs a human, so make that unmissable in the logs.
    console.error(
      `[stripe-webhook] ALERT: could not auto-refund orphaned payment on ${bookingId}. MANUAL REFUND REQUIRED.`,
      error
    );
    await logEvent(
      bookingId,
      "orphaned_payment_refund_failed",
      {
        session: session.id,
        amount,
        error: error instanceof Error ? error.message : String(error),
      },
      "system"
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook: the only thing that turns a held slot into a real booking.
 *
 * Rules this endpoint follows, all of them learned the hard way by people who
 * did not:
 *
 *  - Verify the signature against the RAW body. Next parses JSON eagerly, so
 *    `request.text()` must be read first and never `request.json()`.
 *  - Trust only the event Stripe sent us, never anything from the browser.
 *  - Be idempotent. Stripe retries on any non-2xx, and delivers at least once,
 *    so the same event will arrive twice. confirm_booking() handles that.
 *  - Return 200 for events we do not care about, or Stripe will retry forever.
 *  - Return 200 even if a side effect failed, provided the booking itself was
 *    recorded. Retrying the whole webhook to fix an email is the wrong lever.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(rawBody, signature);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[stripe-webhook] signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Unpaid sessions can complete when the payment is still processing.
        if (session.payment_status !== "paid") {
          console.warn(
            `[stripe-webhook] session ${session.id} completed but payment_status is ${session.payment_status}`
          );
          break;
        }

        const bookingId =
          session.client_reference_id ?? session.metadata?.bookingId ?? null;

        if (!bookingId) {
          console.error(`[stripe-webhook] session ${session.id} carries no booking id`);
          break;
        }

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null);

        const { data, error } = await supabaseAdmin().rpc("confirm_booking", {
          p_booking_id: bookingId,
          p_stripe_session_id: session.id,
          p_payment_intent_id: paymentIntentId,
          p_paid: true,
        });

        if (error) {
          // A booking that can never be confirmed (already cancelled, or
          // expired while the customer was paying) is a PERMANENT failure.
          // Returning 500 would make Stripe retry for three days and fail
          // identically every time, leaving money captured and nobody told.
          // Refund it, shout about it, and acknowledge the event.
          if (error.message.includes("BOOKING_NOT_CONFIRMABLE")) {
            console.error(
              `[stripe-webhook] ALERT: paid for booking ${bookingId} that cannot be confirmed (${error.message}). Auto-refunding.`
            );
            await autoRefundOrphanedPayment(bookingId, paymentIntentId, session);
            break;
          }

          // Anything else may be transient, so let Stripe retry.
          console.error(`[stripe-webhook] confirm_booking failed for ${bookingId}:`, error);
          return NextResponse.json({ error: "Could not confirm booking" }, { status: 500 });
        }

        // confirm_booking reports whether THIS call did the transition. Stripe
        // delivers at least once and retries, so without this gate the
        // customer receives a fresh confirmation email per delivery.
        const result = Array.isArray(data) ? data[0] : data;
        if (result?.transitioned) {
          await confirmBookingSideEffects(bookingId);
        } else {
          console.log(
            `[stripe-webhook] ${bookingId} was already confirmed; skipping duplicate side effects`
          );
        }
        break;
      }

      // Non-card methods (SEPA, Bancontact, iDEAL) settle after the session
      // completes. Without this the money lands and the booking is never
      // confirmed, which is a silent, total failure for that customer.
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId =
          session.client_reference_id ?? session.metadata?.bookingId ?? null;
        if (!bookingId) break;

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null);

        const { data, error } = await supabaseAdmin().rpc("confirm_booking", {
          p_booking_id: bookingId,
          p_stripe_session_id: session.id,
          p_payment_intent_id: paymentIntentId,
          p_paid: true,
        });

        if (error) {
          if (error.message.includes("BOOKING_NOT_CONFIRMABLE")) {
            await autoRefundOrphanedPayment(bookingId, paymentIntentId, session);
            break;
          }
          return NextResponse.json({ error: "Could not confirm booking" }, { status: 500 });
        }

        const result = Array.isArray(data) ? data[0] : data;
        if (result?.transitioned) await confirmBookingSideEffects(bookingId);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId =
          session.client_reference_id ?? session.metadata?.bookingId ?? null;
        if (!bookingId) break;

        await supabaseAdmin()
          .from("bookings")
          .update({ status: "expired", expires_at: null })
          .eq("id", bookingId)
          .in("status", ["held", "pending"]);

        await logEvent(bookingId, "async_payment_failed", { session: session.id });
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId =
          session.client_reference_id ?? session.metadata?.bookingId ?? null;
        if (!bookingId) break;

        // Release the slot straight away rather than waiting for the sweeper.
        await supabaseAdmin()
          .from("bookings")
          .update({ status: "expired", expires_at: null })
          .eq("id", bookingId)
          .in("status", ["held", "pending"]);

        await logEvent(bookingId, "checkout_expired", { session: session.id });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        // Metadata is set on the PaymentIntent, and whether Stripe copies it
        // onto the Charge is version-dependent. Fall back to looking the
        // booking up by payment intent so a dashboard-issued refund is never
        // silently dropped.
        let bookingId: string | null = charge.metadata?.bookingId ?? null;

        if (!bookingId && charge.payment_intent) {
          const intentId =
            typeof charge.payment_intent === "string"
              ? charge.payment_intent
              : charge.payment_intent.id;

          const { data } = await supabaseAdmin()
            .from("bookings")
            .select("id")
            .eq("stripe_payment_intent_id", intentId)
            .maybeSingle();

          bookingId = (data?.id as string | undefined) ?? null;
        }

        if (!bookingId) {
          console.error(`[stripe-webhook] refund ${charge.id} could not be matched to a booking`);
          break;
        }

        await supabaseAdmin()
          .from("bookings")
          .update({
            refunded_at: new Date().toISOString(),
            refund_cents: charge.amount_refunded,
          })
          .eq("id", bookingId);

        // A refund issued from the Stripe dashboard must also free the slot,
        // otherwise the money is back but the lesson is still on the books.
        if (charge.refunded) {
          const { data: booking } = await supabaseAdmin()
            .from("bookings")
            .select("status")
            .eq("id", bookingId)
            .maybeSingle();

          if (booking && ["held", "pending", "confirmed"].includes(booking.status as string)) {
            await supabaseAdmin().rpc("cancel_booking", {
              p_booking_id: bookingId,
              p_actor: "system",
              p_reason: "Fully refunded in Stripe",
            });
            await cancelBookingSideEffects(bookingId, {
              cancelledBy: "instructor",
              refundedCents: charge.amount_refunded,
            });
          }
        }

        await logEvent(bookingId, "refunded", { amount: charge.amount_refunded }, "stripe");
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        console.error(`[stripe-webhook] DISPUTE opened: ${dispute.id}`);
        break;
      }

      default:
        // Acknowledged and ignored on purpose.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe-webhook] handler threw:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
