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

  // Lock the slot (single-lesson bookings). All EDT variants are package-based, no slot.
  const isEdtPackage =
    serviceType === "edt-bundle" ||
    serviceType === "edt-6" ||
    serviceType === "edt-split";

  if (slotId && !isEdtPackage) {
    await supabaseServer
      .from("availability_slots")
      .update({ is_booked: true, booking_id: bookingId })
      .eq("id", slotId);
  }

  // For EDT packages: create the package record
  if (isEdtPackage) {
    // edt-bundle = 12, edt-6 / edt-split = 6 lessons in this package
    // (edt-split charges a second €475 later for lessons 7-12, handled manually for now)
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

  // Local-time ISO strings (no UTC offset). Google's timeZone: "Europe/Dublin"
  // interprets them correctly across DST. Hardcoding "+01:00" used to break
  // winter bookings by an hour.
  const startsLocal = slotInfo
    ? `${slotInfo.date}T${slotInfo.start_time}`
    : new Date().toISOString().slice(0, 19);
  const endsLocal = slotInfo
    ? `${slotInfo.date}T${slotInfo.end_time}`
    : startsLocal;

  // ISO with offset for the customer-facing confirmation email, recomputed
  // per-booking so DST flips correctly.
  const startsAtISO = slotInfo
    ? new Date(`${slotInfo.date}T${slotInfo.start_time}`).toISOString()
    : new Date().toISOString();

  // Idempotency guard: Stripe can replay the webhook. If we've already
  // attached a calendar event ID, skip the second create.
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

    // Pickup area is prepended to the notes field by the booking form
    // ("Pickup area: D6. <user notes>"). Extract it for the event location.
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
      // Failure isolation: calendar problems must not fail the webhook. The
      // booking is still valid even if the event doesn't land.
      console.error("[stripe-webhook] calendar create failed for booking", bookingId, e);
    }
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
