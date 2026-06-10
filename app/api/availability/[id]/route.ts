// app/api/availability/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { deleteCalendarEvent, findAndDeleteEventsAt } from "@/lib/google-calendar";
import { dublinLocalToUtcISO } from "@/lib/time";

// DELETE /api/availability/[id] — admin only
// Removes any slot. If the slot was booked, cancel the linked booking/EDT
// session AND remove the matching Google Calendar event.
//
// Three paths for finding the GCAL event ID:
//   1. The bookings row (regular bookings)
//   2. The edt_sessions row (EDT-package bookings)
//   3. Time-range search on the calendar as a last-ditch fallback (orphans)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const { data: slot, error: fetchErr } = await supabaseServer
      .from("availability_slots")
      .select("is_booked, booking_id, date, start_time, end_time")
      .eq("id", id)
      .single();

    if (fetchErr || !slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    if (slot.is_booked) {
      let calendarEventCleared = false;

      // Path 1: regular booking with stored event ID
      if (slot.booking_id) {
        const { data: booking } = await supabaseServer
          .from("bookings")
          .update({ payment_status: "cancelled" })
          .eq("id", slot.booking_id)
          .select("google_calendar_event_id")
          .single();

        if (booking?.google_calendar_event_id) {
          await deleteCalendarEvent(booking.google_calendar_event_id);
          calendarEventCleared = true;
        }
      }

      // Path 2: EDT session attached to this slot
      if (!calendarEventCleared) {
        const { data: edtSession } = await supabaseServer
          .from("edt_sessions")
          .select("id, google_calendar_event_id")
          .eq("slot_id", id)
          .in("status", ["scheduled", "completed"])
          .maybeSingle();

        if (edtSession) {
          if (edtSession.google_calendar_event_id) {
            await deleteCalendarEvent(edtSession.google_calendar_event_id);
            calendarEventCleared = true;
          }
          // Mark the session as cancelled so it stops counting against the
          // package's active-session limit.
          await supabaseServer
            .from("edt_sessions")
            .update({ status: "cancelled" })
            .eq("id", edtSession.id);
        }
      }

      // Path 3: time-range search fallback (true orphans)
      if (!calendarEventCleared && slot.date && slot.start_time && slot.end_time) {
        const startISO = dublinLocalToUtcISO(slot.date, slot.start_time);
        const endISO = dublinLocalToUtcISO(slot.date, slot.end_time);
        await findAndDeleteEventsAt(startISO, endISO);
      }
    }

    const { error } = await supabaseServer
      .from("availability_slots")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, was_booked: slot.is_booked });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    if (msg === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
