"use client";
// components/BookingCalendar.tsx
// Renders a month grid and time-slot picker for booking.
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay,
  addMonths, subMonths, format, isBefore, startOfDay
} from "date-fns";
import { useState, useEffect } from "react";

export type Slot = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
};

type Props = {
  serviceType: string;
  onSlotSelected: (slot: Slot) => void;
};

export default function BookingCalendar({ serviceType, onSlotSelected }: Props) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Fetch slots for the visible month
  useEffect(() => {
    const start = format(viewMonth, "yyyy-MM-dd");
    const end = format(endOfMonth(viewMonth), "yyyy-MM-dd");
    setLoading(true);
    setSelectedDate(null);
    setSelectedSlot(null);

    fetch(`/api/availability?start_date=${start}&end_date=${end}&service_type=${encodeURIComponent(serviceType)}`)
      .then((r) => r.json())
      .then((data: Slot[]) => setSlots(Array.isArray(data) ? data : []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [viewMonth, serviceType]);

  const today = startOfDay(new Date());

  // Build calendar grid
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const nowMs = Date.now();
  // Filter slots whose start time is already in the past
  const futureSlots = slots.filter((s) => {
    const startISO = `${s.date}T${s.start_time}`;
    return new Date(startISO).getTime() > nowMs;
  });

  const availableDates = new Set(futureSlots.map((s) => s.date));

  const slotsForSelected = selectedDate
    ? futureSlots.filter((s) => s.date === format(selectedDate, "yyyy-MM-dd"))
    : [];

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          disabled={isBefore(endOfMonth(subMonths(viewMonth, 1)), today)}
          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-30"
        >
          ← Prev
        </button>
        <span className="font-semibold">{format(viewMonth, "MMMM yyyy")}</span>
        <button
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Next →
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500 text-center">Loading availability…</p>}

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, viewMonth);
          const isPast = isBefore(day, today);
          const hasSlots = availableDates.has(key);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          let cellClass = "relative h-10 rounded text-sm flex items-center justify-center ";

          if (!inMonth || isPast) {
            cellClass += "text-gray-300 cursor-default";
          } else if (isSelected) {
            cellClass += "bg-[#d90429] text-white font-semibold cursor-pointer shadow-sm";
          } else if (hasSlots) {
            cellClass += "bg-emerald-50 text-emerald-700 font-semibold cursor-pointer hover:bg-emerald-100 border border-emerald-200";
          } else {
            cellClass += "text-gray-400 cursor-default";
          }

          return (
            <button
              key={key}
              disabled={!inMonth || isPast || !hasSlots}
              onClick={() => { setSelectedDate(day); setSelectedSlot(null); }}
              className={cellClass}
            >
              {format(day, "d")}
              {hasSlots && !isSelected && inMonth && !isPast && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Slot picker */}
      {selectedDate && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Available times for {format(selectedDate, "EEEE, d MMMM")}:
          </p>
          {slotsForSelected.length === 0 ? (
            <p className="text-sm text-gray-500">No slots available for this day.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slotsForSelected.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => {
                    setSelectedSlot(slot);
                    onSlotSelected(slot);
                  }}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    selectedSlot?.id === slot.id
                      ? "bg-[#d90429] text-white border-[#d90429] shadow-sm"
                      : "bg-white text-gray-700 hover:border-red-400 hover:text-red-600"
                  }`}
                >
                  {slot.start_time.slice(0, 5)} — {slot.end_time.slice(0, 5)}
                  <span className="ml-1 text-xs opacity-70">({slot.duration_minutes}min)</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !availableDates.size && (
        <p className="text-sm text-center text-gray-500 mt-2">
          No availability this month. Try the next month or{" "}
          <a href="/contact" className="text-red-600 underline">contact us</a>.
        </p>
      )}
    </div>
  );
}
