import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { isSlotStillAvailable } from "@/lib/availability";
import { getCalendarBusy } from "@/lib/google-calendar";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { confirmBookingSideEffects } from "@/lib/booking-service";
import { BOOKING_POLICY, lessonTypeBySlug } from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/auth";
import { TIMEZONE, addMinutes, formatDateTimeInZone } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Create a booking.
 *
 * The sequence matters:
 *   1. Validate, including a re-check that the slot is genuinely still open.
 *   2. Take the hold. The database's exclusion constraint is what actually
 *      decides who wins a race, not this code.
 *   3. Only then open Stripe. If Checkout creation fails, the hold expires on
 *      its own and the slot comes back.
 *
 * Deliberately NOT done here: sending emails or writing to Google Calendar.
 * Those happen once the money is confirmed, in the webhook, so an abandoned
 * checkout never puts a phantom lesson on the instructor's calendar.
 */

const bookingSchema = z.object({
  service: z.string().min(1).max(64),
  startsAt: z.string().datetime({ message: "startsAt must be an ISO instant" }),
  name: z.string().trim().min(2, "Please give your full name").max(120),
  email: z.string().trim().toLowerCase().email("That email does not look right").max(200),
  phone: z
    .string()
    .trim()
    .min(7, "Please give a phone number we can reach you on")
    .max(30)
    .regex(/^[\d\s+()-]+$/, "Phone can only contain digits, spaces and + ( ) -"),
  pickupAddress: z.string().trim().max(300).optional().or(z.literal("")),
  testCentre: z.string().trim().max(120).optional().or(z.literal("")),
  transmission: z.enum(["manual", "automatic"]).optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  paymentOption: z.enum(["deposit", "full"]).default("deposit"),
  /**
   * Honeypot. Must accept ANY value: validating it to empty makes the field
   * fail schema validation, which both names the honeypot in the 400 response
   * and makes the "silently accept" branch below unreachable.
   */
  website: z.string().optional(),
});

export async function POST(request: Request) {
  const ip = clientIp(request);

  if (rateLimit(`book:${ip}`, { limit: 6 })) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a minute and try again." },
      { status: 429 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Online booking is not available right now. Please ring or WhatsApp us." },
      { status: 503 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the form",
        fields: Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.join("."), i.message])
        ),
      },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // Silently accept the honeypot so a bot learns nothing.
  if (input.website) {
    return NextResponse.json({ ok: true, redirectUrl: "/book?submitted=1" }, { status: 200 });
  }

  const lesson = lessonTypeBySlug(input.service);
  if (!lesson?.bookable) {
    return NextResponse.json({ error: "That lesson is not bookable online" }, { status: 400 });
  }

  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
  }

  if (lesson.needsPickup && (!input.pickupAddress || input.pickupAddress.length < 8)) {
    return NextResponse.json(
      {
        error: "Please check the form",
        fields: { pickupAddress: "Please enter the full pick-up address" },
      },
      { status: 400 }
    );
  }

  try {
    // Re-check against live data. The page may have been open for an hour.
    const calendarBusy = await getCalendarBusy(
      addMinutes(startsAt, -180),
      addMinutes(startsAt, 300)
    );

    const stillFree = await isSlotStillAvailable({
      serviceSlug: input.service,
      startsAt,
      calendarBusy,
    });

    if (!stillFree) {
      return NextResponse.json(
        {
          error: "SLOT_TAKEN",
          message: "Sorry, that time has just gone. Pick another and we will hold it for you.",
        },
        { status: 409 }
      );
    }

    // The hold. Postgres decides the winner here.
    const { data, error } = await supabaseAdmin().rpc("hold_slot", {
      p_service_slug: input.service,
      p_starts_at: startsAt.toISOString(),
      p_customer_name: input.name,
      p_customer_email: input.email,
      p_customer_phone: input.phone,
      p_pickup_address: input.pickupAddress || null,
      p_test_centre: input.testCentre || null,
      p_transmission: input.transmission ?? null,
      p_notes: input.notes || null,
      p_hold_minutes: BOOKING_POLICY.holdMinutes,
    });

    if (error) {
      if (error.message.includes("SLOT_TAKEN")) {
        return NextResponse.json(
          {
            error: "SLOT_TAKEN",
            message: "Sorry, someone booked that time a moment ago. Please pick another.",
          },
          { status: 409 }
        );
      }
      if (error.message.includes("SLOT_IN_PAST")) {
        return NextResponse.json({ error: "That time has already passed" }, { status: 400 });
      }
      console.error("[bookings] hold_slot failed:", error);
      return NextResponse.json({ error: "Could not hold that slot" }, { status: 500 });
    }

    const booking = Array.isArray(data) ? data[0] : data;
    if (!booking) {
      return NextResponse.json({ error: "Could not hold that slot" }, { status: 500 });
    }

    // No Stripe configured: confirm immediately and treat the whole price as
    // pay-on-the-day. This path is useful in local development and must not
    // make the dashboard claim that an unpaid deposit was received.
    if (!isStripeConfigured() || booking.deposit_cents === 0) {
      await supabaseAdmin().from("bookings").update({ deposit_cents: 0 }).eq("id", booking.id);
      const { data: confirmData } = await supabaseAdmin().rpc("confirm_booking", {
        p_booking_id: booking.id,
        p_paid: false,
      });

      // Only the caller that actually performed the transition sends email.
      const confirmed = Array.isArray(confirmData) ? confirmData[0] : confirmData;
      if (confirmed?.transitioned) {
        await confirmBookingSideEffects(booking.id);
      }

      return NextResponse.json({
        ok: true,
        reference: booking.reference,
        redirectUrl: `/booking/${booking.manage_token}`,
      });
    }

    const paymentCents =
      input.paymentOption === "full" ? booking.price_cents : booking.deposit_cents;

    if (paymentCents !== booking.deposit_cents) {
      const { error: paymentUpdateError } = await supabaseAdmin()
        .from("bookings")
        .update({ deposit_cents: paymentCents })
        .eq("id", booking.id);

      if (paymentUpdateError) {
        console.error("[bookings] could not store payment choice:", paymentUpdateError);
        return NextResponse.json({ error: "Could not prepare payment" }, { status: 500 });
      }
    }

    const checkout = await createCheckoutSession({
      bookingId: booking.id,
      reference: booking.reference,
      serviceName: lesson.name,
      paymentCents,
      paymentOption: input.paymentOption,
      totalCents: booking.price_cents,
      customerEmail: input.email,
      startsAtISO: startsAt.toISOString(),
      whenLine: formatDateTimeInZone(startsAt, TIMEZONE),
      manageToken: booking.manage_token,
    });

    await supabaseAdmin()
      .from("bookings")
      .update({ stripe_session_id: checkout.sessionId, status: "pending" })
      .eq("id", booking.id);

    return NextResponse.json({
      ok: true,
      reference: booking.reference,
      redirectUrl: checkout.url,
    });
  } catch (error) {
    console.error("[bookings] unexpected failure:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please ring or WhatsApp us and we will sort it." },
      { status: 500 }
    );
  }
}
