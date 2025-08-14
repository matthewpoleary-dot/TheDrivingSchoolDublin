// lib/time.ts
// Tiny helper to format ISO timestamps in a fixed timezone (from env).
// Avoids server-vs-browser timezone drift (e.g., UTC vs Europe/Dublin).

export const TIMEZONE: string = process.env.TIMEZONE || "Europe/Dublin";

/**
 * Format an ISO string in the configured TIMEZONE using Intl.
 * Defaults to "Medium date + Short time" like "14 Aug 2025, 10:00".
 */
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

/**
 * Format time-only label (e.g., "10:00") in configured TIMEZONE.
 */
export function formatZonedTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-IE", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
