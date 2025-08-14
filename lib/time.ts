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
