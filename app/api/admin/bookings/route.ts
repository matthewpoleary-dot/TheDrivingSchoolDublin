import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/auth";
import { TIMEZONE, addDaysToDateKey, todayInZone, zonedTimeToUtc } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  days: z.coerce.number().int().min(1).max(120).default(28),
  status: z.string().optional(),
});

/** Bookings for the admin dashboard. Session cookie required. */
export async function GET(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    from: url.searchParams.get("from") ?? undefined,
    days: url.searchParams.get("days") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  // Default view starts a week back so the instructor can still see and mark
  // up lessons that have just happened.
  const from = parsed.data.from ?? addDaysToDateKey(todayInZone(TIMEZONE), -7);
  const to = addDaysToDateKey(from, parsed.data.days);

  let query = supabaseAdmin()
    .from("bookings")
    .select(
      "id,reference,status,customer_name,customer_email,customer_phone,pickup_address,test_centre,transmission,notes,starts_at,ends_at,price_cents,deposit_cents,paid_at,refunded_at,refund_cents,google_event_id,manage_token,created_at,services(name,duration_minutes)"
    )
    .gte("starts_at", zonedTimeToUtc(from, "00:00", TIMEZONE).toISOString())
    .lt("starts_at", zonedTimeToUtc(to, "00:00", TIMEZONE).toISOString())
    .order("starts_at", { ascending: true });

  if (parsed.data.status) {
    query = query.in("status", parsed.data.status.split(","));
  } else {
    // Held and expired rows are noise on the dashboard.
    query = query.in("status", ["pending", "confirmed", "cancelled", "completed", "no_show"]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[admin/bookings] load failed:", error.message);
    return NextResponse.json({ error: "Could not load bookings" }, { status: 500 });
  }

  return NextResponse.json({ bookings: data ?? [], from, to, timezone: TIMEZONE });
}
