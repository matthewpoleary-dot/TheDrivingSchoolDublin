// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase-server";
import { SERVICES } from "@/lib/pricing";
import { ALL_SERVICE_SLUGS } from "@/lib/services";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[checkout] STRIPE_SECRET_KEY is not set");
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thedrivingschooldublin.com";

const CheckoutSchema = z.object({
  slot_id: z.string().uuid("slot_id must be a UUID").optional(),
  service_type: z.enum(ALL_SERVICE_SLUGS as unknown as [string, ...string[]]).refine(
    (v) => (ALL_SERVICE_SLUGS as string[]).includes(v),
    { message: "Unknown service type" }
  ),
  customer_name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  customer_email: z.string().email("Invalid email address"),
  customer_phone: z
    .string()
    .regex(/^[+\d\s\-()\\.]{7,20}$/, "Invalid phone number"),
  notes: z.string().max(500, "Notes too long").optional(),
});

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured yet. Please add your Stripe keys to get started." },
        { status: 503 }
      );
    }

    const rawBody = await req.json();
    const parsed = CheckoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { slot_id, service_type, customer_name, customer_email, customer_phone, notes } = parsed.data;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-07-30.basil",
    });

    const service = SERVICES[service_type as keyof typeof SERVICES];
    if (!service) {
      return NextResponse.json({ error: "Unknown service type" }, { status: 400 });
    }

    // EDT packages (bundle, 6-lesson, split-pay) don't need a slot
    const isEdtPackage =
      service_type === "edt-bundle" ||
      service_type === "edt-6" ||
      service_type === "edt-split";

    if (!isEdtPackage) {
      if (!slot_id) {
        return NextResponse.json({ error: "slot_id is required for this service" }, { status: 400 });
      }
      const { data: slot, error: slotErr } = await supabaseServer
        .from("availability_slots")
        .select("id, is_booked, held_until, held_by_booking")
        .eq("id", slot_id)
        .single();

      if (slotErr || !slot) {
        return NextResponse.json({ error: "Slot not found" }, { status: 404 });
      }
      if (slot.is_booked) {
        return NextResponse.json({ error: "This slot has just been taken. Please choose another." }, { status: 409 });
      }
      // Check active hold by someone else
      if (slot.held_until && new Date(slot.held_until) > new Date()) {
        return NextResponse.json({ error: "This slot is temporarily held. Please try again in a few minutes." }, { status: 409 });
      }
    }

    // Create pending booking
    const { data: booking, error: bookingErr } = await supabaseServer
      .from("bookings")
      .insert({
        slot_id: slot_id ?? null,
        service_type,
        customer_name,
        customer_email,
        customer_phone,
        payment_status: "pending",
        amount_pence: service.pricePence,
        notes: notes ?? null,
      })
      .select()
      .single();

    if (bookingErr || !booking) {
      // 23505: uq_booking_slot_active, another checkout already holds this slot
      if (bookingErr?.code === "23505") {
        return NextResponse.json(
          { error: "This slot has just been taken. Please choose another." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: bookingErr?.message ?? "Failed to create booking" }, { status: 500 });
    }

    // Atomically hold the slot (prevents double-booking)
    if (slot_id && !isEdtPackage) {
      const { data: held } = await supabaseServer.rpc("hold_slot", {
        p_slot_id: slot_id,
        p_booking_id: booking.id,
        p_minutes: 35,
      });
      if (!held || (Array.isArray(held) && held.length === 0)) {
        // Slot was grabbed between our check and the RPC — roll back the booking
        await supabaseServer.from("bookings").delete().eq("id", booking.id);
        return NextResponse.json(
          { error: "This slot has just been taken. Please choose another." },
          { status: 409 }
        );
      }
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: service.pricePence,
            product_data: {
              name: service.label,
              description: service.description,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id: booking.id,
        service_type,
        slot_id: slot_id ?? "",
      },
      // Also store on PaymentIntent so payment_intent.payment_failed can find the booking
      payment_intent_data: {
        metadata: {
          booking_id: booking.id,
          service_type,
          slot_id: slot_id ?? "",
        },
      },
      success_url: `${BASE_URL}/book/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/book?service=${service_type}&cancelled=1`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min; hold is 35 min
    });

    // Store stripe session id on the booking
    await supabaseServer
      .from("bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", booking.id);

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    console.error("[checkout]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
