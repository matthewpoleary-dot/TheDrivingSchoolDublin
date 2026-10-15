// app/api/webhooks/stripe/route.ts
// Raw body must be read before any JSON parsing — that's why we use req.text()
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase-server";
import { emailOnBooking, emailOnEdtPackageCreated } from "@/lib/email";
import { createCalendarEvent } from "@/lib/google-calendar";
import { dublinLocalToUtcISO } from "@/lib/time";
import { addYears, format } from "date-fns";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

// Next.js App Router: disable body parsing for this route
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e: unknown) {
    console.error("[stripe-webhook] signature verification failed:", e);
    return NextResponse.json(
      { error: `Webhook signature invalid: ${e instanceof Error ? e.message : "unknown"}` },
      { status: 400 }
    );
  }

  // Idempotency: skip already-processed events
  const { error: insertErr } = await supabaseServer
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });
  if (insertErr?.code === "23505") {
    console.log("[stripe-webhook] duplicate event, skipping:", event.id);
    return NextResponse.json({ received: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } else if (event.type === "checkout.session.expired") {
      await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
    } else if (event.type === "payment_intent.payment_failed") {
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
    } else if (event.type === "charge.refunded") {
      await handleChargeRefunded(event.data.object as Stripe.Charge);
    }
  } catch (e: unknown) {
    console.error("[stripe-webhook] handler error:", e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.booking_id;
  const serviceType = session.metadata?.service_type;
  const slotId = session.metadata?.slot_id || null;

  if (!bookingId) {
    console.error("[stripe-webhook] No booking_id in session metadata");
    return;
  }

  // Mark booking as paid
  const { data: booking, error: updateErr } = await supabaseServer
    .from("bookings")
    .update({
      payment_status: "paid",
      stripe_payment_intent: session.payment_intent as string,
    })
    .eq("id", bookingId)
    .select()
    .single();

  if (updateErr || !booking) {
    console.error("[stripe-webhook] failed to update booking:", updateErr);
    return;
  }

  // Lock the slot and release the hold (single-lesson bookings only)
  const isEdtPackage =
    serviceType === "edt-bundle" ||
    serviceType === "edt-6" ||
    serviceType === "edt-split";

  if (slotId && !isEdtPackage) {
    await supabaseServer
      .from("availability_slots")
      .update({
        is_booked: true,
        booking_id: bookingId,
        held_until: null,
        held_by_booking: null,
      })
      .eq("id", slotId);
  }

  // Handle EDT split-payment second instalment
  if (serviceType === "edt-split-2") {
    const packageId = session.metadata?.edt_package_id;
    if (packageId) {
      const { error: splitErr } = await supabaseServer
        .from("edt_packages")
        .update({
          lessons_total: 12,
          second_instalment_paid: true,
          second_instalment_booking_id: bookingId,
        })
        .eq("id", packageId)
        .eq("second_instalment_paid", false); // idempotency guard
      if (splitErr) {
        console.error("[stripe-webhook] failed to update edt_package for split-2:", splitErr);
      }
    }
    return;
  }

  // For EDT packages: create the package record
  if (isEdtPackage) {
    const lessonsTotal = serviceType === "edt-bundle" ? 12 : 6;
    const expiresAt = format(addYears(new Date(), 1), "yyyy-MM-dd");
    const packageType = serviceType === "edt-split" ? "split" : "standard";

    const { data: pkg, error: pkgErr } = await supabaseServer
      .from("edt_packages")
      .insert({
        booking_id: bookingId,
        customer_email: booking.customer_email,
        customer_name: booking.customer_name,
        lessons_total: lessonsTotal,
        lessons_used: 0,
        expires_at: expiresAt,
        package_type: packageType,
      })
      .select()
      .single();

    if (pkgErr || !pkg) {
      console.error("[stripe-webhook] failed to create edt_package:", pkgErr);
      return;
    }

    await supabaseServer
      .from("bookings")
      .update({ edt_package_id: pkg.id })
      .eq("id", bookingId);

    try {
      await emailOnEdtPackageCreated({
        packageId: pkg.id,
        accessToken: pkg.access_token,
        lessonsTotal,
        expiresAt,
        customer: { name: booking.customer_name, email: booking.customer_email },
      });
    } catch (e) {
      console.error("[stripe-webhook] email failed for EDT package:", e);
    }
    return;
  }

  // Fetch slot details for confirmation email and Google Calendar
  let slotInfo: { date: string; start_time: string; end_time: string } | null = null;
  if (slotId) {
    const { data: slot } = await supabaseServer
      .from("availability_slots")
      .select("date, start_time, end_time")
      .eq("id", slotId)
      .single();
    slotInfo = slot;
  }

  const startsLocal = slotInfo
    ? `${slotInfo.date}T${slotInfo.start_time}`
    : new Date().toISOString().slice(0, 19);
  const endsLocal = slotInfo
    ? `${slotInfo.date}T${slotInfo.end_time}`
    : startsLocal;

  const startsAtISO = slotInfo
    ? dublinLocalToUtcISO(slotInfo.date, slotInfo.start_time)
    : new Date().toISOString();

  // Idempotency guard: skip if calendar event already created
  if (!booking.google_calendar_event_id) {
    const serviceLabel: Record<string, string> = {
      standard: "Standard Lesson",
      "pre-test": "Pre-Test Lesson",
      refresher: "Refresher Lesson",
      "edt-6": "EDT 6-Lesson Package",
      "car-hire": "Car Hire",
      "car-hire-centre": "Car Hire (test centre)",
      "car-hire-local": "Car Hire (local pickup)",
      "car-hire-lesson": "Car Hire + Pre-Test Lesson",
    };

    let pickupArea: string | undefined;
    let cleanedNotes: string | undefined;
    if (booking.notes) {
      const match = booking.notes.match(/^Pickup area:\s*([^.]+)\.\s*(.*)$/);
      if (match) {
        pickupArea = `Dublin ${match[1].replace(/^D/, "")}`;
        cleanedNotes = match[2].trim() || undefined;
      } else {
        cleanedNotes = booking.notes;
      }
    }

    try {
      const gcalEventId = await createCalendarEvent({
        title: `${serviceLabel[serviceType ?? ""] ?? serviceType} — ${booking.customer_name}`,
        description: [
          `Customer: ${booking.customer_name}`,
          `Phone: ${booking.customer_phone}`,
          `Email: ${booking.customer_email}`,
          pickupArea ? `Pick-up: ${pickupArea}` : null,
          cleanedNotes ? `Notes: ${cleanedNotes}` : null,
          "",
          `Booking ID: ${bookingId}`,
        ].filter(Boolean).join("\n"),
        location: pickupArea,
        startISO: startsLocal,
        endISO: endsLocal,
      });

      if (gcalEventId) {
        await supabaseServer
          .from("bookings")
          .update({ google_calendar_event_id: gcalEventId })
          .eq("id", bookingId);
      }
    } catch (e) {
      console.error("[stripe-webhook] calendar create failed for booking", bookingId, e);
    }
  }

  try {
    await emailOnBooking({
      bookingId,
      serviceName: serviceType ?? "Lesson",
      priceCents: booking.amount_pence,
      startsAtISO,
      client: {
        name: booking.customer_name,
        email: booking.customer_email,
        phone: booking.customer_phone,
      },
    });
  } catch (e) {
    console.error("[stripe-webhook] email failed for booking", bookingId, e);
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  // Find pending booking by stripe_session_id
  const { data: booking } = await supabaseServer
    .from("bookings")
    .select("id, slot_id, payment_status")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (!booking || booking.payment_status !== "pending") return;

  // Cancel the booking
  await supabaseServer
    .from("bookings")
    .update({ payment_status: "cancelled" })
    .eq("id", booking.id)
    .eq("payment_status", "pending"); // guard against concurrent updates

  // Release the slot hold
  if (booking.slot_id) {
    await supabaseServer
      .from("availability_slots")
      .update({ held_until: null, held_by_booking: null })
      .eq("id", booking.slot_id)
      .eq("is_booked", false); // never un-hold a slot that completed payment
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.booking_id;
  if (!bookingId) {
    console.warn("[stripe-webhook] payment_failed: no booking_id in metadata, skipping");
    return;
  }
  // Don't release the slot — customer may retry payment in same Stripe session.
  // Slot cleanup happens in checkout.session.expired.
  await supabaseServer
    .from("bookings")
    .update({ payment_status: "failed" })
    .eq("id", bookingId)
    .eq("payment_status", "pending"); // only update if still pending
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  // Sync DB when a refund is issued directly via the Stripe Dashboard
  const paymentIntentId = typeof charge.payment_intent === "string"
    ? charge.payment_intent
    : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  const { data: booking } = await supabaseServer
    .from("bookings")
    .select("id, slot_id, payment_status")
    .eq("stripe_payment_intent", paymentIntentId)
    .maybeSingle();

  if (!booking || booking.payment_status === "refunded") return;

  await supabaseServer
    .from("bookings")
    .update({ payment_status: "refunded" })
    .eq("id", booking.id);

  // Free the slot
  if (booking.slot_id) {
    await supabaseServer
      .from("availability_slots")
      .update({ is_booked: false, booking_id: null })
      .eq("id", booking.slot_id);
  }
}
