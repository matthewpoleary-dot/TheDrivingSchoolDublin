// app/api/availability/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";

// DELETE /api/availability/[id] — admin only
// Deletes any slot. If the slot was booked, also marks the booking as cancelled.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const { data: slot, error: fetchErr } = await supabaseServer
      .from("availability_slots")
      .select("is_booked, booking_id")
      .eq("id", id)
      .single();

    if (fetchErr || !slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    // If booked, mark the linked booking as cancelled before deleting
    if (slot.is_booked && slot.booking_id) {
      await supabaseServer
        .from("bookings")
        .update({ payment_status: "cancelled" })
        .eq("id", slot.booking_id);
    }

    const { error } = await supabaseServer
      .from("availability_slots")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, was_booked: slot.is_booked });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    if (msg === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
