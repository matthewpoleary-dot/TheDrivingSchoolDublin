// redesign/fixtures.mjs — deterministic API responses for the screenshot sweep.
// Every /api/* request the browser makes is answered from here, so a sweep never
// touches Supabase, Stripe, Google Calendar or Resend, and two sweeps of the same
// commit produce identical pixels.

// The clock is frozen at this instant (Monday) for every state.
export const FROZEN_NOW = new Date("2026-09-21T09:00:00+01:00");

const slot = (id, date, start, end, extra = {}) => ({
  id, date, start_time: `${start}:00`, end_time: `${end}:00`, duration_minutes: 60, ...extra,
});

// Public availability (BookingCalendar)
export const AVAILABILITY = [
  slot("a1", "2026-09-22", "10:00", "11:00"),
  slot("a2", "2026-09-22", "11:30", "12:30"),
  slot("a3", "2026-09-22", "14:00", "15:00"),
  slot("a4", "2026-09-22", "16:30", "17:30"),
  slot("a5", "2026-09-24", "09:00", "10:00"),
  slot("a6", "2026-09-29", "16:00", "17:00"),
  slot("a7", "2026-10-02", "08:00", "09:00"),
];

// Admin calendar week (21–27 Sep 2026)
const ALL_TYPES = ["standard", "pre-test", "refresher", "edt-6", "edt-bundle", "car-hire"];
const open = (id, date, start, end) => ({ ...slot(id, date, start, end), lesson_types: ALL_TYPES, is_booked: false, booking: null });
export const ADMIN_SLOTS = [
  open("s1", "2026-09-21", "07:00", "08:00"),
  {
    ...slot("s2", "2026-09-21", "10:00", "11:00"), lesson_types: ALL_TYPES, is_booked: true,
    booking: {
      customer_name: "Aoife Byrne", customer_email: "aoife@example.com", customer_phone: "+353 86 000 0001",
      service_type: "standard", payment_status: "paid", amount_pence: 8000, notes: "Pickup area: D6. First lesson.",
      source: "regular",
    },
  },
  open("s3", "2026-09-22", "09:00", "10:00"),
  open("s4", "2026-09-22", "10:30", "11:30"),
  {
    ...slot("s5", "2026-09-23", "14:00", "15:00"), lesson_types: ALL_TYPES, is_booked: true,
    booking: {
      customer_name: "Ciarán Walsh", customer_email: "ciaran@example.com", customer_phone: "+353 86 000 0002",
      service_type: "edt-bundle", payment_status: "paid", amount_pence: 0, notes: null,
      source: "edt", edt_session_number: 3, edt_package_total: 12,
    },
  },
  { ...slot("s6", "2026-09-24", "11:00", "12:00"), lesson_types: ALL_TYPES, is_booked: true, booking: null }, // orphan
  open("s7", "2026-09-25", "08:00", "09:00"),
  open("s8", "2026-09-25", "13:00", "14:00"),
];

export const ADMIN_BOOKINGS = [
  {
    id: "b1", slot_id: "s2", service_type: "standard", customer_name: "Aoife Byrne", customer_email: "aoife@example.com",
    customer_phone: "+353 86 000 0001", payment_status: "paid", amount_pence: 8000, created_at: "2026-09-18T10:00:00Z",
    notes: null, slot: { date: "2026-09-21", start_time: "10:00:00", end_time: "11:00:00" },
  },
  {
    id: "b2", slot_id: null, service_type: "edt-bundle", customer_name: "Ciarán Walsh", customer_email: "ciaran@example.com",
    customer_phone: "+353 86 000 0002", payment_status: "paid", amount_pence: 90500, created_at: "2026-09-10T10:00:00Z",
    notes: null, slot: null,
  },
  {
    id: "b3", slot_id: "x", service_type: "pre-test", customer_name: "Sam Doyle", customer_email: "sam@example.com",
    customer_phone: "", payment_status: "pending", amount_pence: 10000, created_at: "2026-09-19T10:00:00Z",
    notes: null, slot: { date: "2026-09-26", start_time: "09:00:00", end_time: "11:00:00" },
  },
  {
    id: "b4", slot_id: "y", service_type: "refresher", customer_name: "Jo Kelly", customer_email: "jo@example.com",
    customer_phone: "+353 86 000 0004", payment_status: "refunded", amount_pence: 8000, created_at: "2026-09-01T10:00:00Z",
    notes: null, slot: { date: "2026-09-05", start_time: "15:00:00", end_time: "16:00:00" },
  },
];

export const EDT_PACKAGES = [
  { id: "p1", customer_name: "Ciarán Walsh", customer_email: "ciaran@example.com", lessons_total: 12, lessons_used: 3, expires_at: "2027-09-10" },
  { id: "p2", customer_name: "Niamh Ryan", customer_email: "niamh@example.com", lessons_total: 6, lessons_used: 0, expires_at: "2027-08-01" },
];

export const EDT_SESSIONS = {
  p1: [
    { id: "e1", status: "completed", lesson_number: 1, created_at: "", slot: { date: "2026-09-12", start_time: "10:00:00", end_time: "11:00:00" } },
    { id: "e2", status: "cancelled", lesson_number: 2, created_at: "", slot: { date: "2026-09-16", start_time: "10:00:00", end_time: "11:00:00" } },
    { id: "e3", status: "scheduled", lesson_number: 3, created_at: "", slot: { date: "2026-09-23", start_time: "14:00:00", end_time: "15:00:00" } },
    { id: "e4", status: "scheduled", lesson_number: null, created_at: "", slot: null },
  ],
  p2: [],
};

const pkg = (over) => ({
  id: "p1", customer_name: "Ciarán Walsh", customer_email: "ciaran@example.com", lessons_total: 12, lessons_used: 3,
  remaining: 9, expires_at: "2027-09-10", expired: false, active_sessions: 1, ...over,
});
export const EDT_TOKENS = {
  demo: pkg({}),
  "demo-fail": pkg({}),
  expired: pkg({ expired: true, expires_at: "2026-08-01", lessons_used: 7, remaining: 5 }),
  complete: pkg({ lessons_used: 12, remaining: 0 }),
  busy: pkg({ active_sessions: 2 }),
};

export const CHECKOUT_SESSIONS = {
  lesson: { customer_email: "aoife@example.com", amount_total: 8000, metadata: { service_type: "standard", booking_id: "b1" }, payment_status: "paid" },
  edt: { customer_email: "ciaran@example.com", amount_total: 90500, metadata: { service_type: "edt-bundle", booking_id: "b2" }, payment_status: "paid" },
};

/**
 * Default responder. `overrides` is a map of "METHOD /path/pattern" → (url) => [status, body]
 * checked first, so a state can force an error or an empty list.
 */
export function respond(method, url, overrides = {}) {
  const p = url.pathname;
  for (const [key, fn] of Object.entries(overrides)) {
    const [m, re] = key.split(" ");
    if (m === method && new RegExp(`^${re}$`).test(p)) return fn(url);
  }

  // The admin screen signs in through the server (sets the admin cookie); any password works here.
  if (method === "POST" && p === "/api/admin/login") return [200, { ok: true }];
  if (method === "GET" && p === "/api/availability") return [200, AVAILABILITY];
  if (method === "GET" && p === "/api/admin/slots") return [200, ADMIN_SLOTS];
  if (method === "GET" && p === "/api/admin/bookings") return [200, ADMIN_BOOKINGS];
  if (method === "GET" && p === "/api/admin/edt-packages") return [200, EDT_PACKAGES];
  let m;
  if (method === "GET" && (m = p.match(/^\/api\/admin\/edt-packages\/([^/]+)\/sessions$/))) return [200, EDT_SESSIONS[m[1]] ?? []];
  if (method === "POST" && p === "/api/availability") return [200, { created: 42 }];
  if (method === "DELETE" && p.startsWith("/api/availability/")) return [200, { ok: true }];
  if (method === "GET" && (m = p.match(/^\/api\/edt\/([^/]+)$/))) {
    const d = EDT_TOKENS[m[1]];
    return d ? [200, d] : [404, { error: "This booking link is invalid or has been revoked." }];
  }
  if (method === "POST" && (m = p.match(/^\/api\/edt\/([^/]+)\/book$/))) {
    return m[1] === "demo-fail"
      ? [409, { error: "That slot was just taken. Please pick another time." }]
      : [200, { ok: true }];
  }
  if (method === "GET" && p === "/api/checkout/session") {
    return [200, CHECKOUT_SESSIONS[url.searchParams.get("id")] ?? {}];
  }
  if (method === "POST" && p === "/api/checkout") return [400, { error: "That slot is no longer available." }];
  if (method === "POST" && p === "/api/contact") return [200, { ok: true }];
  return [404, { error: `No fixture for ${method} ${p}` }];
}
