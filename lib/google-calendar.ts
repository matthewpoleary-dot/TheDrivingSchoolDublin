/**
 * Google Calendar sync.
 *
 * Authentication is a service account with the instructor's calendar shared to
 * it. That deliberately avoids OAuth refresh tokens, which expire, need a
 * consent screen, and break silently months later on a personal Google
 * account. Sharing a calendar is two clicks and never expires.
 *
 * The one rule that governs everything in this file: **calendar sync must
 * never break a booking**. Google being slow, rate-limited or down is not a
 * reason to refuse a customer's money. Every function here either returns a
 * typed failure or degrades to "no calendar data", and the caller carries on.
 * Failed syncs are recorded on the booking and retried by the reconcile cron.
 */

import { google, type calendar_v3 } from "googleapis";
import type { BusyInterval } from "@/lib/availability";
import { SITE, CONTACT } from "@/lib/config";
import { formatDateTimeInZone } from "@/lib/time";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

export type CalendarResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; retryable: boolean };

export function isCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_CALENDAR_ID
  );
}

function calendarId(): string {
  const id = process.env.GOOGLE_CALENDAR_ID;
  if (!id) throw new Error("GOOGLE_CALENDAR_ID is not set");
  return id;
}

let cachedClient: calendar_v3.Calendar | null = null;

function client(): calendar_v3.Calendar {
  if (cachedClient) return cachedClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) throw new Error("Google service account env vars are not set");

  // Vercel stores the key with literal \n sequences. Both forms must work.
  const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;

  const auth = new google.auth.JWT({ email, key: privateKey, scopes: SCOPES });
  cachedClient = google.calendar({ version: "v3", auth });
  return cachedClient;
}

function describe(error: unknown): { message: string; retryable: boolean } {
  const status =
    typeof error === "object" && error !== null && "code" in error
      ? Number((error as { code: unknown }).code)
      : undefined;

  const message = error instanceof Error ? error.message : String(error);

  // 403 rate limits, 429 and 5xx are worth retrying. 401/404 mean the calendar
  // is not shared with the service account, which retrying will not fix.
  const retryable =
    status === undefined || status === 429 || (status >= 500 && status < 600) || status === 403;

  return { message, retryable };
}

/** Small bounded retry, so one blip does not lose a sync. */
async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 3
): Promise<CalendarResult<T>> {
  let last: { message: string; retryable: boolean } = {
    message: "not attempted",
    retryable: false,
  };

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return { ok: true, value: await fn() };
    } catch (error) {
      last = describe(error);
      if (!last.retryable || attempt === attempts) break;
      await new Promise((r) => setTimeout(r, 250 * 2 ** (attempt - 1)));
    }
  }

  console.error(`[google-calendar] ${label} failed: ${last.message}`);
  return { ok: false, error: last.message, retryable: last.retryable };
}

// ---------------------------------------------------------------------------
// Reading: what is the instructor already committed to?
// ---------------------------------------------------------------------------

/**
 * Busy intervals from the instructor's calendar.
 *
 * Returns an empty array when the calendar is unreachable. That is the safe
 * failure direction for availability: worst case the site offers a slot the
 * instructor has to decline, rather than showing an empty calendar and losing
 * every booking for the day.
 */
export async function getCalendarBusy(from: Date, to: Date): Promise<BusyInterval[]> {
  if (!isCalendarConfigured()) return [];

  const result = await withRetry("freebusy", async () => {
    const response = await client().freebusy.query({
      requestBody: {
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        items: [{ id: calendarId() }],
        timeZone: SITE.timezone,
      },
    });
    return response.data.calendars?.[calendarId()]?.busy ?? [];
  });

  if (!result.ok) return [];

  return result.value
    .filter((b): b is { start: string; end: string } => Boolean(b.start && b.end))
    .map((b) => ({
      start: new Date(b.start),
      end: new Date(b.end),
      source: "calendar" as const,
    }));
}

// ---------------------------------------------------------------------------
// Writing: put confirmed lessons on the instructor's calendar
// ---------------------------------------------------------------------------

export type CalendarBooking = {
  reference: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupAddress?: string | null;
  testCentre?: string | null;
  transmission?: string | null;
  notes?: string | null;
  startsAt: Date;
  endsAt: Date;
  manageUrl: string;
};

function eventBody(booking: CalendarBooking): calendar_v3.Schema$Event {
  const lines = [
    `${booking.serviceName} — ${booking.reference}`,
    "",
    `Pupil:  ${booking.customerName}`,
    `Phone:  ${booking.customerPhone}`,
    `Email:  ${booking.customerEmail}`,
  ];

  if (booking.pickupAddress) lines.push(`Pick-up: ${booking.pickupAddress}`);
  if (booking.testCentre) lines.push(`Test centre: ${booking.testCentre}`);
  if (booking.transmission) lines.push(`Transmission: ${booking.transmission}`);
  if (booking.notes) lines.push("", `Notes: ${booking.notes}`);

  lines.push("", `Manage: ${booking.manageUrl}`);

  return {
    summary: `${booking.serviceName}: ${booking.customerName}`,
    description: lines.join("\n"),
    location: booking.pickupAddress || booking.testCentre || undefined,
    start: { dateTime: booking.startsAt.toISOString(), timeZone: SITE.timezone },
    end: { dateTime: booking.endsAt.toISOString(), timeZone: SITE.timezone },
    // The pupil is intentionally not added as an attendee: a service account
    // cannot invite guests without domain-wide delegation, and doing so would
    // also leak the instructor's calendar address.
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 },
        { method: "popup", minutes: 24 * 60 },
      ],
    },
    extendedProperties: {
      private: { tdsReference: booking.reference, tdsManaged: "true" },
    },
  };
}

export async function createCalendarEvent(
  booking: CalendarBooking
): Promise<CalendarResult<string>> {
  if (!isCalendarConfigured()) {
    return { ok: false, error: "Calendar not configured", retryable: false };
  }

  const result = await withRetry(`create ${booking.reference}`, async () => {
    const response = await client().events.insert({
      calendarId: calendarId(),
      requestBody: eventBody(booking),
    });
    const id = response.data.id;
    if (!id) throw new Error("Google returned no event id");
    return id;
  });

  return result;
}

export async function updateCalendarEvent(
  eventId: string,
  booking: CalendarBooking
): Promise<CalendarResult<string>> {
  if (!isCalendarConfigured()) {
    return { ok: false, error: "Calendar not configured", retryable: false };
  }

  return withRetry(`update ${booking.reference}`, async () => {
    await client().events.update({
      calendarId: calendarId(),
      eventId,
      requestBody: eventBody(booking),
    });
    return eventId;
  });
}

export async function deleteCalendarEvent(eventId: string): Promise<CalendarResult<null>> {
  if (!isCalendarConfigured()) {
    return { ok: false, error: "Calendar not configured", retryable: false };
  }

  return withRetry(`delete ${eventId}`, async () => {
    try {
      await client().events.delete({ calendarId: calendarId(), eventId });
    } catch (error) {
      // Already gone is a success, not a failure.
      const status =
        typeof error === "object" && error !== null && "code" in error
          ? Number((error as { code: unknown }).code)
          : undefined;
      if (status !== 404 && status !== 410) throw error;
    }
    return null;
  });
}

/** Human-readable summary used in the admin screen's calendar health panel. */
export function calendarStatusMessage(): string {
  if (!isCalendarConfigured()) {
    return `Not connected. Share the instructor's calendar with the service account, then set GOOGLE_CALENDAR_ID. See docs/SETUP.md.`;
  }
  return `Connected to ${process.env.GOOGLE_CALENDAR_ID}`;
}

/** Used by the email templates. Kept here so the wording stays in one place. */
export function lessonWhenLine(startsAt: Date): string {
  return formatDateTimeInZone(startsAt, SITE.timezone);
}

export const SUPPORT_LINE = `Any problem at all, ring or text ${CONTACT.phoneDisplay}.`;
