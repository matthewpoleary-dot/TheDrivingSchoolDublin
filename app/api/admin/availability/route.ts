import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/auth";
import { isCalendarConfigured, calendarStatusMessage } from "@/lib/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const templateSchema = z.object({
  kind: z.literal("template"),
  windows: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        startTime: z.string().regex(TIME),
        endTime: z.string().regex(TIME),
        slotIntervalMinutes: z.number().int().min(15).max(120),
      })
    )
    .max(40),
});

const overrideSchema = z.object({
  kind: z.literal("override"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(TIME),
  endTime: z.string().regex(TIME),
  isBlackout: z.boolean(),
  note: z.string().max(200).optional(),
});

/** Current working pattern, exceptions and integration health. */
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const db = supabaseAdmin();
  const [template, overrides] = await Promise.all([
    db.from("weekly_template").select("*").order("weekday").order("start_time"),
    db
      .from("date_overrides")
      .select("*")
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date"),
  ]);

  return NextResponse.json({
    template: template.data ?? [],
    overrides: overrides.data ?? [],
    calendar: {
      connected: isCalendarConfigured(),
      message: calendarStatusMessage(),
    },
  });
}

/**
 * Replace the weekly pattern, or add a one-off exception.
 *
 * The template is replaced wholesale rather than patched row by row, because
 * a half-applied working week is worse than either the old one or the new one.
 */
export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = z.discriminatedUnion("kind", [templateSchema, overrideSchema]).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", detail: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  const db = supabaseAdmin();

  if (parsed.data.kind === "template") {
    for (const window of parsed.data.windows) {
      if (window.endTime <= window.startTime) {
        return NextResponse.json(
          { error: `Finish time must be after start time (day ${window.weekday})` },
          { status: 400 }
        );
      }
    }

    // One RPC, therefore one transaction. Doing this as a DELETE followed by
    // an INSERT means a failed insert leaves the instructor with no working
    // hours at all, and the site with zero availability on every day.
    const { data, error } = await db.rpc("replace_weekly_template", {
      p_windows: parsed.data.windows,
    });

    if (error) {
      console.error("[admin/availability] replace failed:", error.message);
      return NextResponse.json(
        { error: "Could not save the new pattern. Your existing hours are unchanged." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, windows: data ?? 0 });
  }

  const override = parsed.data;
  if (override.endTime <= override.startTime) {
    return NextResponse.json({ error: "Finish time must be after start time" }, { status: 400 });
  }

  const { error } = await db.from("date_overrides").insert({
    date: override.date,
    start_time: override.startTime,
    end_time: override.endTime,
    is_blackout: override.isBlackout,
    note: override.note ?? null,
  });

  if (error) {
    return NextResponse.json({ error: "Could not save that exception" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/** Remove a date exception. */
export async function DELETE(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabaseAdmin().from("date_overrides").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Could not remove it" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
