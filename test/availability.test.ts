import { describe, it, expect } from "vitest";
import { computeSlots, subtractInterval, type ComputeSlotsInput } from "@/lib/availability";
import { zonedTimeToUtc, formatTimeInZone, DUBLIN } from "@/lib/time";

/** Local helper so the expectations below read as wall-clock Dublin times. */
const at = (dateKey: string, time: string) => zonedTimeToUtc(dateKey, time, DUBLIN);
const times = (slots: Date[]) => slots.map((s) => formatTimeInZone(s, DUBLIN));

/** A Monday in Irish summer time. */
const MON = "2026-08-10";

function input(overrides: Partial<ComputeSlotsInput> = {}): ComputeSlotsInput {
  return {
    dateKey: MON,
    durationMinutes: 60,
    windows: [{ startTime: "09:00", endTime: "13:00", slotIntervalMinutes: 60 }],
    dateOverrides: [],
    busy: [],
    now: at("2026-08-01", "09:00"),
    minimumNoticeHours: 12,
    bookingHorizonDays: 60,
    bufferMinutes: 0,
    timeZone: DUBLIN,
    ...overrides,
  };
}

describe("computeSlots: basic generation", () => {
  it("generates hourly slots that fit inside the window", () => {
    // 09:00-13:00 with 60 minute lessons gives 09, 10, 11, 12. The 13:00 start
    // would end at 14:00, past the window, so it must not appear.
    expect(times(computeSlots(input()))).toEqual(["09:00", "10:00", "11:00", "12:00"]);
  });

  it("steps by the slot interval, not by the lesson duration", () => {
    const slots = computeSlots(
      input({ windows: [{ startTime: "09:00", endTime: "12:00", slotIntervalMinutes: 30 }] })
    );
    expect(times(slots)).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);
  });

  it("respects a longer lesson duration", () => {
    const slots = computeSlots(
      input({
        durationMinutes: 90,
        windows: [{ startTime: "09:00", endTime: "13:00", slotIntervalMinutes: 60 }],
      })
    );
    // 09:00, 10:00, 11:00 fit (11:00+90 = 12:30). 12:00+90 = 13:30 does not.
    expect(times(slots)).toEqual(["09:00", "10:00", "11:00"]);
  });

  it("returns nothing when there is no window for the day", () => {
    expect(computeSlots(input({ windows: [] }))).toEqual([]);
  });

  it("handles multiple windows in one day, sorted and de-duplicated", () => {
    const slots = computeSlots(
      input({
        windows: [
          { startTime: "14:00", endTime: "16:00", slotIntervalMinutes: 60 },
          { startTime: "09:00", endTime: "11:00", slotIntervalMinutes: 60 },
        ],
      })
    );
    expect(times(slots)).toEqual(["09:00", "10:00", "14:00", "15:00"]);
  });

  it("produces slots as correct absolute instants in summer time", () => {
    const slots = computeSlots(input());
    // 09:00 Dublin in August is 08:00Z.
    expect(slots[0].toISOString()).toBe("2026-08-10T08:00:00.000Z");
  });

  it("produces slots as correct absolute instants in winter", () => {
    const slots = computeSlots(
      input({ dateKey: "2026-01-12", now: at("2026-01-01", "09:00") })
    );
    // 09:00 Dublin in January is 09:00Z.
    expect(slots[0].toISOString()).toBe("2026-01-12T09:00:00.000Z");
  });
});

describe("computeSlots: existing commitments", () => {
  it("removes slots that clash with a booking", () => {
    const slots = computeSlots(
      input({ busy: [{ start: at(MON, "10:00"), end: at(MON, "11:00") }] })
    );
    expect(times(slots)).toEqual(["09:00", "11:00", "12:00"]);
  });

  it("removes slots that merely overlap a booking, not just exact matches", () => {
    const slots = computeSlots(
      input({
        windows: [{ startTime: "09:00", endTime: "13:00", slotIntervalMinutes: 30 }],
        busy: [{ start: at(MON, "10:15"), end: at(MON, "10:45") }],
      })
    );
    // 09:30 (ends 10:30) and 10:00 (ends 11:00) both straddle the busy block.
    expect(times(slots)).not.toContain("09:30");
    expect(times(slots)).not.toContain("10:00");
    expect(times(slots)).toContain("09:00");
    expect(times(slots)).toContain("11:00");
  });

  it("allows a slot that ends exactly when a booking starts, with no buffer", () => {
    const slots = computeSlots(
      input({ busy: [{ start: at(MON, "10:00"), end: at(MON, "11:00") }], bufferMinutes: 0 })
    );
    // 09:00-10:00 touches but does not overlap.
    expect(times(slots)).toContain("09:00");
  });

  it("enforces a travel buffer between lessons", () => {
    const slots = computeSlots(
      input({
        busy: [{ start: at(MON, "10:00"), end: at(MON, "11:00") }],
        bufferMinutes: 15,
      })
    );
    // With 15 minutes of travel time, a 09:00-10:00 lesson leaves no gap, and
    // an 11:00 start begins the instant the previous lesson ends. Both go.
    expect(times(slots)).toEqual(["12:00"]);
  });

  it("treats calendar busy blocks the same as bookings", () => {
    const slots = computeSlots(
      input({ busy: [{ start: at(MON, "09:00"), end: at(MON, "12:00"), source: "calendar" }] })
    );
    expect(times(slots)).toEqual(["12:00"]);
  });

  it("treats an active hold as busy", () => {
    const slots = computeSlots(
      input({ busy: [{ start: at(MON, "09:00"), end: at(MON, "10:00"), source: "hold" }] })
    );
    expect(times(slots)).toEqual(["10:00", "11:00", "12:00"]);
  });

  it("ignores a busy block on a different day", () => {
    const slots = computeSlots(
      input({ busy: [{ start: at("2026-08-11", "09:00"), end: at("2026-08-11", "18:00") }] })
    );
    expect(times(slots)).toHaveLength(4);
  });
});

describe("computeSlots: date overrides", () => {
  it("removes a blacked-out portion of the day", () => {
    const slots = computeSlots(
      input({
        dateOverrides: [{ startTime: "10:00", endTime: "12:00", isBlackout: true }],
      })
    );
    expect(times(slots)).toEqual(["09:00", "12:00"]);
  });

  it("blacks out the whole day", () => {
    const slots = computeSlots(
      input({
        dateOverrides: [{ startTime: "00:00", endTime: "23:59", isBlackout: true }],
      })
    );
    expect(slots).toEqual([]);
  });

  it("adds an extra opening outside the weekly template", () => {
    const slots = computeSlots(
      input({
        dateOverrides: [{ startTime: "18:00", endTime: "20:00", isBlackout: false }],
      })
    );
    expect(times(slots)).toEqual(["09:00", "10:00", "11:00", "12:00", "18:00", "19:00"]);
  });

  it("applies a blackout to an extra opening added on the same day", () => {
    const slots = computeSlots(
      input({
        dateOverrides: [
          { startTime: "18:00", endTime: "21:00", isBlackout: false },
          { startTime: "19:00", endTime: "21:00", isBlackout: true },
        ],
      })
    );
    // Openings are applied first, then blackouts cut through everything.
    expect(times(slots)).toEqual(["09:00", "10:00", "11:00", "12:00", "18:00"]);
  });
});

describe("computeSlots: booking policy", () => {
  it("hides slots inside the minimum notice period", () => {
    const slots = computeSlots(
      input({ now: at(MON, "06:00"), minimumNoticeHours: 12 })
    );
    // Anything before 18:00 that day is inside notice, so nothing is left.
    expect(slots).toEqual([]);
  });

  it("shows slots once they clear the minimum notice period", () => {
    const slots = computeSlots(
      input({ now: at("2026-08-09", "20:00"), minimumNoticeHours: 12 })
    );
    // 12 hours from 20:00 Sunday is 08:00 Monday, so the whole day survives.
    expect(times(slots)).toEqual(["09:00", "10:00", "11:00", "12:00"]);
  });

  it("hides a day beyond the booking horizon", () => {
    const slots = computeSlots(
      input({ now: at("2026-01-01", "09:00"), bookingHorizonDays: 30 })
    );
    expect(slots).toEqual([]);
  });

  it("never returns a slot in the past", () => {
    const slots = computeSlots(
      input({ now: at(MON, "11:30"), minimumNoticeHours: 0 })
    );
    expect(times(slots)).toEqual(["12:00"]);
  });
});

describe("computeSlots: daylight saving boundaries", () => {
  it("is correct on the spring-forward day", () => {
    // 2026-03-29, clocks jump 01:00 UTC -> 02:00 IST. A 09:00 local lesson is 08:00Z.
    const slots = computeSlots(
      input({ dateKey: "2026-03-29", now: at("2026-03-01", "09:00") })
    );
    expect(times(slots)).toEqual(["09:00", "10:00", "11:00", "12:00"]);
    expect(slots[0].toISOString()).toBe("2026-03-29T08:00:00.000Z");
  });

  it("is correct on the fall-back day", () => {
    // 2026-10-25, clocks go back. A 09:00 local lesson is 09:00Z.
    const slots = computeSlots(
      input({ dateKey: "2026-10-25", now: at("2026-10-01", "09:00") })
    );
    expect(times(slots)).toEqual(["09:00", "10:00", "11:00", "12:00"]);
    expect(slots[0].toISOString()).toBe("2026-10-25T09:00:00.000Z");
  });
});

describe("subtractInterval", () => {
  const win = { start: at(MON, "09:00"), end: at(MON, "17:00") };

  it("returns the window untouched when the cut misses it", () => {
    const out = subtractInterval(win, { start: at(MON, "18:00"), end: at(MON, "19:00") });
    expect(out).toHaveLength(1);
    expect(out[0].start).toEqual(win.start);
  });

  it("splits the window when the cut is in the middle", () => {
    const out = subtractInterval(win, { start: at(MON, "12:00"), end: at(MON, "13:00") });
    expect(out).toHaveLength(2);
    expect(formatTimeInZone(out[0].end, DUBLIN)).toBe("12:00");
    expect(formatTimeInZone(out[1].start, DUBLIN)).toBe("13:00");
  });

  it("trims the front when the cut overlaps the start", () => {
    const out = subtractInterval(win, { start: at(MON, "08:00"), end: at(MON, "10:00") });
    expect(out).toHaveLength(1);
    expect(formatTimeInZone(out[0].start, DUBLIN)).toBe("10:00");
  });

  it("removes the window entirely when the cut covers it", () => {
    const out = subtractInterval(win, { start: at(MON, "08:00"), end: at(MON, "18:00") });
    expect(out).toEqual([]);
  });
});
