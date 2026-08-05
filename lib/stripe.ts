/**
 * Stripe: deposits, full payments, refunds and webhook verification.
 *
 * Customers can pay a fixed deposit and the balance on the day, or settle the
 * full lesson price at booking.
 *
 * Two things are load-bearing:
 *
 *  * The booking id travels in the Checkout Session's `client_reference_id`
 *    AND in metadata. The webhook trusts the session it fetched from Stripe,
 *    never anything posted by the browser.
 *
 *  * Every mutating call carries an idempotency key derived from the booking,
 *    so a retried webhook or a double-clicked button cannot charge or refund
 *    twice.
 */

import Stripe from "stripe";
import { BOOKING_POLICY, SITE, formatEuro } from "@/lib/config";

let cached: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe(): Stripe {
  if (!cached) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set. See docs/SETUP.md.");
    cached = new Stripe(key, {
      // Pinned deliberately. Stripe changes response shapes between versions,
      // and an unpinned client turns a Stripe release into an outage here.
      apiVersion: "2025-07-30.basil",
      typescript: true,
      maxNetworkRetries: 2,
      timeout: 15_000,
    });
  }
  return cached;
}

export type CheckoutInput = {
  bookingId: string;
  reference: string;
  serviceName: string;
  paymentCents: number;
  paymentOption: "deposit" | "full";
  totalCents: number;
  customerEmail: string;
  startsAtISO: string;
  whenLine: string;
  manageToken: string;
};

export async function createCheckoutSession(
  input: CheckoutInput
): Promise<{ url: string; sessionId: string }> {
  const balance = input.totalCents - input.paymentCents;
  const paymentLabel = input.paymentOption === "full" ? "full payment" : "deposit";

  const session = await stripe().checkout.sessions.create(
    {
      mode: "payment",
      // Reference travels two ways so the webhook can recover it either way.
      client_reference_id: input.bookingId,
      customer_email: input.customerEmail,
      metadata: {
        bookingId: input.bookingId,
        reference: input.reference,
        startsAt: input.startsAtISO,
      },
      payment_intent_data: {
        description: `${input.serviceName} ${paymentLabel} — ${input.reference}`,
        metadata: { bookingId: input.bookingId, reference: input.reference },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: input.paymentCents,
            product_data: {
              name: `${input.serviceName} — ${paymentLabel}`,
              description:
                balance > 0
                  ? `${input.whenLine}. Balance of ${formatEuro(
                      balance
                    )} paid to your instructor on the day.`
                  : input.whenLine,
            },
          },
        },
      ],
      // The hold expires; give the customer a little less than that to pay, so
      // the slot is never released while Stripe still thinks the session is live.
      expires_at:
        Math.floor(Date.now() / 1000) + Math.max(30, BOOKING_POLICY.holdMinutes - 1) * 60,
      success_url: `${SITE.url}/booking/${input.manageToken}?paid=1`,
      cancel_url: `${SITE.url}/book?cancelled=${encodeURIComponent(input.reference)}`,
      // Irish consumer law: the cancellation terms must be visible before pay.
      custom_text: {
        submit: {
          message: `Free cancellation up to ${BOOKING_POLICY.freeCancellationHours} hours before your lesson.`,
        },
      },
    },
    { idempotencyKey: `checkout:${input.bookingId}` }
  );

  if (!session.url) throw new Error("Stripe returned a session with no URL");
  return { url: session.url, sessionId: session.id };
}

/** Verify and parse a webhook. Throws if the signature does not check out. */
export function constructWebhookEvent(payload: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set. See docs/SETUP.md.");
  return stripe().webhooks.constructEvent(payload, signature, secret);
}

/**
 * Refund a deposit. Returns the refunded amount, or null when there is nothing
 * to refund (unpaid booking, or already refunded).
 */
export async function refundDeposit(options: {
  bookingId: string;
  paymentIntentId: string | null;
  amountCents: number;
  reason?: "requested_by_customer" | "duplicate";
}): Promise<number | null> {
  if (!options.paymentIntentId || options.amountCents <= 0) return null;

  try {
    const refund = await stripe().refunds.create(
      {
        payment_intent: options.paymentIntentId,
        amount: options.amountCents,
        reason: options.reason ?? "requested_by_customer",
        metadata: { bookingId: options.bookingId },
      },
      { idempotencyKey: `refund:${options.bookingId}` }
    );
    return refund.amount;
  } catch (error) {
    // charge_already_refunded is a success from our point of view.
    if (
      error instanceof Stripe.errors.StripeInvalidRequestError &&
      error.code === "charge_already_refunded"
    ) {
      return options.amountCents;
    }
    throw error;
  }
}
