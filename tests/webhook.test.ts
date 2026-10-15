import { describe, it, expect, vi, beforeEach } from "vitest";
import { find, type Op } from "./helpers/supabase-mock";

const h = vi.hoisted(() => ({
  respond: (() => ({})) as (op: unknown) => Record<string, unknown>,
  calls: [] as unknown[],
  event: null as unknown,
  emailOnBooking: vi.fn(),
  emailOnEdt: vi.fn(),
  createCalendarEvent: vi.fn(),
}));

vi.mock("@/lib/supabase-server", async () => {
  const { createSupabaseMock } = await import("./helpers/supabase-mock");
  const m = createSupabaseMock((op) => h.respond(op));
  h.calls = m.calls;
  return { supabaseServer: m.client };
});
vi.mock("stripe", () => ({
  default: class {
    webhooks = { constructEvent: () => h.event };
  },
}));
vi.mock("@/lib/email", () => ({
  emailOnBooking: h.emailOnBooking,
  emailOnEdtPackageCreated: h.emailOnEdt,
}));
vi.mock("@/lib/google-calendar", () => ({ createCalendarEvent: h.createCalendarEvent }));

import { POST } from "@/app/api/webhooks/stripe/route";

const calls = () => h.calls as Op[];
const send = (event: unknown) => {
  h.event = event;
  return POST(new Request("http://x/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "sig" },
    body: "{}",
  }));
};

const paidBooking = {
  id: "b1", customer_name: "Ann", customer_email: "ann@x.ie", customer_phone: "0871234567",
  amount_pence: 5500, notes: null, google_calendar_event_id: null,
};

beforeEach(() => {
  (h.calls as unknown[]).length = 0;
  h.respond = () => ({});
  h.emailOnBooking.mockReset().mockResolvedValue(undefined);
  h.emailOnEdt.mockReset().mockResolvedValue(undefined);
  h.createCalendarEvent.mockReset().mockResolvedValue("gcal-1");
});

describe("stripe webhook", () => {
  it("checkout.session.completed marks booking paid and locks the slot", async () => {
    h.respond = (op: unknown) => {
      const o = op as Op;
      if (o.table === "bookings" && o.action === "update") return { data: paidBooking };
      if (o.table === "availability_slots" && o.action === "select")
        return { data: { date: "2026-11-02", start_time: "10:00:00", end_time: "11:00:00" } };
      return {};
    };
    const res = await send({
      id: "evt_1", type: "checkout.session.completed",
      data: { object: { payment_intent: "pi_1", metadata: { booking_id: "b1", service_type: "standard", slot_id: "s1" } } },
    });
    expect(res.status).toBe(200);
    const bookingUpdate = find(calls(), "bookings", "update")[0];
    expect(bookingUpdate.payload).toMatchObject({ payment_status: "paid", stripe_payment_intent: "pi_1" });
    const slotUpdate = find(calls(), "availability_slots", "update")[0];
    expect(slotUpdate.payload).toEqual({ is_booked: true, booking_id: "b1", held_until: null, held_by_booking: null });
    expect(slotUpdate.filters).toContainEqual(["eq", "id", "s1"]);
    expect(h.emailOnBooking).toHaveBeenCalledOnce();
  });

  it("a replayed event is a no-op", async () => {
    h.respond = (op: unknown) =>
      (op as Op).table === "stripe_events" ? { error: { code: "23505" } } : {};
    const res = await send({
      id: "evt_1", type: "checkout.session.completed",
      data: { object: { metadata: { booking_id: "b1", service_type: "standard", slot_id: "s1" } } },
    });
    expect(res.status).toBe(200);
    expect(calls().filter((c) => c.table !== "stripe_events")).toHaveLength(0);
    expect(h.emailOnBooking).not.toHaveBeenCalled();
  });

  it("checkout.session.expired cancels the pending booking and releases the hold", async () => {
    h.respond = (op: unknown) => {
      const o = op as Op;
      if (o.table === "bookings" && o.action === "select")
        return { data: { id: "b1", slot_id: "s1", payment_status: "pending" } };
      return {};
    };
    const res = await send({ id: "evt_2", type: "checkout.session.expired", data: { object: { id: "cs_1" } } });
    expect(res.status).toBe(200);
    expect(find(calls(), "bookings", "update")[0].payload).toEqual({ payment_status: "cancelled" });
    const slot = find(calls(), "availability_slots", "update")[0];
    expect(slot.payload).toEqual({ held_until: null, held_by_booking: null });
    expect(slot.filters).toContainEqual(["eq", "is_booked", false]);
  });

  it("checkout.session.expired leaves an already-paid booking alone", async () => {
    h.respond = (op: unknown) =>
      (op as Op).table === "bookings" ? { data: { id: "b1", slot_id: "s1", payment_status: "paid" } } : {};
    await send({ id: "evt_3", type: "checkout.session.expired", data: { object: { id: "cs_1" } } });
    expect(find(calls(), "bookings", "update")).toHaveLength(0);
    expect(find(calls(), "availability_slots", "update")).toHaveLength(0);
  });

  it("payment_intent.payment_failed matches via metadata and does not release the slot", async () => {
    const res = await send({
      id: "evt_4", type: "payment_intent.payment_failed",
      data: { object: { id: "pi_1", metadata: { booking_id: "b1" } } },
    });
    expect(res.status).toBe(200);
    const upd = find(calls(), "bookings", "update")[0];
    expect(upd.payload).toEqual({ payment_status: "failed" });
    expect(upd.filters).toContainEqual(["eq", "id", "b1"]);
    expect(find(calls(), "availability_slots", "update")).toHaveLength(0);
  });

  it("charge.refunded syncs the booking to refunded and frees the slot", async () => {
    h.respond = (op: unknown) => {
      const o = op as Op;
      if (o.table === "bookings" && o.action === "select")
        return { data: { id: "b1", slot_id: "s1", payment_status: "paid" } };
      return {};
    };
    await send({ id: "evt_5", type: "charge.refunded", data: { object: { payment_intent: "pi_1" } } });
    expect(find(calls(), "bookings", "update")[0].payload).toEqual({ payment_status: "refunded" });
    expect(find(calls(), "availability_slots", "update")[0].payload).toEqual({ is_booked: false, booking_id: null });
  });

  it("an email failure still returns 200", async () => {
    h.emailOnBooking.mockRejectedValue(new Error("Resend down"));
    h.respond = (op: unknown) => {
      const o = op as Op;
      if (o.table === "bookings" && o.action === "update") return { data: paidBooking };
      if (o.table === "availability_slots" && o.action === "select")
        return { data: { date: "2026-11-02", start_time: "10:00:00", end_time: "11:00:00" } };
      return {};
    };
    const res = await send({
      id: "evt_6", type: "checkout.session.completed",
      data: { object: { payment_intent: "pi_1", metadata: { booking_id: "b1", service_type: "standard", slot_id: "s1" } } },
    });
    expect(res.status).toBe(200);
  });

  it("a handler crash forgets the event so Stripe's retry is processed", async () => {
    h.respond = (op: unknown) => {
      const o = op as Op;
      if (o.table === "bookings" && o.action === "select") throw new Error("db down");
      return {};
    };
    const res = await send({ id: "evt_7", type: "checkout.session.expired", data: { object: { id: "cs_1" } } });
    expect(res.status).toBe(500);
    const del = find(calls(), "stripe_events", "delete");
    expect(del).toHaveLength(1);
    expect(del[0].filters).toContainEqual(["eq", "id", "evt_7"]);
  });

  it("EDT bundle purchase creates a 12-lesson package", async () => {
    h.respond = (op: unknown) => {
      const o = op as Op;
      if (o.table === "bookings" && o.action === "update") return { data: paidBooking };
      if (o.table === "edt_packages" && o.action === "insert") return { data: { id: "p1", access_token: "tok" } };
      return {};
    };
    await send({
      id: "evt_8", type: "checkout.session.completed",
      data: { object: { payment_intent: "pi_1", metadata: { booking_id: "b1", service_type: "edt-bundle", slot_id: "" } } },
    });
    expect(find(calls(), "edt_packages", "insert")[0].payload).toMatchObject({ lessons_total: 12, lessons_used: 0, package_type: "standard" });
    expect(find(calls(), "availability_slots", "update")).toHaveLength(0);
    expect(h.emailOnEdt).toHaveBeenCalledOnce();
  });
});
