// app/api/availability/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { format, parseISO, eachDayOfInterval, getDay } from "date-fns";

// ─── GET /api/availability ────────────────────────────────────────────────────
// Public. Params: start_date (YYYY-MM-DD), end_date (YYYY-MM-DD), service_type
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start_date");
    const end = searchParams.get("end_date");
    const serviceType = searchParams.get("service_type");

    if (!start || !end) {
      return NextResponse.json({ error: "start_date and end_date are required" }, { status: 400 });
    }

    let query = supabaseServer
      .from("availability_slots")
      .select("*")
      .eq("is_booked", false)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (serviceType) {
      query = query.contains("lesson_types", [serviceType]);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}

// ─── POST /api/availability ───────────────────────────────────────────────────
// Admin only. Creates one slot or recurring slots.
// Body: { mode: "single" | "recurring", ... }
export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const body = (await req.json()) as Record<string, unknown>;
    const { mode } = body;

    if (mode === "single") {
      const { date, start_time, end_time, duration_minutes, lesson_types } = body as {
        date: string;
        start_time: string;
        end_time: string;
        duration_minutes: number;
        lesson_types: string[];
      };

      if (!date || !start_time || !end_time || !duration_minutes || !lesson_types?.length) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const { data, error } = await supabaseServer
        .from("availability_slots")
        .insert({ date, start_time, end_time, duration_minutes, lesson_types })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data, { status: 201 });
    }

    if (mode === "recurring") {
      // Generate slots for selected weekdays over a date range
      // body: { start_date, end_date, weekdays: number[] (0=Sun..6=Sat),
      //         times: { start_time, end_time, duration_minutes }[],
      //         lesson_types: string[] }
      const { start_date, end_date, weekdays, times, lesson_types } = body as {
        start_date: string;
        end_date: string;
        weekdays: number[];
        times: { start_time: string; end_time: string; duration_minutes: number }[];
        lesson_types: string[];
      };

      if (!start_date || !end_date || !weekdays?.length || !times?.length || !lesson_types?.length) {
        return NextResponse.json({ error: "Missing required fields for recurring slots" }, { status: 400 });
      }

      const days = eachDayOfInterval({
        start: parseISO(start_date),
        end: parseISO(end_date),
      });

      const slots = days
        .filter((d) => weekdays.includes(getDay(d)))
        .flatMap((d) =>
          times.map((t) => ({
            date: format(d, "yyyy-MM-dd"),
            start_time: t.start_time,
            end_time: t.end_time,
            duration_minutes: t.duration_minutes,
            lesson_types,
          }))
        );

      if (!slots.length) {
        return NextResponse.json({ created: 0, message: "No slots matched the weekday selection" });
      }

      // Insert in batches of 100
      let created = 0;
      for (let i = 0; i < slots.length; i += 100) {
        const { error } = await supabaseServer
          .from("availability_slots")
          .insert(slots.slice(i, i + 100));
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        created += Math.min(100, slots.length - i);
      }

      return NextResponse.json({ created }, { status: 201 });
    }

    if (mode === "auto-fill") {
      // Fills each matching day from day_start to day_end, spaced by duration + travel_time.
      // body: { start_date, end_date,
      //         schedule: { weekdays: number[], day_start: string, day_end: string }[],
      //         duration_minutes: number, travel_time_minutes: number, lesson_types: string[] }
      const { start_date, end_date, schedule, duration_minutes, travel_time_minutes, lesson_types } = body as {
        start_date: string;
        end_date: string;
        schedule: { weekdays: number[]; day_start: string; day_end: string }[];
        duration_minutes: number;
        travel_time_minutes: number;
        lesson_types: string[];
      };

      if (!start_date || !end_date || !schedule?.length || !duration_minutes || !lesson_types?.length) {
        return NextResponse.json({ error: "Missing required fields for auto-fill" }, { status: 400 });
      }

      const interval = duration_minutes + (travel_time_minutes ?? 0);

      function toMin(t: string) {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      }
      function toTime(mins: number) {
        const h = Math.floor(mins / 60).toString().padStart(2, "0");
        const m = (mins % 60).toString().padStart(2, "0");
        return `${h}:${m}:00`;
      }

      const days = eachDayOfInterval({ start: parseISO(start_date), end: parseISO(end_date) });

      const newSlots: { date: string; start_time: string; end_time: string; duration_minutes: number; lesson_types: string[] }[] = [];

      for (const day of days) {
        const dow = getDay(day);
        const entry = schedule.find((s) => s.weekdays.includes(dow));
        if (!entry) continue;

        const dayStartMin = toMin(entry.day_start);
        const dayEndMin = toMin(entry.day_end);
        let t = dayStartMin;
        while (t + duration_minutes <= dayEndMin) {
          newSlots.push({
            date: format(day, "yyyy-MM-dd"),
            start_time: toTime(t),
            end_time: toTime(t + duration_minutes),
            duration_minutes,
            lesson_types,
          });
          t += interval;
        }
      }

      if (!newSlots.length) {
        return NextResponse.json({ created: 0, message: "No slots matched the schedule" });
      }

      // Insert in batches of 100, skip duplicates
      let created = 0;
      for (let i = 0; i < newSlots.length; i += 100) {
        const batch = newSlots.slice(i, i + 100);
        const { error } = await supabaseServer
          .from("availability_slots")
          .insert(batch);
        // Ignore duplicate key errors (slot already exists for that date+time)
        if (error && !error.message.includes("duplicate")) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        if (!error) created += batch.length;
      }

      return NextResponse.json({ created }, { status: 201 });
    }

    return NextResponse.json({ error: "mode must be 'single', 'recurring', or 'auto-fill'" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    if (msg === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
