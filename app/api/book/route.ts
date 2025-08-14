// app/api/book/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { addMinutes } from "date-fns";
import { getAvailableSlots } from "@/lib/availability";
import { emailOnBooking } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BookingInput = z.object({
  serviceId: z.string().uuid("Invalid service"),
  startsAt: z.string().datetime("Invalid start time"),
  client: z.object({
    name: z.string().min(2, "Name required"),
    email: z.string().email("Valid email required"),
    phone: z.string().optional().nullable(),
  }),
});

export async function POST(req: Request) {
  try {
    // Validate input
    const parsed = BookingInput.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { serviceId, startsAt, client } = parsed.data;

    const startsAtISO = new Date(startsAt).toISOString();
    const dateISO = startsAtISO.slice(0, 10);

    // Server-side guard: ensure slot still free
    const stillFree = await getAvailableSlots(serviceId, dateISO);
    if (!stillFree.includes(startsAtISO)) {
      return NextResponse.json(
        { error: "Slot no longer available" },
        { status: 409 }
      );
    }

    // Fetch service info
    const { data: svc, error: svcErr } = await supabase
      .from("services")
      .select("id,name,duration_minutes,price_cents")
      .eq("id", serviceId)
      .single();

    if (svcErr || !svc) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const endsAtISO = addMinutes(
      new Date(startsAtISO),
      Number(svc.duration_minutes)
    ).toISOString();

    // Insert booking
    const { data: inserted, error: insErr } = await supabase
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

    if (insErr || !inserted) {
      return NextResponse.json(
        { error: insErr?.message || "Could not save booking" },
        { status: 500 }
      );
    }

    // Fire-and-forget confirmation emails
    emailOnBooking({
      bookingId: inserted.id,
      serviceName: svc.name,
      durationMinutes: Number(svc.duration_minutes),
      priceCents: Number(svc.price_cents),
      startsAtISO,
      endsAtISO,
      client: {
        name: client.name,
        email: client.email,
        phone: client.phone ?? null,
      },
    }).catch((e) => console.error("emailOnBooking failed:", e));

    return NextResponse.json({ ok: true, bookingId: inserted.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Bad request" },
      { status: 400 }
    );
  }
}
