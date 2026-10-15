// app/api/edt/[token]/second-instalment/route.ts
// Creates a Stripe Checkout session for the 2nd instalment of an edt-split package.
// Triggered when the customer has used all 6 first-instalment lessons.
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase-server";
import { SERVICES } from "@/lib/pricing";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thedrivingschooldublin.com";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const { data: pkg, error: pkgErr } = await supabaseServer
      .from("edt_packages")
      .select("*")
      .eq("access_token", token)
      .single();

    if (pkgErr || !pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    if (pkg.package_type !== "split") {
      return NextResponse.json(
        { error: "This package does not support a second instalment" },
        { status: 400 }
      );
    }

    if (pkg.second_instalment_paid) {
      return NextResponse.json({ error: "Second instalment already paid" }, { status: 409 });
    }

    if (pkg.lessons_used < pkg.lessons_total) {
      return NextResponse.json(
        { error: "Please complete all sessions in your current package before paying the second instalment" },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-07-30.basil",
    });

    const service = SERVICES["edt-split"];

    // Create a booking record for audit trail
    const { data: booking, error: bErr } = await supabaseServer
      .from("bookings")
      .insert({
        service_type: "edt-split-2",
        customer_name: pkg.customer_name,
        customer_email: pkg.customer_email,
        customer_phone: "",
        payment_status: "pending",
        amount_pence: service.pricePence,
        notes: `Second instalment for EDT package ${pkg.id}`,
      })
      .select()
      .single();

    if (bErr || !booking) {
      return NextResponse.json({ error: bErr?.message ?? "Failed to create booking" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: pkg.customer_email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: service.pricePence,
            product_data: {
              name: "EDT Bundle, second instalment (lessons 7-12)",
              description: "Pay for lessons 7 to 12 of your EDT split-payment bundle.",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id: booking.id,
        service_type: "edt-split-2",
        edt_package_id: pkg.id,
      },
      payment_intent_data: {
        metadata: {
          booking_id: booking.id,
          service_type: "edt-split-2",
          edt_package_id: pkg.id,
        },
      },
      success_url: `${BASE_URL}/book/${token}?second_instalment=paid`,
      cancel_url: `${BASE_URL}/book/${token}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    await supabaseServer
      .from("bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", booking.id);

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    console.error("[edt/second-instalment]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}
