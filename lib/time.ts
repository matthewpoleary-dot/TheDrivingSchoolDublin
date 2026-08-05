/**
 * Timezone-correct date handling, with no runtime dependency.
 *
 * Everything the booking engine stores is an absolute UTC instant. Everything
 * a human sees is rendered in the school's operating zone. The two conversions
 * live here and nowhere else.
 *
 * The rule that must never be broken: never construct a Date from a naive
 * string such as `new Date("2026-08-10T09:00:00")`. That is interpreted in the
 * *host's* local zone, so it means one thing on a laptop in Dublin and another
 * on a Vercel function in UTC. Use zonedTimeToUtc.
 */

export const DUBLIN = "Europe/Dublin";

/** The school's operating timezone. Override per-deployment if it ever moves. */
export const TIMEZONE: string = process.env.TIMEZONE || DUBLIN;

export type ZonedParts = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
  second: number;
};

export type TimeOfDay = { hour: number; minute: number };

const PARTS_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let fmt = PARTS_FORMATTER_CACHE.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    PARTS_FORMATTER_CACHE.set(timeZone, fmt);
  }
  return fmt;
}

/** Decompose an absolute instant into wall-clock parts in the given zone. */
export function utcToZonedParts(instant: Date, timeZone: string = TIMEZONE): ZonedParts {
  const parts = partsFormatter(timeZone).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const found = parts.find((p) => p.type === type);
    if (!found) throw new Error(`Missing "${type}" from Intl parts for ${timeZone}`);
    return Number(found.value);
  };

  // Some engines render midnight as hour "24" under hour12:false. Normalise.
  const rawHour = get("hour");

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: rawHour === 24 ? 0 : rawHour,
    minute: get("minute"),
    second: get("second"),
  };
}

/**
 * The zone's UTC offset, in milliseconds, at a given absolute instant.
 * Positive east of Greenwich, so Dublin in summer returns +3_600_000.
 */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const p = utcToZonedParts(instant, timeZone);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  // Discard sub-second drift so the comparison in zonedTimeToUtc is exact.
  return asIfUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** Parse "HH:mm" or "HH:mm:ss" strictly. Throws rather than yielding NaN. */
export function parseTimeOfDay(value: string): TimeOfDay {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value?.trim() ?? "");
  if (!match) throw new Error(`Invalid time of day: "${value}" (expected HH:mm)`);
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw new Error(`Time out of range: "${value}"`);
  return { hour, minute };
}

/** Parse "YYYY-MM-DD" strictly. */
export function parseDateKey(value: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value?.trim() ?? "");
  if (!match) throw new Error(`Invalid date key: "${value}" (expected YYYY-MM-DD)`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Date out of range: "${value}"`);
  }
  return { year, month, day };
}

/**
 * Convert a wall-clock date and time in a zone to the absolute UTC instant.
 *
 * Two passes. The first guesses the offset using the naive instant; the second
 * re-checks using the corrected instant, which is what makes DST boundaries
 * come out right. On a spring-forward gap the requested local time does not
 * exist, and we resolve forward, which is the conventional choice and safe
 * here because the school never opens at 01:00.
 */
export function zonedTimeToUtc(
  dateKey: string,
  time: string | TimeOfDay,
  timeZone: string = TIMEZONE
): Date {
  const { year, month, day } = parseDateKey(dateKey);
  const { hour, minute } = typeof time === "string" ? parseTimeOfDay(time) : time;

  const naive = Date.UTC(year, month - 1, day, hour, minute, 0);

  const firstGuessOffset = zoneOffsetMs(new Date(naive), timeZone);
  let instant = new Date(naive - firstGuessOffset);

  const secondOffset = zoneOffsetMs(instant, timeZone);
  if (secondOffset !== firstGuessOffset) {
    instant = new Date(naive - secondOffset);
  }

  return instant;
}

/** "YYYY-MM-DD" for the instant, as seen in the zone. */
export function dateKeyInZone(instant: Date, timeZone: string = TIMEZONE): string {
  const p = utcToZonedParts(instant, timeZone);
  return `${p.year.toString().padStart(4, "0")}-${p.month
    .toString()
    .padStart(2, "0")}-${p.day.toString().padStart(2, "0")}`;
}

/** Today's date key in the zone. */
export function todayInZone(timeZone: string = TIMEZONE): string {
  return dateKeyInZone(new Date(), timeZone);
}

/** Do two instants fall on the same calendar day in the zone? */
export function isSameZonedDay(a: Date, b: Date, timeZone: string = TIMEZONE): boolean {
  return dateKeyInZone(a, timeZone) === dateKeyInZone(b, timeZone);
}

/** 0 = Sunday .. 6 = Saturday, as seen in the zone. */
export function weekdayInZone(dateKey: string, timeZone: string = TIMEZONE): number {
  // Midday avoids any DST edge at the day boundary.
  const noon = zonedTimeToUtc(dateKey, "12:00", timeZone);
  const p = utcToZonedParts(noon, timeZone);
  return new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
}

/** "09:05" in the zone. */
export function formatTimeInZone(instant: Date, timeZone: string = TIMEZONE): string {
  const p = utcToZonedParts(instant, timeZone);
  return `${p.hour.toString().padStart(2, "0")}:${p.minute.toString().padStart(2, "0")}`;
}

/** "Monday 10 August 2026" in the zone. */
export function formatDateInZone(instant: Date, timeZone: string = TIMEZONE): string {
  return new Intl.DateTimeFormat("en-IE", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(instant);
}

/** "Mon 10 Aug" in the zone. */
export function formatShortDateInZone(instant: Date, timeZone: string = TIMEZONE): string {
  return new Intl.DateTimeFormat("en-IE", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(instant);
}

/** "Monday 10 August 2026 at 09:00" in the zone. */
export function formatDateTimeInZone(instant: Date, timeZone: string = TIMEZONE): string {
  return `${formatDateInZone(instant, timeZone)} at ${formatTimeInZone(instant, timeZone)}`;
}

/** Absolute arithmetic. Adds real minutes, not wall-clock minutes. */
export function addMinutes(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * 60_000);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const { year, month, day } = parseDateKey(dateKey);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${shifted.getUTCFullYear().toString().padStart(4, "0")}-${(
    shifted.getUTCMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${shifted.getUTCDate().toString().padStart(2, "0")}`;
}

export function minutesBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 60_000);
}

/** Do two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap? */
export function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && bStart < aEnd;
}
