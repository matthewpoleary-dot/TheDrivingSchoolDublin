// app/api/webhooks/stripe/route.ts
// Raw body must be read before any JSON parsing — that's why we use req.text()
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase-server";
import { emailOnBooking, emailOnEdtPackageCreated } from "@/lib/email";
import { createCalendarEvent } from "@/lib/google-calendar";
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

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } else if (event.type === "payment_intent.payment_failed") {
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
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

  // Lock the slot (single-lesson bookings)
  if (slotId && serviceType !== "edt-bundle" && serviceType !== "edt-6") {
    await supabaseServer
      .from("availability_slots")
      .update({ is_booked: true, booking_id: bookingId })
      .eq("id", slotId);
  }

  // For EDT bundle: create the package record
  if (serviceType === "edt-bundle" || serviceType === "edt-6") {
    const lessonsTotal = serviceType === "edt-bundle" ? 12 : 6;
    const expiresAt = format(addYears(new Date(), 1), "yyyy-MM-dd");

    const { data: pkg, error: pkgErr } = await supabaseServer
      .from("edt_packages")
      .insert({
        booking_id: bookingId,
        customer_email: booking.customer_email,
        customer_name: booking.customer_name,
        lessons_total: lessonsTotal,
        lessons_used: 0,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (pkgErr || !pkg) {
      console.error("[stripe-webhook] failed to create edt_package:", pkgErr);
      return;
    }

    // Link package back to booking
    await supabaseServer
      .from("bookings")
      .update({ edt_package_id: pkg.id })
      .eq("id", bookingId);

    // Send EDT package email with booking link
    await emailOnEdtPackageCreated({
      packageId: pkg.id,
      accessToken: pkg.access_token,
      lessonsTotal,
      expiresAt,
      customer: { name: booking.customer_name, email: booking.customer_email },
    });
    return;
  }

  // Fetch slot details for the confirmation email and Google Calendar
  let slotInfo: { date: string; start_time: string; end_time: string } | null = null;
  if (slotId) {
    const { data: slot } = await supabaseServer
      .from("availability_slots")
      .select("date, start_time, end_time")
      .eq("id", slotId)
      .single();
    slotInfo = slot;
  }

  const startsAtISO = slotInfo
    ? `${slotInfo.date}T${slotInfo.start_time}+01:00`
    : new Date().toISOString();

  const endsAtISO = slotInfo
    ? `${slotInfo.date}T${slotInfo.end_time}+01:00`
    : startsAtISO;

  // Create Google Calendar event (silently skipped if not configured)
  const serviceLabel: Record<string, string> = {
    standard: "Standard Lesson",
    "pre-test": "Pre-Test Lesson",
    refresher: "Refresher Lesson",
    "edt-6": "EDT 6-Lesson Package",
    "car-hire": "Car Hire",
  };
  const gcalEventId = await createCalendarEvent({
    title: `${serviceLabel[serviceType ?? ""] ?? serviceType} — ${booking.customer_name}`,
    description: [
      `Phone: ${booking.customer_phone}`,
      `Email: ${booking.customer_email}`,
      booking.notes ? `Notes: ${booking.notes}` : "",
      `Booking ID: ${bookingId}`,
    ].filter(Boolean).join("\n"),
    startISO: startsAtISO,
    endISO: endsAtISO,
  });

  if (gcalEventId) {
    await supabaseServer
      .from("bookings")
      .update({ google_calendar_event_id: gcalEventId })
      .eq("id", bookingId);
  }

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
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Find the booking via the Stripe session that references this payment intent
  // The payment_intent id is stored after completion; on failure we find via session
  await supabaseServer
    .from("bookings")
    .update({ payment_status: "failed" })
    .eq("stripe_payment_intent", paymentIntent.id);
}
