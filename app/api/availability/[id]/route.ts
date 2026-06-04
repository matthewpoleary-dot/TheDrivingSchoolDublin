// app/api/availability/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";

// DELETE /api/availability/[id] — admin only, only removes unbooked slots
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    // Guard: don't delete a booked slot
    const { data: slot, error: fetchErr } = await supabaseServer
      .from("availability_slots")
      .select("is_booked")
      .eq("id", id)
      .single();

    if (fetchErr || !slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }
    if (slot.is_booked) {
      return NextResponse.json(
        { error: "Cannot delete a booked slot. Cancel the booking first." },
        { status: 409 }
      );
    }

    const { error } = await supabaseServer
      .from("availability_slots")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    if (msg === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
