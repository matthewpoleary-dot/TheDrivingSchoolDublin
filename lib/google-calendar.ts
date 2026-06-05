// lib/google-calendar.ts
// Google Calendar integration via service account.
// Set GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_CALENDAR_ID in env vars.
// If either is missing, all functions silently no-op.

import { google } from "googleapis";

function getAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) return null;
  try {
    const key = JSON.parse(json);
    return new google.auth.GoogleAuth({
      credentials: key,
      scopes: ["https://www.googleapis.com/auth/calendar.events"],
    });
  } catch {
    console.warn("[google-calendar] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON");
    return null;
  }
}

export type CalendarEventInput = {
  title: string;       // e.g. "Standard Lesson — John Murphy"
  description: string; // customer details
  startISO: string;    // ISO 8601, e.g. "2026-06-10T09:00:00+01:00"
  endISO: string;      // ISO 8601, e.g. "2026-06-10T10:00:00+01:00"
};

/** Creates a Google Calendar event. Returns the event ID (store on booking row), or null on failure/no config. */
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
        start: { dateTime: input.startISO, timeZone: "Europe/Dublin" },
        end:   { dateTime: input.endISO,   timeZone: "Europe/Dublin" },
      },
    });
    return res.data.id ?? null;
  } catch (e) {
    console.error("[google-calendar] createCalendarEvent failed:", e);
    return null;
  }
}

/** Deletes a Google Calendar event by its event ID. Silently no-ops on failure/no config. */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const auth = getAuth();
  if (!auth || !calendarId) return;

  try {
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({ calendarId, eventId });
  } catch (e) {
    console.error("[google-calendar] deleteCalendarEvent failed:", e);
  }
}
