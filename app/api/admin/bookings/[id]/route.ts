// app/api/admin/bookings/[id]/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { emailOnStatusChange } from "@/lib/email";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

type Status = "cancelled" | "completed";
type PatchBody = { status?: Status };

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function errToString(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Server error";
  }
}

// Next.js 15: params must be awaited.
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const hdr = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = hdr?.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token || token !== ADMIN_TOKEN) return unauthorized();

    const { id } = await ctx.params; // ✅ await params
    const body = (await req.json()) as PatchBody;
    const newStatus = body.status;

    if (!newStatus || !["cancelled", "completed"].includes(newStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Fetch booking for email context
    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .select(
        "id, service_id, starts_at, ends_at, client_name, client_email, client_phone"
      )
      .eq("id", id)
      .single();

    if (bErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Fetch service name
    const { data: svc } = await supabase
      .from("services")
      .select("name")
      .eq("id", booking.service_id)
      .single();

    // Update status
    const { error: uErr } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", id);

    if (uErr) {
      return NextResponse.json({ error: uErr.message }, { status: 500 });
    }

    // Fire-and-forget emails
    emailOnStatusChange({
      bookingId: booking.id,
      newStatus,
      serviceName: svc?.name ?? "Lesson",
      startsAtISO: booking.starts_at,
      client: {
        name: booking.client_name,
        email: booking.client_email,
        phone: booking.client_phone ?? null,
      },
    }).catch((err: unknown) => {
      console.error("emailOnStatusChange failed:", errToString(err));
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: errToString(err) },
      { status: 500 }
    );
  }
}
