// app/api/availability/[id]/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { deleteCalendarEvent, findAndDeleteEventsAt } from "@/lib/google-calendar";
import { dublinLocalToUtcISO } from "@/lib/time";
import { emailOnStatusChange } from "@/lib/email";

// DELETE /api/availability/[id] — admin only
// Removes any slot. If the slot was booked, cancels the linked booking/EDT
// session, removes the matching Google Calendar event, emails the customer,
// and auto-refunds paid regular bookings.
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
          .select("id, customer_name, customer_email, customer_phone, service_type, google_calendar_event_id, stripe_payment_intent, amount_pence")
          .single();

        if (booking?.google_calendar_event_id) {
          await deleteCalendarEvent(booking.google_calendar_event_id);
          calendarEventCleared = true;
        }

        if (booking) {
          const emailStartISO = slot.date && slot.start_time
            ? dublinLocalToUtcISO(slot.date, slot.start_time)
            : new Date().toISOString();

          // Email customer — fire and forget (don't block the delete)
          emailOnStatusChange({
            bookingId: booking.id,
            status: "cancelled",
            serviceName: booking.service_type,
            startsAtISO: emailStartISO,
            client: {
              name: booking.customer_name,
              email: booking.customer_email,
              phone: booking.customer_phone ?? null,
            },
          }).catch((err: unknown) => {
            console.error("[availability/delete] email failed:", err instanceof Error ? err.message : err);
          });

          // Auto-refund paid regular bookings when instructor cancels
          if (booking.stripe_payment_intent && booking.amount_pence > 0 && process.env.STRIPE_SECRET_KEY) {
            try {
              const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-07-30.basil" });
              await stripe.refunds.create(
                { payment_intent: booking.stripe_payment_intent },
                { idempotencyKey: `refund-slot-del-${booking.id}` }
              );
              await supabaseServer
                .from("bookings")
                .update({ payment_status: "refunded" })
                .eq("id", booking.id);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e);
              if (!msg.includes("charge_already_refunded")) {
                console.error("[availability/delete] auto-refund failed:", msg);
              } else {
                // Already refunded in Stripe — just mark DB
                await supabaseServer
                  .from("bookings")
                  .update({ payment_status: "refunded" })
                  .eq("id", booking.id);
              }
            }
          }
        }
      }

      // Path 2: EDT session attached to this slot
      if (!calendarEventCleared) {
        const { data: edtSession } = await supabaseServer
          .from("edt_sessions")
          .select("id, google_calendar_event_id, package_id")
          .eq("slot_id", id)
          .in("status", ["scheduled", "completed"])
          .maybeSingle();

        if (edtSession) {
          if (edtSession.google_calendar_event_id) {
            await deleteCalendarEvent(edtSession.google_calendar_event_id);
            calendarEventCleared = true;
          }

          // Mark session cancelled
          await supabaseServer
            .from("edt_sessions")
            .update({ status: "cancelled" })
            .eq("id", edtSession.id);

          // Return the lesson credit to the package (never below 0)
          const { data: pkg } = await supabaseServer
            .from("edt_packages")
            .select("lessons_used, customer_name, customer_email")
            .eq("id", edtSession.package_id)
            .single();

          if (pkg) {
            await supabaseServer
              .from("edt_packages")
              .update({ lessons_used: Math.max(0, pkg.lessons_used - 1) })
              .eq("id", edtSession.package_id);

            const emailStartISO = slot.date && slot.start_time
              ? dublinLocalToUtcISO(slot.date, slot.start_time)
              : new Date().toISOString();

            emailOnStatusChange({
              bookingId: edtSession.id,
              status: "cancelled",
              serviceName: "EDT Session",
              startsAtISO: emailStartISO,
              client: { name: pkg.customer_name, email: pkg.customer_email, phone: null },
            }).catch((err: unknown) => {
              console.error("[availability/delete] EDT email failed:", err instanceof Error ? err.message : err);
            });
          }
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
