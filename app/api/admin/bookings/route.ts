// app/api/admin/bookings/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  try {
    const hdr = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = hdr?.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token || token !== ADMIN_TOKEN) return unauthorized();

    const { data, error } = await supabaseServer
      .from("bookings")
      .select(`
        id, slot_id, service_type, customer_name, customer_email, customer_phone,
        payment_status, amount_pence, notes, created_at,
        slot:availability_slots(date, start_time, end_time)
      `)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
