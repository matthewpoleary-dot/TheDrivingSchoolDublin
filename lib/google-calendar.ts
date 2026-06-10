// lib/google-calendar.ts
// Google Calendar integration via service account.
//
// Naming deviation vs. the integration spec: this file uses
// createCalendarEvent / updateCalendarEvent / deleteCalendarEvent
// instead of the spec's createBookingEvent / updateBookingEvent /
// deleteBookingEvent. The existing names match the rest of the
// codebase (webhook, availability admin route) and the spec is
// explicit: follow existing patterns, note the deviation.
//
// Env var contract (both forms accepted, EMAIL+KEY takes priority):
//   GOOGLE_SERVICE_ACCOUNT_EMAIL  — service account email
//   GOOGLE_PRIVATE_KEY            — private key (literal \n escaped)
//   GOOGLE_CALENDAR_ID            — target calendar (shared with svc account)
//   GOOGLE_SERVICE_ACCOUNT_JSON   — legacy fallback (single JSON blob)
//
// If config is missing, all functions silently no-op so dev environments
// without Google credentials still work end-to-end.

import { google } from "googleapis";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  // Preferred path: separate EMAIL + PRIVATE_KEY env vars (matches Vercel).
  if (email && rawKey) {
    return new google.auth.JWT({
      email,
      key: rawKey.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });
  }

  // Legacy fallback: single JSON blob.
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const creds = JSON.parse(json);
      return new google.auth.GoogleAuth({
        credentials: creds,
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });
    } catch {
      console.warn("[google-calendar] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON");
    }
  }

  return null;
}

export type CalendarEventInput = {
  title: string;                  // e.g. "Standard Lesson — John Murphy"
  description: string;            // multi-line customer details
  startISO: string;               // "2026-06-10T09:00:00" (local, no offset — see note)
  endISO: string;                 // "2026-06-10T10:00:00" (local, no offset — see note)
  location?: string;              // e.g. "Dublin 6 (D6)"
};

// Important: dateTime values SHOULD be passed WITHOUT a UTC offset.
// Google's `timeZone: "Europe/Dublin"` will interpret them as local
// Dublin time, handling DST correctly. Previously this file expected
// values with hardcoded "+01:00" offsets which produced winter bookings
// an hour off.

/**
 * Creates a Google Calendar event. Returns the event ID (store on booking row),
 * or null on failure / no config.
 */
export async function createCalendarEvent(input: CalendarEventInput): Promise<string | null> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const auth = getAuth();
  if (!auth || !calendarId) return null;

  try {
    const calendar = google.calendar({ version: "v3", auth });
    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: input.title,
        description: input.description,
        location: input.location,
        start: { dateTime: input.startISO, timeZone: "Europe/Dublin" },
        end:   { dateTime: input.endISO,   timeZone: "Europe/Dublin" },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 60 },
            { method: "popup", minutes: 24 * 60 },
          ],
        },
      },
    });
    return res.data.id ?? null;
  } catch (e) {
    console.error("[google-calendar] createCalendarEvent failed:", e);
    return null;
  }
}

/**
 * Updates an existing Google Calendar event in-place. No-ops on failure /
 * no config so callers don't need to wrap.
 */
export async function updateCalendarEvent(
  eventId: string,
  input: CalendarEventInput
): Promise<void> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const auth = getAuth();
  if (!auth || !calendarId) return;

  try {
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.update({
      calendarId,
      eventId,
      requestBody: {
        summary: input.title,
        description: input.description,
        location: input.location,
        start: { dateTime: input.startISO, timeZone: "Europe/Dublin" },
        end:   { dateTime: input.endISO,   timeZone: "Europe/Dublin" },
      },
    });
  } catch (e) {
    console.error("[google-calendar] updateCalendarEvent failed:", e);
  }
}

/**
 * Orphan-cleanup helper. Lists events in [startISO, endISO], filters to
 * those that start within 1 minute of startISO and have our "Booking ID:"
 * marker in the description, and deletes each one. Returns the number deleted.
 *
 * Used when an admin frees a slot whose `bookings` row is gone, so we have
 * no event ID to look up but still need to clean the calendar.
 */
export async function findAndDeleteEventsAt(
  startISO: string,
  endISO: string,
): Promise<number> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const auth = getAuth();
  if (!auth || !calendarId) return 0;

  try {
    const calendar = google.calendar({ version: "v3", auth });
    // Widen the range by ±2 minutes so list returns events that start exactly at startISO.
    const wideStart = new Date(new Date(startISO).getTime() - 2 * 60_000).toISOString();
    const wideEnd = new Date(new Date(endISO).getTime() + 2 * 60_000).toISOString();

    const res = await calendar.events.list({
      calendarId,
      timeMin: wideStart,
      timeMax: wideEnd,
      singleEvents: true,
      maxResults: 50,
    });

    let deleted = 0;
    for (const event of res.data.items ?? []) {
      if (!event.id || !event.start?.dateTime) continue;

      // Only delete events that start within 1 minute of the target slot start.
      const eventStartMs = new Date(event.start.dateTime).getTime();
      if (Math.abs(eventStartMs - new Date(startISO).getTime()) > 60_000) continue;

      // Safety filter: only delete events created by us (they have a Booking
      // ID line in the description). This avoids nuking unrelated events Conor
      // may have added manually at the same time.
      if (!event.description?.includes("Booking ID:")) continue;

      try {
        await calendar.events.delete({ calendarId, eventId: event.id });
        deleted++;
      } catch (inner) {
        console.error("[google-calendar] orphan delete failed for event", event.id, inner);
      }
    }
    return deleted;
  } catch (e) {
    console.error("[google-calendar] findAndDeleteEventsAt failed:", e);
    return 0;
  }
}

/**
 * Deletes a Google Calendar event by ID. 404/410 (event already gone) is
 * treated as success.
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const auth = getAuth();
  if (!auth || !calendarId) return;

  try {
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({ calendarId, eventId });
  } catch (e: unknown) {
    // 404 (not found) or 410 (gone) → already deleted, treat as success
    const code = (e as { code?: number })?.code;
    if (code === 404 || code === 410) return;
    console.error("[google-calendar] deleteCalendarEvent failed:", e);
  }
}
