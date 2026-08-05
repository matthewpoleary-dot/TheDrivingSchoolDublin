import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");

beforeEach(() => {
  vi.resetModules();
  process.env.ADMIN_SESSION_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef";
});

async function auth() {
  return import("@/lib/auth");
}

describe("clientIp", () => {
  it("prefers x-real-ip, which the platform sets and the caller cannot forge", async () => {
    const { clientIp } = await auth();
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "203.0.113.7", "x-forwarded-for": "1.2.3.4, 203.0.113.7" },
    });
    expect(clientIp(req)).toBe("203.0.113.7");
  });

  it("falls back to the RIGHTMOST x-forwarded-for entry, not the client-supplied left one", async () => {
    const { clientIp } = await auth();
    // An attacker sets the leftmost value freely. Taking it would let them mint
    // a fresh rate-limit bucket per request.
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "9.9.9.9, 198.51.100.4" },
    });
    expect(clientIp(req)).toBe("198.51.100.4");
  });

  it("returns a stable fallback when no proxy headers are present", async () => {
    const { clientIp } = await auth();
    expect(clientIp(new Request("https://example.com"))).toBe("unknown");
  });
});

describe("rateLimit", () => {
  it("allows up to the limit and blocks beyond it", async () => {
    const { rateLimit } = await auth();
    const key = "test:allow";

    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, { limit: 3 })).toBe(false);
    }
    expect(rateLimit(key, { limit: 3 })).toBe(true);
  });

  it("keeps separate keys independent", async () => {
    const { rateLimit } = await auth();
    for (let i = 0; i < 4; i++) rateLimit("test:a", { limit: 3 });
    expect(rateLimit("test:b", { limit: 3 })).toBe(false);
  });

  it("forgets hits once the window has passed", async () => {
    const { rateLimit } = await auth();
    const key = "test:window";

    for (let i = 0; i < 3; i++) rateLimit(key, { limit: 3, windowMs: 50 });
    expect(rateLimit(key, { limit: 3, windowMs: 50 })).toBe(true);

    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.now() + 200));
    expect(rateLimit(key, { limit: 3, windowMs: 50 })).toBe(false);
    vi.useRealTimers();
  });

  it("does not grow without bound under a flood of distinct keys", async () => {
    const { rateLimit } = await auth();
    // 20k distinct keys against a 10k cap. If eviction were missing this would
    // be the OOM shape that has bitten before.
    for (let i = 0; i < 20_000; i++) {
      rateLimit(`flood:${i}`, { limit: 1, windowMs: 60_000 });
    }
    // The limiter must still work correctly afterwards.
    expect(rateLimit("flood:sentinel", { limit: 1 })).toBe(false);
    expect(rateLimit("flood:sentinel", { limit: 1 })).toBe(true);
  });
});

describe("honeypots accept any value rather than rejecting it", () => {
  /**
   * A honeypot validated to empty (`z.string().max(0)`) fails schema
   * validation, which returns a 400 naming the honeypot field and makes the
   * "silently accept and drop" branch unreachable. Both defeat the point.
   */
  for (const [label, file] of [
    ["bookings", "app/api/bookings/route.ts"],
    ["contact", "app/api/contact/route.ts"],
  ] as const) {
    it(`${label} does not constrain its honeypot field`, () => {
      const source = readFileSync(join(ROOT, file), "utf8");
      expect(source).not.toMatch(/(website|company):\s*z\.string\(\)\.max\(0\)/);
      expect(source).toMatch(/(website|company):\s*z\.string\(\)\.optional\(\)/);
    });

    it(`${label} silently accepts a filled honeypot instead of erroring`, () => {
      const source = readFileSync(join(ROOT, file), "utf8");
      // The drop branch must exist and must return a success shape.
      expect(source).toMatch(/if \(\w+\.(website|company)\)/);
    });
  }
});

describe("service-role key never reaches the browser", () => {
  it("is not exposed under a NEXT_PUBLIC_ name anywhere", () => {
    const source = readFileSync(join(ROOT, "lib", "supabase.ts"), "utf8");
    expect(source).not.toMatch(/NEXT_PUBLIC_SUPABASE_SERVICE/);
    // The browser guard must be present and must throw, not warn.
    expect(source).toMatch(/typeof window !== "undefined"/);
    expect(source).toMatch(/throw new Error\("supabaseAdmin\(\) must never be called in the browser/);
  });

  it("is not imported by any client component", () => {
    const clientFiles = [
      "components/BookingFlow.tsx",
      "components/NextAvailable.tsx",
      "components/SiteNav.tsx",
      "components/ContactForm.tsx",
      "components/ManageBooking.tsx",
      "components/admin/AdminDashboard.tsx",
      "components/admin/AdminLogin.tsx",
    ];

    for (const file of clientFiles) {
      const source = readFileSync(join(ROOT, file), "utf8");
      expect(source, `${file} is a client component`).toMatch(/^"use client";/);
      expect(source, `${file} must not import server-only Supabase`).not.toMatch(
        /from "@\/lib\/(supabase|booking-service|stripe|google-calendar|email)"/
      );
    }
  });
});

describe("reminder heading matches the actual day", () => {
  /**
   * The reminder job uses a wide window so it is correct at any cron
   * frequency, which means it can fire anywhere from roughly one to two days
   * out. A hardcoded "Lesson tomorrow" would tell some pupils the wrong day.
   */
  it("says today, tomorrow, or names the weekday", async () => {
    const { reminderHeading } = await import("@/lib/email");
    const { zonedTimeToUtc, DUBLIN } = await import("@/lib/time");

    const now = zonedTimeToUtc("2026-08-10", "18:00", DUBLIN); // Monday evening

    expect(reminderHeading(zonedTimeToUtc("2026-08-10", "20:00", DUBLIN), now)).toBe(
      "Lesson today"
    );
    expect(reminderHeading(zonedTimeToUtc("2026-08-11", "09:00", DUBLIN), now)).toBe(
      "Lesson tomorrow"
    );
    // ~40 hours out: must NOT claim tomorrow.
    expect(reminderHeading(zonedTimeToUtc("2026-08-12", "10:00", DUBLIN), now)).toBe(
      "Lesson on Wednesday"
    );
  });

  it("uses calendar days in the school's zone, not raw hours", async () => {
    const { reminderHeading } = await import("@/lib/email");
    const { zonedTimeToUtc, DUBLIN } = await import("@/lib/time");

    // 23:00 Monday to 08:00 Tuesday is only 9 hours, but it is still tomorrow.
    const now = zonedTimeToUtc("2026-08-10", "23:00", DUBLIN);
    expect(reminderHeading(zonedTimeToUtc("2026-08-11", "08:00", DUBLIN), now)).toBe(
      "Lesson tomorrow"
    );
  });
});

describe("the reminder claim is atomic, not check-then-act", () => {
  it("the cron claims before sending and releases on failure", () => {
    const source = readFileSync(join(ROOT, "app/api/cron/maintenance/route.ts"), "utf8");

    // The claim must happen before the send. Match the CALL site, not the
    // import at the top of the file.
    const claimAt = source.indexOf('rpc("claim_reminder"');
    const sendAt = source.indexOf("await sendLessonReminder(");
    expect(claimAt, "claim_reminder must be called").toBeGreaterThan(-1);
    expect(sendAt, "sendLessonReminder must be called").toBeGreaterThan(-1);
    expect(sendAt, "the claim must precede the send").toBeGreaterThan(claimAt);

    // A failed send must give the claim back, or one outage burns the reminder.
    expect(source).toMatch(/rpc\("release_reminder_claim"/);

    // The old check-then-act shape must not come back.
    expect(source).not.toMatch(/eq\("event", "reminder_sent"\)/);
  });

  it("a partial unique index backs the claim at the database level", () => {
    const sql = readFileSync(
      join(ROOT, "supabase/migrations/0006_reminder_claim.sql"),
      "utf8"
    );
    expect(sql).toMatch(/create unique index[\s\S]*booking_events \(booking_id\)[\s\S]*where event = 'reminder_sent'/i);
    expect(sql).toMatch(/on conflict do nothing/i);
  });
});
