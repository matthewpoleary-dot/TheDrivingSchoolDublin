// app/api/admin/bookings/[id]/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { emailOnStatusChange } from "@/lib/email";
import { dublinLocalToUtcISO } from "@/lib/time";

type PatchBody = { payment_status?: "cancelled" | "refunded" };

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);

    const { id } = await ctx.params;
    const body = (await req.json()) as PatchBody;
    const newStatus = body.payment_status;

    if (!newStatus || !["cancelled", "refunded"].includes(newStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Fetch booking with slot details and stripe fields
    const { data: booking, error: bErr } = await supabaseServer
      .from("bookings")
      .select(`
        id, service_type, customer_name, customer_email, customer_phone, slot_id,
        payment_status, stripe_payment_intent, stripe_refund_id, amount_pence,
        slot:availability_slots(date, start_time)
      `)
      .eq("id", id)
      .single();

    if (bErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Handle refund flow
    if (newStatus === "refunded") {
      // Idempotency: already refunded
      if (booking.payment_status === "refunded") {
        return NextResponse.json({ ok: true, idempotent: true });
      }

      if (!booking.stripe_payment_intent) {
        return NextResponse.json(
          { error: "Cannot refund: no payment intent on record. Was this booking paid via Stripe?" },
          { status: 400 }
        );
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-07-30.basil",
      });

      let refund: Stripe.Refund;
      try {
        refund = await stripe.refunds.create(
          { payment_intent: booking.stripe_payment_intent },
          { idempotencyKey: `refund-${id}` }
        );
      } catch (e: unknown) {
        const stripeErr = e as Stripe.errors.StripeError;
        if (stripeErr?.code === "charge_already_refunded") {
          // Treat as success — refund already happened in Stripe
          await supabaseServer
            .from("bookings")
            .update({ payment_status: "refunded" })
            .eq("id", id);
        } else {
          return NextResponse.json(
            { error: stripeErr?.message ?? "Stripe refund failed" },
            { status: 402 }
          );
        }
        // Free the slot
        if (booking.slot_id) {
          await supabaseServer
            .from("availability_slots")
            .update({ is_booked: false, booking_id: null })
            .eq("id", booking.slot_id);
        }
        return NextResponse.json({ ok: true });
      }

      // Update DB with refund result
      const { error: uErr } = await supabaseServer
        .from("bookings")
        .update({ payment_status: "refunded", stripe_refund_id: refund.id })
        .eq("id", id);

      if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

      // Free the slot
      if (booking.slot_id) {
        await supabaseServer
          .from("availability_slots")
          .update({ is_booked: false, booking_id: null })
          .eq("id", booking.slot_id);
      }

      // Send cancellation email (refund = cancelled from customer perspective)
      const slot = Array.isArray(booking.slot) ? (booking.slot[0] ?? null) : (booking.slot as { date: string; start_time: string } | null);
      const startsAtISO = slot ? dublinLocalToUtcISO(slot.date, slot.start_time) : new Date().toISOString();

      emailOnStatusChange({
        bookingId: booking.id,
        status: "cancelled",
        serviceName: booking.service_type,
        startsAtISO,
        client: {
          name: booking.customer_name,
          email: booking.customer_email,
          phone: booking.customer_phone ?? null,
        },
      }).catch((err: unknown) => {
        console.error("emailOnStatusChange failed:", err instanceof Error ? err.message : err);
      });

      return NextResponse.json({ ok: true, refund_id: refund.id });
    }

    // Handle cancellation flow
    const { error: uErr } = await supabaseServer
      .from("bookings")
      .update({ payment_status: newStatus })
      .eq("id", id);

    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

    // Free up the slot if cancelling
    if (newStatus === "cancelled" && booking.slot_id) {
      await supabaseServer
        .from("availability_slots")
        .update({ is_booked: false, booking_id: null })
        .eq("id", booking.slot_id);
    }

    // Send status change emails
    const slot = Array.isArray(booking.slot) ? (booking.slot[0] ?? null) : (booking.slot as { date: string; start_time: string } | null);
    const startsAtISO = slot ? dublinLocalToUtcISO(slot.date, slot.start_time) : new Date().toISOString();

    emailOnStatusChange({
      bookingId: booking.id,
      status: newStatus as "cancelled",
      serviceName: booking.service_type,
      startsAtISO,
      client: {
        name: booking.customer_name,
        email: booking.customer_email,
        phone: booking.customer_phone ?? null,
      },
    }).catch((err: unknown) => {
      console.error("emailOnStatusChange failed:", err instanceof Error ? err.message : err);
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    if (msg === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
