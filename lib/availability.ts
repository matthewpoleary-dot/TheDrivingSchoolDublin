// lib/availability.ts
import { supabase } from "@/lib/supabase";
import { addMinutes, isBefore, set } from "date-fns";

function atDateTime(dateISO: string, hhmmOrHhmmss: string) {
  // Accept "09:00" or "09:00:00"
  const [hh, mm] = hhmmOrHhmmss.split(":").map(Number);
  return set(new Date(`${dateISO}T00:00:00`), {
    hours: hh,
    minutes: mm,
    seconds: 0,
    milliseconds: 0,
  });
}

export async function getAvailableSlots(
  serviceId: string,
  dateISO: string
): Promise<string[]> {
  // 1) Service → duration
  const { data: service, error: sErr } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .single();
  if (sErr || !service) return [];
  const duration = Number(service.duration_minutes);

  // 2) Which weekday? (0=Sun..6=Sat)
  const weekday = new Date(dateISO).getDay();

  // 3) Weekly template rows for that weekday
  const { data: templates } = await supabase
    .from("weekly_template")
    .select(
      "start_time,end_time,slot_interval_minutes,buffer_after_minutes"
    )
    .eq("weekday", weekday);
  if (!templates?.length) return [];

  // 4) Overrides (blackouts or extra openings) for that date
  const { data: overrides } = await supabase
    .from("overrides")
    .select("start_time,end_time,is_blackout")
    .eq("date", dateISO);

  // 5) Existing bookings that day (pending + confirmed)
  const dayStart = new Date(`${dateISO}T00:00:00`).toISOString();
  const dayEnd = new Date(`${dateISO}T23:59:59`).toISOString();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("starts_at,ends_at,status")
    .gte("starts_at", dayStart)
    .lte("starts_at", dayEnd)
    .in("status", ["pending", "confirmed"]);

  type Win = { start: Date; end: Date };

  // Base windows from weekly template
  let windows: Win[] = templates.map((t) => ({
    start: atDateTime(dateISO, t.start_time),
    end: atDateTime(dateISO, t.end_time),
  }));

  // Apply overrides
  (overrides ?? []).forEach((o) => {
    const ow: Win = {
      start: atDateTime(dateISO, o.start_time),
      end: atDateTime(dateISO, o.end_time),
    };
    if (o.is_blackout) {
      // remove blackout portions
      windows = windows.flatMap((w) => {
        if (ow.end <= w.start || ow.start >= w.end) return [w];
        const parts: Win[] = [];
        if (ow.start > w.start) parts.push({ start: w.start, end: ow.start });
        if (ow.end < w.end) parts.push({ start: ow.end, end: w.end });
        return parts.filter((p) => p.end > p.start);
      });
    } else {
      // add extra opening
      windows.push(ow);
    }
  });

  // Step between slot starts = max(slot_interval, duration + buffer)
  const slotInterval = Math.max(
    ...templates.map((t) => Number(t.slot_interval_minutes))
  );
  const bufferAfter = Math.max(
    ...templates.map((t) => Number(t.buffer_after_minutes))
  );
  const step = Math.max(slotInterval, duration + bufferAfter);

  // Generate candidate starts that fully fit in each window
  const candidates: Date[] = [];
  windows.forEach((w) => {
    let cur = new Date(w.start);
    while (
      isBefore(addMinutes(cur, duration), w.end) ||
      +addMinutes(cur, duration) === +w.end
    ) {
      candidates.push(new Date(cur));
      cur = addMinutes(cur, step);
    }
  });

  // Remove candidates that overlap a booking
  const free = candidates.filter((start) => {
    const end = addMinutes(start, duration);
    return !(bookings ?? []).some((b) => {
      const bs = new Date(b.starts_at);
      const be = new Date(b.ends_at);
      return bs < end && be > start; // overlap
    });
  });

  // Return ISO strings (UTC). You can format client-side to local time.
  return free.map((d) => d.toISOString());
}
