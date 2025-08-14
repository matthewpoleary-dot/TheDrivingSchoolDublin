// app/api/admin/bookings/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/bookings?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("date_from");
    const to = searchParams.get("date_to");

    // Get bookings
    let q = supabase
      .from("bookings")
      .select("id, service_id, starts_at, ends_at, status, client_name, client_email, client_phone")
      .order("starts_at", { ascending: true });

    if (from) q = q.gte("starts_at", from);
    if (to) q = q.lte("starts_at", to);

    const { data: bookings, error } = await q;
    if (error) throw error;

    // Get all services to map names
    const { data: services, error: svcErr } = await supabase
      .from("services")
      .select("id, name, duration_minutes, price_cents");
    if (svcErr) throw svcErr;

    const svcMap = new Map(services?.map((s) => [s.id, s]) ?? []);
    const payload = (bookings ?? []).map((b) => ({
      ...b,
      service: svcMap.get(b.service_id) ?? null,
    }));

    return NextResponse.json(payload);
  } catch (e: any) {
    const code = e?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: code });
  }
}
