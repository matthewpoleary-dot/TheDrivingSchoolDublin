import Stripe from "stripe";
import { addMinutes } from "date-fns";
import { bookingIntentSchema } from "@/lib/booking/schema";
import { calculateQuote, SERVICE_CATALOG } from "@/lib/booking/catalog";
import { getEventTypeId, reserveCalSlot } from "@/lib/cal/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const parsed = bookingIntentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Please check the booking details and try again." },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return Response.json(
        { error: "Secure payments are awaiting account setup." },
        { status: 503 },
      );
    }

    const service = SERVICE_CATALOG[input.serviceCode];
    const quote = calculateQuote(service, input.paymentChoice);
    const eventTypeId = getEventTypeId(input.serviceCode);
    const supabase = getSupabaseAdmin();
    const bookingIntentId = crypto.randomUUID();

    const reservation = await reserveCalSlot({
      serviceCode: input.serviceCode,
      slotStart: input.slotStart,
      durationMinutes: service.durationMinutes,
    });

    const { error: insertError } = await supabase.from("booking_intents").insert({
      id: bookingIntentId,
      service_code: input.serviceCode,
      cal_event_type_id: eventTypeId,
      slot_start: input.slotStart,
      slot_end: addMinutes(new Date(input.slotStart), service.durationMinutes).toISOString(),
      duration_minutes: service.durationMinutes,
      total_cents: quote.totalCents,
      payable_now_cents: quote.payableNowCents,
      outstanding_cash_cents: quote.outstandingCashCents,
      payment_choice: input.paymentChoice,
      customer_name: input.name,
      customer_email: input.email,
      customer_phone: input.phone,
      pickup_address: input.pickupAddress,
      eircode: input.eircode || null,
      car_choice: input.carChoice,
      cal_reservation_uid: reservation.data.reservationUid,
      reservation_expires_at: reservation.data.reservationUntil,
      status: "pending_payment",
    });

    if (insertError) throw insertError;

    const stripe = new Stripe(stripeSecret);
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: quote.payableNowCents,
        currency: "eur",
        automatic_payment_methods: { enabled: true },
        receipt_email: input.email,
        description: `${service.name} — The Driving School Dublin`,
        metadata: {
          bookingIntentId,
          serviceCode: input.serviceCode,
          paymentChoice: input.paymentChoice,
        },
      },
      { idempotencyKey: `booking-intent:${bookingIntentId}` },
    );

    const { error: updateError } = await supabase
      .from("booking_intents")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", bookingIntentId);
    if (updateError) throw updateError;

    return Response.json({
      bookingIntentId,
      clientSecret: paymentIntent.client_secret,
      reservationUntil: reservation.data.reservationUntil,
      quote,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare payment";
    const setupError = /not configured|Missing CAL_/i.test(message);
    return Response.json({ error: message }, { status: setupError ? 503 : 500 });
  }
}
