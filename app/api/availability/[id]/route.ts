// app/api/availability/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { deleteCalendarEvent, findAndDeleteEventsAt } from "@/lib/google-calendar";
import { dublinLocalToUtcISO } from "@/lib/time";

// DELETE /api/availability/[id] — admin only
// Deletes any slot. If the slot was booked, also marks the booking as cancelled
// and removes the Google Calendar event (either by stored ID, or by searching
// the calendar in the slot's time range if the booking row is gone — orphan case).
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

      // Happy path: we have a booking row, possibly with the calendar event ID.
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

      // Orphan fallback: booking row is missing, or the event ID wasn't stored.
      // Search Google Calendar for any of our events that start at this slot
      // and delete them. Safe to run unconditionally because findAndDeleteEventsAt
      // only deletes events whose description contains our "Booking ID:" marker.
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
