import { describe, it, expect, vi, beforeEach } from "vitest";
import { find, type Op } from "./helpers/supabase-mock";

const h = vi.hoisted(() => ({
  respond: (() => ({})) as (op: unknown) => Record<string, unknown>,
  calls: [] as unknown[],
  refundCreate: vi.fn(),
  order: [] as string[],
}));

vi.mock("@/lib/supabase-server", async () => {
  const { createSupabaseMock } = await import("./helpers/supabase-mock");
  const m = createSupabaseMock((op) => {
    if (op.action === "update") h.order.push(`db:${op.table}`);
    return h.respond(op);
  });
  h.calls = m.calls;
  return { supabaseServer: m.client };
});
vi.mock("stripe", () => ({
  default: class {
    refunds = { create: h.refundCreate };
  },
}));
vi.mock("@/lib/email", () => ({ emailOnStatusChange: vi.fn().mockResolvedValue(undefined) }));

import { PATCH } from "@/app/api/admin/bookings/[id]/route";

const calls = () => h.calls as Op[];
const paid = {
  id: "b1", service_type: "standard", customer_name: "Ann", customer_email: "ann@x.ie",
  customer_phone: "087", slot_id: "s1", payment_status: "paid", stripe_payment_intent: "pi_1",
  amount_pence: 5500, slot: { date: "2026-11-02", start_time: "10:00:00" },
};
const patch = (body: unknown, token = "test-admin-token-1234567890") =>
  PATCH(
    new Request("http://x/api/admin/bookings/b1", {
      method: "PATCH",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "b1" }) }
  );

beforeEach(() => {
  (h.calls as unknown[]).length = 0;
  h.order.length = 0;
  h.respond = (op: unknown) => ((op as Op).action === "select" ? { data: paid } : {});
  h.refundCreate.mockReset().mockImplementation(async () => {
    h.order.push("stripe:refund");
    return { id: "re_1" };
  });
});

describe("admin refund", () => {
  it("rejects a wrong admin token", async () => {
    const res = await patch({ payment_status: "refunded" }, "wrong");
    expect(res.status).toBe(401);
    expect(h.refundCreate).not.toHaveBeenCalled();
  });

  it("calls Stripe before touching the DB, with an idempotency key", async () => {
    const res = await patch({ payment_status: "refunded" });
    expect(res.status).toBe(200);
    expect(h.order[0]).toBe("stripe:refund");
    expect(h.refundCreate).toHaveBeenCalledWith({ payment_intent: "pi_1" }, { idempotencyKey: "refund-b1" });
    expect(find(calls(), "bookings", "update")[0].payload).toEqual({ payment_status: "refunded", stripe_refund_id: "re_1" });
    expect(find(calls(), "availability_slots", "update")[0].payload).toEqual({ is_booked: false, booking_id: null });
  });

  it("a Stripe error leaves the DB unchanged", async () => {
    h.refundCreate.mockRejectedValue({ code: "card_declined", message: "nope" });
    const res = await patch({ payment_status: "refunded" });
    expect(res.status).toBe(402);
    expect(calls().filter((c) => c.action === "update")).toHaveLength(0);
  });

  it("an already-refunded booking is idempotent and does not call Stripe", async () => {
    h.respond = (op: unknown) =>
      (op as Op).action === "select" ? { data: { ...paid, payment_status: "refunded" } } : {};
    const res = await patch({ payment_status: "refunded" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ idempotent: true });
    expect(h.refundCreate).not.toHaveBeenCalled();
  });

  it("charge_already_refunded from Stripe is treated as success", async () => {
    h.refundCreate.mockRejectedValue({ code: "charge_already_refunded" });
    const res = await patch({ payment_status: "refunded" });
    expect(res.status).toBe(200);
    expect(find(calls(), "bookings", "update")[0].payload).toEqual({ payment_status: "refunded" });
  });
});
