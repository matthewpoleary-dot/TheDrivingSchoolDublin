import Stripe from "stripe";
import { createCalBooking } from "@/lib/cal/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!stripeSecret || !webhookSecret || !signature) {
    return new Response("Webhook is not configured", { status: 400 });
  }

  const stripe = new Stripe(stripeSecret);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type !== "payment_intent.succeeded") {
    return new Response("ok");
  }

  const supabase = getSupabaseAdmin();
  const paymentIntent = event.data.object;
  const bookingIntentId = paymentIntent.metadata.bookingIntentId;
  if (!bookingIntentId) {
    return new Response("Missing booking reference", { status: 400 });
  }

  const { data: seen } = await supabase
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (seen) return new Response("ok");

  const { data: booking, error: bookingError } = await supabase
    .from("booking_intents")
    .select("*")
    .eq("id", bookingIntentId)
    .single();

  if (bookingError || !booking) return new Response("Booking not found", { status: 404 });
  if (booking.status === "confirmed") {
    await supabase.from("stripe_webhook_events").insert({ id: event.id });
    return new Response("ok");
  }

  if (
    booking.stripe_payment_intent_id !== paymentIntent.id ||
    paymentIntent.currency !== "eur" ||
    paymentIntent.amount_received !== booking.payable_now_cents
  ) {
    await supabase
      .from("booking_intents")
      .update({
        status: "manual_review",
        failure_reason: "Stripe payment did not match the booking intent",
      })
      .eq("id", bookingIntentId);
    await supabase.from("stripe_webhook_events").insert({ id: event.id });
    return new Response("ok");
  }

  const { data: claimed, error: claimError } = await supabase
    .from("booking_intents")
    .update({ status: "confirming", paid_at: new Date().toISOString() })
    .eq("id", bookingIntentId)
    .eq("status", "pending_payment")
    .select("id")
    .maybeSingle();

  if (claimError) return new Response("Could not claim booking", { status: 500 });
  if (!claimed) return new Response("ok");

  try {
    const calBooking = await createCalBooking({
      eventTypeId: booking.cal_event_type_id,
      slotStart: booking.slot_start,
      durationMinutes: booking.duration_minutes,
      name: booking.customer_name,
      email: booking.customer_email,
      phone: booking.customer_phone,
      pickupAddress: booking.pickup_address,
      eircode: booking.eircode,
      carChoice: booking.car_choice,
      paymentChoice: booking.payment_choice,
      outstandingCashCents: booking.outstanding_cash_cents,
      bookingIntentId,
      stripePaymentIntentId: paymentIntent.id,
    });

    await supabase
      .from("booking_intents")
      .update({ status: "confirmed", cal_booking_uid: calBooking.data.uid })
      .eq("id", bookingIntentId);
    await supabase.from("stripe_webhook_events").insert({ id: event.id });
  } catch (error) {
    await supabase
      .from("booking_intents")
      .update({ status: "manual_review", failure_reason: error instanceof Error ? error.message : "Unknown fulfilment error" })
      .eq("id", bookingIntentId);
    await supabase.from("stripe_webhook_events").insert({ id: event.id });
    return new Response("ok");
  }

  return new Response("ok");
}
