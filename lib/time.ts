// lib/time.ts
// Single source of truth for timezone-aware formatting.
// Uses TIMEZONE from env (default Europe/Dublin).

export const TIMEZONE: string = process.env.TIMEZONE || "Europe/Dublin";

/** Format an ISO string in the configured TIMEZONE with medium date + short time. */
export function formatZoned(
  iso: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-IE", {
    timeZone: TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(d);
}

/** Time-only, e.g. "10:00" in configured TIMEZONE. */
export function formatZonedTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-IE", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Convert a Europe/Dublin wall-clock time (date + time strings) to a UTC ISO
 * string. Handles IST/GMT (DST) automatically by reading the actual offset
 * from Intl for that specific date.
 *
 * Example:
 *   dublinLocalToUtcISO("2026-06-10", "19:00:00") → "2026-06-10T18:00:00.000Z"
 *   dublinLocalToUtcISO("2026-01-10", "19:00:00") → "2026-01-10T19:00:00.000Z"
 */
export function dublinLocalToUtcISO(date: string, time: string): string {
  // Step 1: pretend the wall-clock IS UTC. This gives us a Date object whose
  // .getTime() corresponds to "if you read the digits as UTC."
  const asIfUtc = new Date(`${date}T${time}Z`);

  // Step 2: format that Date in Europe/Dublin and reconstruct the digits.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(asIfUtc);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const dublinReading = new Date(
    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}Z`
  );

  // Step 3: the difference between Dublin's reading and the asIfUtc gives the
  // offset for this date. Apply the inverse to translate wall-clock → UTC.
  const offsetMs = dublinReading.getTime() - asIfUtc.getTime();
  return new Date(asIfUtc.getTime() - offsetMs).toISOString();
}

/** Returns a YYYY-MM-DD string for the ISO time in the configured TIMEZONE. */
export function dateKeyZoned(iso: string): string {
  const d = new Date(iso);
  // We’ll build YYYY-MM-DD from parts to avoid locale quirks.
  const parts = new Intl.DateTimeFormat("en-IE", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const da = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${da}`;
}
