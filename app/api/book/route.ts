// app/api/book/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAvailableSlots } from "@/lib/availability";
import { addMinutes } from "date-fns";
import emailOnBooking from "@/lib/email";

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/book", expects: "POST" });
}

export async function POST(req: Request) {
  try {
    const { serviceId, startsAt, client } = await req.json();

    if (!serviceId || !startsAt || !client?.name || !client?.email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const startsAtISO = new Date(startsAt).toISOString();
    const dateISO = startsAtISO.slice(0, 10);

    const stillFree = await getAvailableSlots(serviceId, dateISO);
    if (!stillFree.includes(startsAtISO)) {
      return NextResponse.json({ error: "Slot no longer available" }, { status: 409 });
    }

    const { data: svc, error: svcErr } = await supabase
      .from("services")
      .select("name,duration_minutes,price_cents")
      .eq("id", serviceId)
      .single();
    if (svcErr || !svc) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const endsAtISO = addMinutes(new Date(startsAtISO), Number(svc.duration_minutes)).toISOString();

    const { data: inserted, error } = await supabase
      .from("bookings")
      .insert({
        service_id: serviceId,
        client_name: client.name,
        client_email: client.email,
        client_phone: client.phone ?? null,
        starts_at: startsAtISO,
        ends_at: endsAtISO,
        status: "confirmed",
      })
      .select("id")
      .single();

    if (error) {
      console.error("DB insert failed:", error);
      return NextResponse.json({ error: "Could not create booking" }, { status: 500 });
    }

    const canEmail =
      !!process.env.RESEND_API_KEY && !!process.env.FROM_EMAIL && !!process.env.ADI_EMAIL;

    if (canEmail) {
      emailOnBooking({
        bookingId: inserted.id,
        serviceName: svc.name,
        durationMinutes: Number(svc.duration_minutes),
        priceCents: Number(svc.price_cents),
        startsAtISO,
        endsAtISO,
        client: { name: client.name, email: client.email, phone: client.phone ?? null },
      }).catch((err) => console.error("emailOnBooking failed:", err));
    } else {
      console.warn("Skipping emails: RESEND env vars not set");
    }

    return NextResponse.json({ ok: true, bookingId: inserted.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Bad request";
    console.error("book POST error:", e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
