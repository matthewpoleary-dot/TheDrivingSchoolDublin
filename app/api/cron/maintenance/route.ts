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
 * The self-healing job. Runs hourly via Vercel Cron.
 *
 * Three things, each of which exists because the alternative is a silent
 * failure that nobody notices until a pupil is standing on a kerb:
 *
 *   1. Sweep expired holds, so abandoned checkouts release their slot.
 *   2. Retry calendar syncs that failed. Google being down for ten minutes
 *      should not permanently cost the instructor a diary entry.
 *   3. Send tomorrow's reminders, which is the cheapest no-show prevention
 *      there is.
 *
 * Everything is idempotent, so a double-fire is harmless.
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
          "id,reference,status,customer_name,customer_email,customer_phone,pickup_address,test_centre,transmission,notes,starts_at,ends_at,price_cents,deposit_cents,manage_token,google_event_id,stripe_payment_intent_id,services(name)"
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

  // --- 3. Reminders for lessons in the next 24 to 25 hours -----------------
  try {
    const now = new Date();
    const windowStart = addMinutes(now, 24 * 60);
    const windowEnd = addMinutes(now, 25 * 60);

    const { data } = await db
      .from("bookings")
      .select(
        "id,reference,status,customer_name,customer_email,customer_phone,pickup_address,test_centre,transmission,notes,starts_at,ends_at,price_cents,deposit_cents,manage_token,google_event_id,stripe_payment_intent_id,services(name)"
      )
      .eq("status", "confirmed")
      .gte("starts_at", windowStart.toISOString())
      .lt("starts_at", windowEnd.toISOString())
      .limit(50);

    for (const row of (data ?? []) as BookingRow[]) {
      // Skip anything already reminded, so an extra cron run costs nothing.
      const { count } = await db
        .from("booking_events")
        .select("id", { count: "exact", head: true })
        .eq("booking_id", row.id)
        .eq("event", "reminder_sent");

      if ((count ?? 0) > 0) continue;

      const result = await sendLessonReminder(toEmailData(row));

      if (result.ok) {
        await logEvent(row.id, "reminder_sent", {});
        report.remindersSent++;
      } else {
        report.remindersFailed++;
      }
    }
  } catch (error) {
    console.error("[cron] reminders failed:", error);
  }

  console.log("[cron] maintenance report", report);
  return NextResponse.json({ ok: true, ...report });
}
