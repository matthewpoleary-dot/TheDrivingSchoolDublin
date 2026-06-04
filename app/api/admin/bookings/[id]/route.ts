// app/api/admin/bookings/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { emailOnStatusChange } from "@/lib/email";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

type PatchBody = { payment_status?: "cancelled" | "refunded" };

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const hdr = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = hdr?.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token || token !== ADMIN_TOKEN) return unauthorized();

    const { id } = await ctx.params;
    const body = (await req.json()) as PatchBody;
    const newStatus = body.payment_status;

    if (!newStatus || !["cancelled", "refunded"].includes(newStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Fetch booking with slot details
    const { data: booking, error: bErr } = await supabaseServer
      .from("bookings")
      .select(`
        id, service_type, customer_name, customer_email, customer_phone, slot_id,
        slot:availability_slots(date, start_time)
      `)
      .eq("id", id)
      .single();

    if (bErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Update payment_status
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
    const startsAtISO = slot ? `${slot.date}T${slot.start_time}+01:00` : new Date().toISOString();

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
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}
