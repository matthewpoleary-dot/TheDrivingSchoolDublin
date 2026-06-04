// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase-server";
import { SERVICES, type ServiceSlug } from "@/lib/pricing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thedrivingschooldublin.com";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      slot_id?: string;
      service_type: ServiceSlug;
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      notes?: string;
    };

    const { slot_id, service_type, customer_name, customer_email, customer_phone, notes } = body;

    if (!service_type || !customer_name || !customer_email || !customer_phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const service = SERVICES[service_type];
    if (!service) {
      return NextResponse.json({ error: "Unknown service type" }, { status: 400 });
    }

    // For slot-based services (not edt-bundle), validate the slot is still free
    if (service_type !== "edt-bundle" && service_type !== "edt-6") {
      if (!slot_id) {
        return NextResponse.json({ error: "slot_id is required for this service" }, { status: 400 });
      }
      const { data: slot, error: slotErr } = await supabaseServer
        .from("availability_slots")
        .select("id, is_booked")
        .eq("id", slot_id)
        .single();

      if (slotErr || !slot) {
        return NextResponse.json({ error: "Slot not found" }, { status: 404 });
      }
      if (slot.is_booked) {
        return NextResponse.json({ error: "This slot has just been taken. Please choose another." }, { status: 409 });
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
      return NextResponse.json({ error: bookingErr?.message ?? "Failed to create booking" }, { status: 500 });
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
      success_url: `${BASE_URL}/book/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/book?service=${service_type}&cancelled=1`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
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
