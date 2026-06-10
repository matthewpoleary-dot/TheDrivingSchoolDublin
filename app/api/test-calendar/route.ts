// app/api/test-calendar/route.ts
// TEMPORARY — verifies the Google Calendar service-account integration end-to-end.
// DELETE THIS FILE after `{ ok: true }` is returned in the deployed environment.
import { NextResponse } from "next/server";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

function isoLocal(d: Date): string {
  // YYYY-MM-DDTHH:mm:ss without offset — matches what the lib expects.
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

export async function GET() {
  try {
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const eventId = await createCalendarEvent({
      title: "Test Lesson — Calendar Integration Test",
      description: [
        "Customer: Calendar Integration Test",
        "Phone: +353000000000",
        "Email: test@example.com",
        "Pick-up: Test pickup location",
        "",
        `Booking ID: test-${Date.now()}`,
      ].join("\n"),
      location: "Test pickup location",
      startISO: isoLocal(start),
      endISO: isoLocal(end),
    });

    if (!eventId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "createCalendarEvent returned null — likely missing GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, or GOOGLE_CALENDAR_ID env vars.",
        },
        { status: 500 }
      );
    }

    // Clean up immediately so we don't pollute the real calendar.
    await deleteCalendarEvent(eventId);

    return NextResponse.json({
      ok: true,
      message: "Calendar event created and deleted successfully",
      eventId,
    });
  } catch (e: unknown) {
    const err = e as { message?: string; code?: number; response?: { data?: unknown } };
    console.error("[test-calendar] error", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Unknown error",
        code: err?.code,
        details: err?.response?.data ?? null,
      },
      { status: 500 }
    );
  }
}
