import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailability } from "@/lib/availability";
import { getCalendarBusy } from "@/lib/google-calendar";
import { isSupabaseConfigured } from "@/lib/supabase";
import { BOOKING_POLICY, lessonTypeBySlug } from "@/lib/config";
import { TIMEZONE, addDaysToDateKey, todayInZone, zonedTimeToUtc } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  service: z.string().min(1).max(64),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "from must be YYYY-MM-DD")
    .optional(),
  days: z.coerce.number().int().min(1).max(21).default(14),
});

/**
 * Open availability for the calendar UI.
 *
 * Reads only, no side effects, so it is safe to call as the customer clicks
 * around. The authoritative check happens again inside hold_slot() at the
 * moment of booking, because anything shown here can be stale by the time
 * someone finishes typing their phone number.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  const parsed = querySchema.safeParse({
    service: url.searchParams.get("service"),
    from: url.searchParams.get("from") ?? undefined,
    days: url.searchParams.get("days") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", detail: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  const { service, days } = parsed.data;

  if (!lessonTypeBySlug(service)?.bookable) {
    return NextResponse.json({ error: "That lesson is not bookable online" }, { status: 404 });
  }

  if (!isSupabaseConfigured()) {
    // Degrade honestly rather than 500. The page shows the phone route instead.
    return NextResponse.json(
      { days: [], configured: false, timezone: TIMEZONE },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Never open the calendar before today, whatever the query string says.
  const today = todayInZone(TIMEZONE);
  const from = parsed.data.from && parsed.data.from > today ? parsed.data.from : today;

  try {
    // One calendar round trip covering the whole window, not one per day.
    const calendarBusy = await getCalendarBusy(
      zonedTimeToUtc(from, "00:00", TIMEZONE),
      zonedTimeToUtc(addDaysToDateKey(from, days), "00:00", TIMEZONE)
    );

    const availability = await getAvailability({
      serviceSlug: service,
      fromDateKey: from,
      days,
      calendarBusy,
    });

    return NextResponse.json(
      {
        configured: true,
        timezone: TIMEZONE,
        service,
        noticeHours: BOOKING_POLICY.minimumNoticeHours,
        days: availability,
      },
      {
        status: 200,
        headers: {
          // Short shared cache: availability changes, but not every second, and
          // a burst of visitors should not each trigger a Google round trip.
          "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("[availability] failed:", error);
    return NextResponse.json(
      { error: "Could not load availability", days: [], configured: true },
      { status: 503 }
    );
  }
}
