// app/api/edt/[token]/book/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { emailOnEdtSessionBooked } from "@/lib/email";

// Max sessions a package holder can have scheduled (not yet completed) at once
const MAX_ADVANCE_SESSIONS = 2;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = (await req.json()) as { slot_id: string };
    const { slot_id } = body;

    if (!slot_id) {
      return NextResponse.json({ error: "slot_id is required" }, { status: 400 });
    }

    // 1. Validate the package
    const { data: pkg, error: pkgErr } = await supabaseServer
      .from("edt_packages")
      .select("*")
      .eq("access_token", token)
      .single();

    if (pkgErr || !pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (pkg.expires_at < today) {
      return NextResponse.json({ error: "This package has expired" }, { status: 410 });
    }

    if (pkg.lessons_used >= pkg.lessons_total) {
      return NextResponse.json({ error: "All lessons have been used" }, { status: 409 });
    }

    // 2. Check advance session limit
    const { count: activeCount } = await supabaseServer
      .from("edt_sessions")
      .select("id", { count: "exact", head: true })
      .eq("package_id", pkg.id)
      .eq("status", "scheduled");

    if ((activeCount ?? 0) >= MAX_ADVANCE_SESSIONS) {
      return NextResponse.json(
        { error: `You already have ${MAX_ADVANCE_SESSIONS} upcoming sessions scheduled. Please attend a session before booking more.` },
        { status: 409 }
      );
    }

    // 3. Validate slot is still free
    const { data: slot, error: slotErr } = await supabaseServer
      .from("availability_slots")
      .select("*")
      .eq("id", slot_id)
      .single();

    if (slotErr || !slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }
    if (slot.is_booked) {
      return NextResponse.json({ error: "This slot has just been taken. Please choose another." }, { status: 409 });
    }

    // 4. Create the session
    const sessionNumber = pkg.lessons_used + 1;
    const { data: session, error: sessionErr } = await supabaseServer
      .from("edt_sessions")
      .insert({
        package_id: pkg.id,
        slot_id,
        session_number: sessionNumber,
        status: "scheduled",
      })
      .select()
      .single();

    if (sessionErr || !session) {
      return NextResponse.json({ error: sessionErr?.message ?? "Failed to create session" }, { status: 500 });
    }

    // 5. Lock the slot
    await supabaseServer
      .from("availability_slots")
      .update({ is_booked: true, booking_id: null })
      .eq("id", slot_id);

    // 6. Increment lessons_used
    await supabaseServer
      .from("edt_packages")
      .update({ lessons_used: pkg.lessons_used + 1 })
      .eq("id", pkg.id);

    // 7. Send confirmation emails
    const startsAtISO = `${slot.date}T${slot.start_time}+01:00`;
    await emailOnEdtSessionBooked({
      packageId: pkg.id,
      sessionNumber,
      lessonsTotal: pkg.lessons_total,
      startsAtISO,
      customer: { name: pkg.customer_name, email: pkg.customer_email },
    });

    return NextResponse.json({ ok: true, session_id: session.id, session_number: sessionNumber });
  } catch (e: unknown) {
    console.error("[edt/book]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}
