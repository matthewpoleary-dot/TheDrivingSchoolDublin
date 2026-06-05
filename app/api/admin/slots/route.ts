// app/api/admin/slots/route.ts — admin view of all slots (including booked)
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    let query = supabaseServer
      .from("availability_slots")
      .select("*, booking:bookings(customer_name, customer_email, customer_phone, service_type, payment_status, amount_pence, notes)")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (start) query = query.gte("date", start);
    if (end) query = query.lte("date", end);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    if (msg === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
