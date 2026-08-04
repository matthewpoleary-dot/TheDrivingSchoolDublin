/**
 * Slot availability.
 *
 * The computation is a pure function (`computeSlots`) with no database and no
 * clock of its own, so every rule below is directly testable. The database
 * gathering lives in `getAvailability`, which does nothing but fetch and hand
 * over.
 *
 * Rules, in the order they are applied:
 *   1. Start from the weekly template windows for that weekday.
 *   2. Add any extra openings declared for that specific date.
 *   3. Cut out any blackouts declared for that specific date.
 *   4. Step through each window by its slot interval, keeping only starts
 *      where the whole lesson fits inside the window.
 *   5. Drop candidates that clash with a booking, a held slot or a calendar
 *      event, allowing for the travel buffer either side.
 *   6. Drop candidates inside the minimum-notice period or past the horizon.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { BOOKING_POLICY } from "@/lib/config";
import {
  TIMEZONE,
  addMinutes,
  addDaysToDateKey,
  dateKeyInZone,
  intervalsOverlap,
  todayInZone,
  weekdayInZone,
  zonedTimeToUtc,
} from "@/lib/time";

export type Interval = { start: Date; end: Date };

export type BusySource = "booking" | "hold" | "calendar";

export type BusyInterval = Interval & { source?: BusySource };

export type TemplateWindow = {
  /** "HH:mm" wall-clock in the school's zone. */
  startTime: string;
  endTime: string;
  /** Minutes between consecutive slot starts, e.g. 30. */
  slotIntervalMinutes: number;
};

export type DateOverride = {
  startTime: string;
  endTime: string;
  /** true removes availability, false adds an extra opening. */
  isBlackout: boolean;
};

export type ComputeSlotsInput = {
  dateKey: string;
  durationMinutes: number;
  windows: TemplateWindow[];
  dateOverrides: DateOverride[];
  busy: BusyInterval[];
  /** Injected rather than read from the system clock, so tests are stable. */
  now: Date;
  minimumNoticeHours: number;
  bookingHorizonDays: number;
  /** Travel time the instructor needs either side of a lesson. */
  bufferMinutes: number;
  timeZone: string;
};

/**
 * Remove `cut` from `window`, returning 0, 1 or 2 remaining pieces.
 * Exported because the splitting logic is worth testing on its own.
 */
export function subtractInterval(window: Interval, cut: Interval): Interval[] {
  if (cut.end <= window.start || cut.start >= window.end) return [window];

  const pieces: Interval[] = [];
  if (cut.start > window.start) pieces.push({ start: window.start, end: cut.start });
  if (cut.end < window.end) pieces.push({ start: cut.end, end: window.end });
  return pieces.filter((p) => p.end > p.start);
}

export function computeSlots(input: ComputeSlotsInput): Date[] {
  const {
    dateKey,
    durationMinutes,
    windows,
    dateOverrides,
    busy,
    now,
    minimumNoticeHours,
    bookingHorizonDays,
    bufferMinutes,
    timeZone,
  } = input;

  if (durationMinutes <= 0) return [];

  // Step 6a, applied early because it makes the rest pointless.
  const horizonLastDay = addDaysToDateKey(dateKeyInZone(now, timeZone), bookingHorizonDays);
  if (dateKey > horizonLastDay) return [];

  const toInstant = (time: string) => zonedTimeToUtc(dateKey, time, timeZone);

  // Steps 1 and 2: base windows plus extra openings.
  let open: Interval[] = [
    ...windows.map((w) => ({ start: toInstant(w.startTime), end: toInstant(w.endTime) })),
    ...dateOverrides
      .filter((o) => !o.isBlackout)
      .map((o) => ({ start: toInstant(o.startTime), end: toInstant(o.endTime) })),
  ].filter((w) => w.end > w.start);

  if (open.length === 0) return [];

  // Step 3: blackouts cut through everything, including extra openings.
  for (const blackout of dateOverrides.filter((o) => o.isBlackout)) {
    const cut = { start: toInstant(blackout.startTime), end: toInstant(blackout.endTime) };
    open = open.flatMap((w) => subtractInterval(w, cut));
  }

  if (open.length === 0) return [];

  // Step 4: walk each window. Slot starts stay aligned to the window's own
  // start so the instructor sees round numbers, not drift.
  const stepFor = (index: number) =>
    Math.max(5, windows[index]?.slotIntervalMinutes ?? defaultInterval(windows));

  const candidates: Date[] = [];
  open.forEach((window) => {
    // Match this piece back to the template window it came from, so a split
    // window keeps its own interval.
    const sourceIndex = windows.findIndex(
      (w) => toInstant(w.startTime) <= window.start && toInstant(w.endTime) >= window.end
    );
    const step = stepFor(sourceIndex === -1 ? 0 : sourceIndex);

    let cursor = window.start;
    while (addMinutes(cursor, durationMinutes) <= window.end) {
      candidates.push(cursor);
      cursor = addMinutes(cursor, step);
    }
  });

  const earliestAllowed = addMinutes(now, minimumNoticeHours * 60);

  const free = candidates.filter((start) => {
    // Step 6b: notice period, which also rules out anything in the past.
    if (start < earliestAllowed) return false;

    const end = addMinutes(start, durationMinutes);

    // Step 5: clashes. Expanding the busy block by the buffer on both sides is
    // the same as requiring a gap of at least `bufferMinutes` between lessons.
    return !busy.some((b) =>
      intervalsOverlap(
        start,
        end,
        addMinutes(b.start, -bufferMinutes),
        addMinutes(b.end, bufferMinutes)
      )
    );
  });

  // Windows can overlap, so de-duplicate before returning.
  const seen = new Set<number>();
  return free
    .filter((d) => {
      const key = d.getTime();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.getTime() - b.getTime());
}

function defaultInterval(windows: TemplateWindow[]): number {
  return windows[0]?.slotIntervalMinutes ?? 30;
}

// ---------------------------------------------------------------------------
// Database-backed entry points
// ---------------------------------------------------------------------------

export type DayAvailability = {
  dateKey: string;
  slots: string[]; // ISO instants
};

type ServiceRow = {
  id: string;
  slug: string;
  duration_minutes: number;
  buffer_minutes: number;
};

async function loadService(slug: string): Promise<ServiceRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("services")
    .select("id,slug,duration_minutes,buffer_minutes")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(`Failed to load service "${slug}": ${error.message}`);
  return data;
}

/**
 * Availability for a range of days, which is what the calendar UI actually
 * needs. One round trip per table rather than one per day.
 */
export async function getAvailability(options: {
  serviceSlug: string;
  fromDateKey?: string;
  days?: number;
  now?: Date;
  timeZone?: string;
  /** Calendar busy times, injected so the caller controls the network call. */
  calendarBusy?: BusyInterval[];
}): Promise<DayAvailability[]> {
  const timeZone = options.timeZone ?? TIMEZONE;
  const now = options.now ?? new Date();
  const fromDateKey = options.fromDateKey ?? todayInZone(timeZone);
  const days = Math.min(options.days ?? 14, BOOKING_POLICY.bookingHorizonDays);

  const service = await loadService(options.serviceSlug);
  if (!service) return [];

  const dateKeys = Array.from({ length: days }, (_, i) => addDaysToDateKey(fromDateKey, i));
  const rangeStart = zonedTimeToUtc(fromDateKey, "00:00", timeZone);
  const rangeEnd = addMinutes(
    zonedTimeToUtc(addDaysToDateKey(fromDateKey, days), "00:00", timeZone),
    0
  );

  const db = supabaseAdmin();

  const [templatesRes, overridesRes, bookingsRes] = await Promise.all([
    db.from("weekly_template").select("weekday,start_time,end_time,slot_interval_minutes"),
    db
      .from("date_overrides")
      .select("date,start_time,end_time,is_blackout")
      .gte("date", fromDateKey)
      .lte("date", dateKeys[dateKeys.length - 1]),
    // Holds are NOT a separate table. They are bookings with status 'held',
    // which is what lets one exclusion constraint cover both. This filter must
    // stay in step with the constraint predicate in 0001_booking_core.sql, or
    // the site will offer slots the database will then refuse.
    db
      .from("bookings")
      .select("starts_at,ends_at,status")
      .in("status", ["held", "pending", "confirmed"])
      .gte("starts_at", rangeStart.toISOString())
      .lt("starts_at", rangeEnd.toISOString()),
  ]);

  for (const [label, res] of [
    ["weekly_template", templatesRes],
    ["date_overrides", overridesRes],
    ["bookings", bookingsRes],
  ] as const) {
    if (res.error) throw new Error(`Failed to load ${label}: ${res.error.message}`);
  }

  const busy: BusyInterval[] = [
    ...(bookingsRes.data ?? []).map((b) => ({
      start: new Date(b.starts_at as string),
      end: new Date(b.ends_at as string),
      source: (b.status === "held" ? "hold" : "booking") as BusySource,
    })),
    ...(options.calendarBusy ?? []),
  ];

  return dateKeys.map((dateKey) => {
    const weekday = weekdayInZone(dateKey, timeZone);

    const windows: TemplateWindow[] = (templatesRes.data ?? [])
      .filter((t) => Number(t.weekday) === weekday)
      .map((t) => ({
        startTime: String(t.start_time).slice(0, 5),
        endTime: String(t.end_time).slice(0, 5),
        slotIntervalMinutes: Number(t.slot_interval_minutes),
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const dateOverrides: DateOverride[] = (overridesRes.data ?? [])
      .filter((o) => String(o.date) === dateKey)
      .map((o) => ({
        startTime: String(o.start_time).slice(0, 5),
        endTime: String(o.end_time).slice(0, 5),
        isBlackout: Boolean(o.is_blackout),
      }));

    const slots = computeSlots({
      dateKey,
      durationMinutes: service.duration_minutes,
      windows,
      dateOverrides,
      busy,
      now,
      minimumNoticeHours: BOOKING_POLICY.minimumNoticeHours,
      bookingHorizonDays: BOOKING_POLICY.bookingHorizonDays,
      bufferMinutes: service.buffer_minutes,
      timeZone,
    });

    return { dateKey, slots: slots.map((s) => s.toISOString()) };
  });
}

/**
 * Authoritative re-check for a single instant, run immediately before a hold
 * is taken. The calendar UI can be stale; this cannot be.
 */
export async function isSlotStillAvailable(options: {
  serviceSlug: string;
  startsAt: Date;
  now?: Date;
  timeZone?: string;
  calendarBusy?: BusyInterval[];
}): Promise<boolean> {
  const timeZone = options.timeZone ?? TIMEZONE;
  const dateKey = dateKeyInZone(options.startsAt, timeZone);

  const day = await getAvailability({
    serviceSlug: options.serviceSlug,
    fromDateKey: dateKey,
    days: 1,
    now: options.now,
    timeZone,
    calendarBusy: options.calendarBusy,
  });

  const target = options.startsAt.toISOString();
  return (day[0]?.slots ?? []).includes(target);
}
