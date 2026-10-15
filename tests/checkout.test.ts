import { describe, it, expect, vi, beforeEach } from "vitest";
import { find, type Op } from "./helpers/supabase-mock";

const h = vi.hoisted(() => ({
  respond: (() => ({})) as (op: unknown) => Record<string, unknown>,
  calls: [] as unknown[],
  createSession: vi.fn(),
}));

vi.mock("@/lib/supabase-server", async () => {
  const { createSupabaseMock } = await import("./helpers/supabase-mock");
  const m = createSupabaseMock((op) => h.respond(op));
  h.calls = m.calls;
  return { supabaseServer: m.client };
});
vi.mock("stripe", () => ({
  default: class {
    checkout = { sessions: { create: h.createSession } };
  },
}));

import { POST } from "@/app/api/checkout/route";

const calls = () => h.calls as Op[];
const SLOT = "6f1c2a4e-1b2c-4d3e-8f9a-0b1c2d3e4f5a";
const valid = {
  slot_id: SLOT,
  service_type: "standard",
  customer_name: "Ann Byrne",
  customer_email: "ann@example.ie",
  customer_phone: "087 123 4567",
};
const post = (body: unknown) =>
  POST(new Request("http://x/api/checkout", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  (h.calls as unknown[]).length = 0;
  h.respond = () => ({});
  h.createSession.mockReset().mockResolvedValue({ id: "cs_1", url: "https://checkout.stripe.test/cs_1" });
});

describe("checkout", () => {
  it.each([
    ["bad email", { ...valid, customer_email: "nope" }],
    ["unknown service", { ...valid, service_type: "free-lesson" }],
    ["empty name", { ...valid, customer_name: "" }],
    ["bad phone", { ...valid, customer_phone: "abc" }],
    ["non-uuid slot", { ...valid, slot_id: "123" }],
  ])("rejects %s with 400 and touches nothing", async (_, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(calls()).toHaveLength(0);
    expect(h.createSession).not.toHaveBeenCalled();
  });

  it("returns 409 when the slot is actively held", async () => {
    h.respond = (op: unknown) =>
      (op as Op).table === "availability_slots"
        ? { data: { id: SLOT, is_booked: false, held_until: new Date(Date.now() + 600_000).toISOString() } }
        : {};
    const res = await post(valid);
    expect(res.status).toBe(409);
    expect(find(calls(), "bookings", "insert")).toHaveLength(0);
  });

  it("returns 409 and deletes the pending booking when the atomic hold loses the race", async () => {
    h.respond = (op: unknown) => {
      const o = op as Op;
      if (o.table === "availability_slots") return { data: { id: SLOT, is_booked: false, held_until: null } };
      if (o.table === "bookings" && o.action === "insert") return { data: { id: "b1" } };
      if (o.action === "rpc") return { data: [] };
      return {};
    };
    const res = await post(valid);
    expect(res.status).toBe(409);
    expect(find(calls(), "bookings", "delete")[0].filters).toContainEqual(["eq", "id", "b1"]);
    expect(h.createSession).not.toHaveBeenCalled();
  });

  it("happy path holds the slot and puts booking_id on the PaymentIntent", async () => {
    h.respond = (op: unknown) => {
      const o = op as Op;
      if (o.table === "availability_slots") return { data: { id: SLOT, is_booked: false, held_until: null } };
      if (o.table === "bookings" && o.action === "insert") return { data: { id: "b1" } };
      if (o.action === "rpc") return { data: [{ id: SLOT }] };
      return {};
    };
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://checkout.stripe.test/cs_1" });
    const args = h.createSession.mock.calls[0][0];
    expect(args.payment_intent_data.metadata.booking_id).toBe("b1");
    expect(args.cancel_url).toContain("/book?service=standard&cancelled=1");
  });
});
