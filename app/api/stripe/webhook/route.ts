import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { constructWebhookEvent } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { confirmBookingSideEffects, logEvent } from "@/lib/booking-service";

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

        const { error } = await supabaseAdmin().rpc("confirm_booking", {
          p_booking_id: bookingId,
          p_stripe_session_id: session.id,
          p_payment_intent_id: paymentIntentId,
          p_paid: true,
        });

        if (error) {
          // A 500 here makes Stripe retry, which is what we want: the payment
          // is real and the booking must eventually be confirmed.
          console.error(`[stripe-webhook] confirm_booking failed for ${bookingId}:`, error);
          return NextResponse.json({ error: "Could not confirm booking" }, { status: 500 });
        }

        // Side effects are best-effort and must not trigger a Stripe retry.
        await confirmBookingSideEffects(bookingId);
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
        const bookingId = charge.metadata?.bookingId;
        if (!bookingId) break;

        await supabaseAdmin()
          .from("bookings")
          .update({
            refunded_at: new Date().toISOString(),
            refund_cents: charge.amount_refunded,
          })
          .eq("id", bookingId);

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
