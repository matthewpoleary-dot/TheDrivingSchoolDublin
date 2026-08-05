import { describe, it, expect } from "vitest";
import {
  zonedTimeToUtc,
  utcToZonedParts,
  dateKeyInZone,
  formatTimeInZone,
  formatDateInZone,
  addMinutes,
  minutesBetween,
  parseTimeOfDay,
  todayInZone,
  isSameZonedDay,
  DUBLIN,
} from "@/lib/time";

/**
 * Ireland observes IST (UTC+1) from the last Sunday in March to the last
 * Sunday in October, and UTC the rest of the year. Every one of these cases
 * is a real bug the previous implementation had, because it built Dates from
 * `new Date("2026-08-10T00:00:00")`, which is parsed in the *server's* local
 * zone. On Vercel (UTC) that silently shifted every Irish summer slot by an
 * hour.
 */
describe("zonedTimeToUtc", () => {
  it("treats winter times as UTC+0", () => {
    const utc = zonedTimeToUtc("2026-01-15", "09:00", DUBLIN);
    expect(utc.toISOString()).toBe("2026-01-15T09:00:00.000Z");
  });

  it("treats summer times as UTC+1", () => {
    const utc = zonedTimeToUtc("2026-08-10", "09:00", DUBLIN);
    expect(utc.toISOString()).toBe("2026-08-10T08:00:00.000Z");
  });

  it("handles the spring-forward boundary day", () => {
    // 2026-03-29 01:00 local is the last UTC instant before the jump to 02:00 IST.
    const before = zonedTimeToUtc("2026-03-29", "00:30", DUBLIN);
    expect(before.toISOString()).toBe("2026-03-29T00:30:00.000Z");

    const after = zonedTimeToUtc("2026-03-29", "09:00", DUBLIN);
    expect(after.toISOString()).toBe("2026-03-29T08:00:00.000Z");
  });

  it("handles the autumn fall-back boundary day", () => {
    // 2026-10-25: clocks go back at 02:00 IST -> 01:00 UTC.
    const morning = zonedTimeToUtc("2026-10-25", "09:00", DUBLIN);
    expect(morning.toISOString()).toBe("2026-10-25T09:00:00.000Z");
  });

  it("accepts HH:mm:ss as well as HH:mm", () => {
    expect(zonedTimeToUtc("2026-08-10", "09:00:00", DUBLIN).toISOString()).toBe(
      "2026-08-10T08:00:00.000Z"
    );
  });

  it("round-trips through utcToZonedParts", () => {
    const utc = zonedTimeToUtc("2026-08-10", "14:30", DUBLIN);
    const parts = utcToZonedParts(utc, DUBLIN);
    expect(parts).toMatchObject({
      year: 2026,
      month: 8,
      day: 10,
      hour: 14,
      minute: 30,
    });
  });

  it("handles midnight without the 24:00 hour bug", () => {
    const utc = zonedTimeToUtc("2026-08-10", "00:00", DUBLIN);
    expect(utcToZonedParts(utc, DUBLIN).hour).toBe(0);
  });
});

describe("dateKeyInZone", () => {
  it("keeps a late Irish summer evening on the same calendar day", () => {
    // 23:30 IST on 10 Aug is 22:30Z the same day.
    const utc = zonedTimeToUtc("2026-08-10", "23:30", DUBLIN);
    expect(dateKeyInZone(utc, DUBLIN)).toBe("2026-08-10");
  });

  it("rolls the day correctly for an instant that is next-day in UTC", () => {
    // 00:30 IST on 11 Aug is 23:30Z on 10 Aug. Zone key must say the 11th.
    const utc = new Date("2026-08-10T23:30:00.000Z");
    expect(dateKeyInZone(utc, DUBLIN)).toBe("2026-08-11");
  });
});

describe("formatting", () => {
  it("formats time in the zone, 24-hour, zero-padded", () => {
    const utc = zonedTimeToUtc("2026-08-10", "09:05", DUBLIN);
    expect(formatTimeInZone(utc, DUBLIN)).toBe("09:05");
  });

  it("formats a human date in the zone", () => {
    const utc = zonedTimeToUtc("2026-08-10", "09:00", DUBLIN);
    expect(formatDateInZone(utc, DUBLIN)).toBe("Monday 10 August 2026");
  });
});

describe("arithmetic helpers", () => {
  it("adds minutes without mutating the input", () => {
    const start = new Date("2026-08-10T08:00:00.000Z");
    const end = addMinutes(start, 60);
    expect(end.toISOString()).toBe("2026-08-10T09:00:00.000Z");
    expect(start.toISOString()).toBe("2026-08-10T08:00:00.000Z");
  });

  it("adds minutes across a DST boundary in absolute terms", () => {
    // Absolute arithmetic: 60 real minutes, regardless of what the clock did.
    const start = zonedTimeToUtc("2026-03-29", "00:30", DUBLIN);
    const end = addMinutes(start, 60);
    expect(end.toISOString()).toBe("2026-03-29T01:30:00.000Z");
    // Local clock reads 02:30 because the clocks jumped forward.
    expect(formatTimeInZone(end, DUBLIN)).toBe("02:30");
  });

  it("measures minutes between two instants", () => {
    expect(
      minutesBetween(
        new Date("2026-08-10T08:00:00.000Z"),
        new Date("2026-08-10T09:30:00.000Z")
      )
    ).toBe(90);
  });
});

describe("parseTimeOfDay", () => {
  it("parses HH:mm and HH:mm:ss", () => {
    expect(parseTimeOfDay("09:00")).toEqual({ hour: 9, minute: 0 });
    expect(parseTimeOfDay("18:45:00")).toEqual({ hour: 18, minute: 45 });
  });

  it("rejects malformed input rather than silently producing NaN", () => {
    expect(() => parseTimeOfDay("9am")).toThrow();
    expect(() => parseTimeOfDay("25:00")).toThrow();
    expect(() => parseTimeOfDay("")).toThrow();
  });
});

describe("day helpers", () => {
  it("returns a YYYY-MM-DD key for today in the zone", () => {
    expect(todayInZone(DUBLIN)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("compares zoned days", () => {
    const a = zonedTimeToUtc("2026-08-10", "23:30", DUBLIN);
    const b = zonedTimeToUtc("2026-08-10", "07:00", DUBLIN);
    const c = zonedTimeToUtc("2026-08-11", "07:00", DUBLIN);
    expect(isSameZonedDay(a, b, DUBLIN)).toBe(true);
    expect(isSameZonedDay(a, c, DUBLIN)).toBe(false);
  });
});
