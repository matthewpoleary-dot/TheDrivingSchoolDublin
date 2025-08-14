import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  try {
    const hdr = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = hdr?.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token || token !== ADMIN_TOKEN) return unauthorized();

    const { data, error } = await supabase
      .from("bookings")
      .select("id,service_id,client_name,client_email,client_phone,starts_at,ends_at,status,services(name,duration_minutes,price_cents)")
      .order("starts_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
