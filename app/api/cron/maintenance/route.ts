import { NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { verifyCronRequest } from "@/lib/auth";
import { createCalendarEvent, isCalendarConfigured } from "@/lib/google-calendar";
import { sendLessonReminder } from "@/lib/email";
import { toEmailData, serviceName, logEvent, type BookingRow } from "@/lib/booking-service";
import { SITE } from "@/lib/config";
import { addMinutes } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The self-healing job.
 *
 * Three things, each of which exists because the alternative is a silent
 * failure that nobody notices until a pupil is standing on a kerb:
 *
 *   1. Sweep expired holds and abandoned checkouts, releasing their slots.
 *   2. Retry calendar syncs that failed. Google being down for ten minutes
 *      should not permanently cost the instructor a diary entry.
 *   3. Send reminders, which is the cheapest no-show prevention there is.
 *
 * FREQUENCY-INDEPENDENT BY DESIGN. Vercel's Hobby plan only permits one cron
 * run per day, Pro permits hourly, and this must be correct on either. So
 * nothing here assumes a schedule:
 *
 *   - Reminders cover every confirmed lesson in the next 48 hours and are
 *     deduplicated by a `reminder_sent` event, rather than matching a narrow
 *     24-to-25-hour window that a daily run would mostly miss.
 *   - Hold expiry does not depend on this job at all: hold_slot() calls
 *     expire_stale_holds() at the head of every booking attempt, so a slot is
 *     always reclaimed on demand. This is the backstop, not the mechanism.
 *
 * Everything is idempotent, so running it twice, or ten times, is harmless.
 */
export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const report = {
    holdsExpired: 0,
    calendarRetried: 0,
    calendarStillFailing: 0,
    remindersSent: 0,
    remindersFailed: 0,
  };

  const db = supabaseAdmin();

  // --- 1. Expired holds -----------------------------------------------------
  try {
    const { data, error } = await db.rpc("expire_stale_holds");
    if (error) throw new Error(error.message);
    report.holdsExpired = Number(data ?? 0);
  } catch (error) {
    console.error("[cron] expire_stale_holds failed:", error);
  }

  // --- 2. Calendar reconciliation ------------------------------------------
  if (isCalendarConfigured()) {
    try {
      const { data } = await db
        .from("bookings")
        .select(
          "id,reference,status,customer_name,customer_email,customer_phone,pickup_address,test_centre,transmission,notes,starts_at,ends_at,price_cents,deposit_cents,manage_token,google_event_id,stripe_payment_intent_id,refunded_at,refund_cents,services(name)"
        )
        .eq("status", "confirmed")
        .is("google_event_id", null)
        .gte("starts_at", new Date().toISOString())
        .limit(25);

      for (const row of (data ?? []) as BookingRow[]) {
        const result = await createCalendarEvent({
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
          manageUrl: `${SITE.url}/booking/${row.manage_token}`,
        });

        if (result.ok) {
          await db
            .from("bookings")
            .update({
              google_event_id: result.value,
              calendar_synced_at: new Date().toISOString(),
            })
            .eq("id", row.id);
          await logEvent(row.id, "calendar_created_retry", { eventId: result.value });
          report.calendarRetried++;
        } else {
          report.calendarStillFailing++;
        }
      }
    } catch (error) {
      console.error("[cron] calendar reconcile failed:", error);
    }
  }

  // --- 3. Reminders ---------------------------------------------------------
  // A wide window plus deduplication, rather than a narrow window plus a
  // precise schedule. A daily cron would miss almost everything in a
  // 24-to-25-hour slice; this is correct whether it runs hourly or once a day.
  try {
    const now = new Date();
    const windowEnd = addMinutes(now, 48 * 60);

    const { data } = await db
      .from("bookings")
      .select(
        "id,reference,status,customer_name,customer_email,customer_phone,pickup_address,test_centre,transmission,notes,starts_at,ends_at,price_cents,deposit_cents,manage_token,google_event_id,stripe_payment_intent_id,refunded_at,refund_cents,services(name)"
      )
      .eq("status", "confirmed")
      .gte("starts_at", now.toISOString())
      .lt("starts_at", windowEnd.toISOString())
      // Soonest first, so if the cap is ever reached it drops the lessons with
      // the most time left rather than an arbitrary set.
      .order("starts_at", { ascending: true })
      .limit(100);

    for (const row of (data ?? []) as BookingRow[]) {
      // Claim the send BEFORE sending. A read-then-send-then-write would let
      // two overlapping runs both pass the read and both email the pupil,
      // which is a mistake already in the ledger from a previous project.
      // A partial unique index decides the winner; losers get false.
      const { data: claimed, error: claimError } = await db.rpc("claim_reminder", {
        p_booking_id: row.id,
      });

      if (claimError) {
        console.error(`[cron] could not claim reminder for ${row.reference}:`, claimError);
        continue;
      }
      if (!claimed) continue; // Already reminded, or another run won the race.

      const result = await sendLessonReminder(toEmailData(row));

      if (result.ok) {
        report.remindersSent++;
      } else {
        // Give the claim back so a later run can retry, otherwise one Resend
        // outage permanently consumes this pupil's only reminder.
        await db.rpc("release_reminder_claim", { p_booking_id: row.id });
        report.remindersFailed++;
      }
    }
  } catch (error) {
    console.error("[cron] reminders failed:", error);
  }

  console.log("[cron] maintenance report", report);
  return NextResponse.json({ ok: true, ...report });
}
