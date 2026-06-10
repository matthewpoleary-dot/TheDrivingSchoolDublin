// app/api/admin/edt-packages/[id]/sessions/route.ts
// Returns scheduled and completed sessions for a single EDT package
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const { data: sessions, error } = await supabaseServer
      .from("edt_sessions")
      .select("id, status, session_number, created_at, slot_id")
      .eq("package_id", id)
      .order("session_number", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Hydrate slot info (date/time) for each session
    const slotIds = (sessions ?? [])
      .map((s) => s.slot_id)
      .filter((id): id is string => Boolean(id));

    let slotMap: Record<string, { date: string; start_time: string; end_time: string }> = {};
    if (slotIds.length > 0) {
      const { data: slots } = await supabaseServer
        .from("availability_slots")
        .select("id, date, start_time, end_time")
        .in("id", slotIds);

      if (slots) {
        slotMap = Object.fromEntries(
          slots.map((s) => [
            s.id,
            { date: s.date, start_time: s.start_time, end_time: s.end_time },
          ])
        );
      }
    }

    const hydrated = (sessions ?? []).map((s) => ({
      id: s.id,
      status: s.status as "scheduled" | "completed" | "cancelled",
      lesson_number: s.session_number,
      created_at: s.created_at,
      slot: s.slot_id ? slotMap[s.slot_id] ?? null : null,
    }));

    return NextResponse.json(hydrated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    if (msg === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
