import { NextRequest } from "next/server";
import { addMinutes } from "date-fns";
import { SERVICE_CATALOG } from "@/lib/booking/catalog";
import { serviceCodeSchema } from "@/lib/booking/schema";
import { getCalSlots, isCalConfigured } from "@/lib/cal/server";
import type { AvailableSlot } from "@/lib/booking/types";

function dublinLocalToIso(date: string, hour: number) {
  const [year, month, day] = date.split("-").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour));
  const parts = new Intl.DateTimeFormat("en-IE", {
    timeZone: "Europe/Dublin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(utcGuess);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
  );
  const offset = asUtc - utcGuess.getTime();
  return new Date(Date.UTC(year, month - 1, day, hour) - offset).toISOString();
}

function previewSlots(date: string, durationMinutes: number): AvailableSlot[] {
  return [9, 10, 11, 13, 14, 15, 16].map((hour) => {
    const start = dublinLocalToIso(date, hour);
    return { start, end: addMinutes(new Date(start), durationMinutes).toISOString() };
  });
}

export async function GET(request: NextRequest) {
  const parsedService = serviceCodeSchema.safeParse(
    request.nextUrl.searchParams.get("service"),
  );
  const date = request.nextUrl.searchParams.get("date") ?? "";

  if (!parsedService.success || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Invalid service or date" }, { status: 400 });
  }

  const serviceCode = parsedService.data;
  if (isCalConfigured(serviceCode)) {
    const slots = await getCalSlots({ serviceCode, date });
    return Response.json({ mode: "live", slots });
  }

  if (process.env.VERCEL_ENV !== "production") {
    return Response.json({
      mode: "preview",
      slots: previewSlots(date, SERVICE_CATALOG[serviceCode].durationMinutes),
    });
  }

  return Response.json({ mode: "setup_required", slots: [] });
}
