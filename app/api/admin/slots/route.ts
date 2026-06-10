// app/api/admin/slots/route.ts — admin view of all slots (including booked)
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";

type AdminSlotRow = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  lesson_types: string[];
  is_booked: boolean;
  booking?: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    service_type: string;
    payment_status: string;
    amount_pence: number;
    notes: string | null;
    /** Tag so the admin UI can render EDT bookings clearly */
    source?: "regular" | "edt";
    edt_session_number?: number;
    edt_package_total?: number;
  } | null;
};

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    let query = supabaseServer
      .from("availability_slots")
      .select(
        "*, booking:bookings(customer_name, customer_email, customer_phone, service_type, payment_status, amount_pence, notes)"
      )
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (start) query = query.gte("date", start);
    if (end) query = query.lte("date", end);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data ?? []) as AdminSlotRow[];

    // Find booked slots that don't have a `bookings` row attached — these are likely EDT sessions
    const orphanIds = rows
      .filter((r) => r.is_booked && !r.booking)
      .map((r) => r.id);

    if (orphanIds.length > 0) {
      const { data: sessions } = await supabaseServer
        .from("edt_sessions")
        .select(
          "slot_id, session_number, status, package:edt_packages(customer_name, customer_email, lessons_total)"
        )
        .in("slot_id", orphanIds);

      type EdtPkg = {
        customer_name: string;
        customer_email: string;
        lessons_total: number;
      };
      type EdtSessRow = {
        slot_id: string;
        session_number: number;
        status: string;
        // Supabase types nested relations as array; runtime is single object for to-one FK
        package: EdtPkg | EdtPkg[] | null;
      };

      const sessRows = (sessions ?? []) as EdtSessRow[];
      const sessBySlot = new Map<string, EdtSessRow>();
      for (const s of sessRows) {
        if (s.status === "scheduled" || s.status === "completed") {
          sessBySlot.set(s.slot_id, s);
        }
      }

      for (const row of rows) {
        if (row.is_booked && !row.booking) {
          const s = sessBySlot.get(row.id);
          if (!s) continue;
          const pkg = Array.isArray(s.package) ? s.package[0] : s.package;
          if (!pkg) continue;
          row.booking = {
            customer_name: pkg.customer_name,
            customer_email: pkg.customer_email,
            customer_phone: "",
            service_type: "edt-session",
            payment_status: "paid",
            amount_pence: 0,
            notes: `EDT lesson ${s.session_number} of ${pkg.lessons_total}`,
            source: "edt",
            edt_session_number: s.session_number,
            edt_package_total: pkg.lessons_total,
          };
        }
      }
    }

    return NextResponse.json(rows);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    if (msg === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
