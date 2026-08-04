/**
 * Side effects for a booking: calendar and email.
 *
 * Split out from the routes because both the Stripe webhook and the admin
 * screen need exactly the same behaviour, and because it is the one place
 * where the "never break the booking" rule has to be enforced.
 *
 * Nothing in here throws. A booking that is paid for and stored is a real
 * booking; Google or Resend having a bad day is an operational problem to
 * retry, not a reason to fail the customer. Every failure is written to
 * booking_events so the admin screen can show it and the reconcile cron can
 * pick it up.
 */

import { supabaseAdmin } from "@/lib/supabase";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  isCalendarConfigured,
} from "@/lib/google-calendar";
import {
  sendBookingConfirmation,
  sendInstructorNotification,
  sendCancellationEmails,
  type BookingEmailData,
} from "@/lib/email";
import { SITE } from "@/lib/config";

type BookingRow = {
  id: string;
  reference: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_address: string | null;
  test_centre: string | null;
  transmission: string | null;
  notes: string | null;
  starts_at: string;
  ends_at: string;
  price_cents: number;
  deposit_cents: number;
  manage_token: string;
  google_event_id: string | null;
  stripe_payment_intent_id: string | null;
  services?: { name: string } | { name: string }[] | null;
};

const BOOKING_COLUMNS =
  "id,reference,status,customer_name,customer_email,customer_phone,pickup_address,test_centre,transmission,notes,starts_at,ends_at,price_cents,deposit_cents,manage_token,google_event_id,stripe_payment_intent_id,services(name)";

function serviceName(row: BookingRow): string {
  const service = Array.isArray(row.services) ? row.services[0] : row.services;
  return service?.name ?? "Driving lesson";
}

function toEmailData(row: BookingRow): BookingEmailData {
  return {
    reference: row.reference,
    serviceName: serviceName(row),
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    pickupAddress: row.pickup_address,
    testCentre: row.test_centre,
    transmission: row.transmission,
    notes: row.notes,
    startsAt: new Date(row.starts_at),
    endsAt: new Date(row.ends_at),
    priceCents: row.price_cents,
    depositCents: row.deposit_cents,
    manageToken: row.manage_token,
  };
}

async function logEvent(
  bookingId: string,
  event: string,
  detail: Record<string, unknown> = {},
  actor = "system"
): Promise<void> {
  try {
    await supabaseAdmin()
      .from("booking_events")
      .insert({ booking_id: bookingId, event, detail, actor });
  } catch (error) {
    // Logging must never be the thing that breaks a booking either.
    console.error("[booking-service] could not write event log:", error);
  }
}

export async function loadBooking(bookingId: string): Promise<BookingRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select(BOOKING_COLUMNS)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    console.error("[booking-service] load failed:", error.message);
    return null;
  }
  return data as BookingRow | null;
}

export async function loadBookingByToken(token: string): Promise<BookingRow | null> {
  if (!token || token.length < 20) return null;

  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select(BOOKING_COLUMNS)
    .eq("manage_token", token)
    .maybeSingle();

  if (error) {
    console.error("[booking-service] load by token failed:", error.message);
    return null;
  }
  return data as BookingRow | null;
}

/**
 * Everything that should happen once a booking is genuinely confirmed.
 * Idempotent: safe to run twice, which matters because Stripe retries.
 */
export async function confirmBookingSideEffects(bookingId: string): Promise<void> {
  const booking = await loadBooking(bookingId);
  if (!booking) {
    console.error(`[booking-service] confirm side effects: ${bookingId} not found`);
    return;
  }

  const emailData = toEmailData(booking);

  // --- Calendar -------------------------------------------------------------
  if (isCalendarConfigured() && !booking.google_event_id) {
    const result = await createCalendarEvent({
      reference: booking.reference,
      serviceName: serviceName(booking),
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      customerPhone: booking.customer_phone,
      pickupAddress: booking.pickup_address,
      testCentre: booking.test_centre,
      transmission: booking.transmission,
      notes: booking.notes,
      startsAt: new Date(booking.starts_at),
      endsAt: new Date(booking.ends_at),
      manageUrl: `${SITE.url}/booking/${booking.manage_token}`,
    });

    if (result.ok) {
      await supabaseAdmin()
        .from("bookings")
        .update({ google_event_id: result.value, calendar_synced_at: new Date().toISOString() })
        .eq("id", bookingId);
      await logEvent(bookingId, "calendar_created", { eventId: result.value });
    } else {
      // Recorded, not thrown. The reconcile cron will try again.
      await logEvent(bookingId, "calendar_failed", {
        error: result.error,
        retryable: result.retryable,
      });
    }
  }

  // --- Email ----------------------------------------------------------------
  const [customerResult, instructorResult] = await Promise.all([
    sendBookingConfirmation(emailData),
    sendInstructorNotification(emailData),
  ]);

  if (!customerResult.ok) {
    await logEvent(bookingId, "email_failed", {
      to: "customer",
      error: customerResult.error,
    });
  }
  if (!instructorResult.ok) {
    await logEvent(bookingId, "email_failed", {
      to: "instructor",
      error: instructorResult.error,
    });
  }
}

/** Everything that should happen once a booking is cancelled. */
export async function cancelBookingSideEffects(
  bookingId: string,
  options: { cancelledBy: string; refundedCents: number | null }
): Promise<void> {
  const booking = await loadBooking(bookingId);
  if (!booking) return;

  if (booking.google_event_id) {
    const result = await deleteCalendarEvent(booking.google_event_id);
    if (result.ok) {
      await supabaseAdmin()
        .from("bookings")
        .update({ google_event_id: null, calendar_synced_at: new Date().toISOString() })
        .eq("id", bookingId);
      await logEvent(bookingId, "calendar_deleted", {});
    } else {
      await logEvent(bookingId, "calendar_delete_failed", { error: result.error });
    }
  }

  try {
    await sendCancellationEmails(toEmailData(booking), options);
  } catch (error) {
    await logEvent(bookingId, "email_failed", {
      to: "cancellation",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export { type BookingRow, serviceName, toEmailData, logEvent };
