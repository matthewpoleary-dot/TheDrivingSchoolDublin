// app/api/checkout/session/route.ts
// Used by the confirmation page to show receipt details
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(id);

    // Only return safe, minimal fields
    return NextResponse.json({
      customer_email: session.customer_email,
      amount_total: session.amount_total,
      payment_status: session.payment_status,
      metadata: session.metadata,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Not found" }, { status: 404 });
  }
}
