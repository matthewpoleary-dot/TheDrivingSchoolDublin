"use client";
// components/BookingCalendar.tsx: plate date cards with muted open/full states
import { useState, useEffect, useMemo } from "react";
import { format, addDays, addMonths, endOfMonth, startOfDay } from "date-fns";
import { ArrowRight } from "@/components/lton/Icons";

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

const INITIAL_DAYS = 15;
const DAY_INCREMENT = 15;


export default function BookingCalendar({ serviceType, onSlotSelected }: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [monthsLoaded, setMonthsLoaded] = useState(2);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [daysVisible, setDaysVisible] = useState(INITIAL_DAYS);

  // Fetch availability for the next N months
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const today = new Date();
    const start = format(startOfDay(today), "yyyy-MM-dd");
    const end = format(endOfMonth(addMonths(today, monthsLoaded - 1)), "yyyy-MM-dd");

    fetch(
      `/api/availability?start_date=${start}&end_date=${end}&service_type=${encodeURIComponent(
        serviceType
      )}`
    )
      .then((r) => r.json())
      .then((data: Slot[]) => {
        if (cancelled) return;
        setSlots(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setSlots([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [serviceType, monthsLoaded]);

  // Filter past slots
  const futureSlots = useMemo(() => {
    const now = Date.now();
    return slots.filter((s) => {
      const startISO = `${s.date}T${s.start_time}`;
      return new Date(startISO).getTime() > now;
    });
  }, [slots]);

  // Set of dates that have at least one slot
  const availableDates = useMemo(
    () => new Set(futureSlots.map((s) => s.date)),
    [futureSlots]
  );

  // Generate the next N days from today
  const dateCards = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: daysVisible }, (_, i) => {
      const d = addDays(today, i);
      const dateStr = format(d, "yyyy-MM-dd");
      return {
        date: d,
        dateStr,
        available: availableDates.has(dateStr),
      };
    });
  }, [daysVisible, availableDates]);

  const slotsForSelected = selectedDate
    ? futureSlots.filter((s) => s.date === selectedDate)
    : [];

  return (
    <div>
      {loading && slots.length === 0 && (
        <p className="l-hint" role="status" style={{ textAlign: "center", padding: "24px 0" }}>
          Loading availability…
        </p>
      )}

      {/* Date cards */}
      <div className="l-cal-grid">
        {dateCards.map(({ date, dateStr, available }) => {
          const isSelected = selectedDate === dateStr;
          return (
            <button
              key={dateStr}
              disabled={!available}
              onClick={() => {
                setSelectedDate(dateStr);
                setSelectedSlot(null);
              }}
              aria-pressed={isSelected}
              className={`l-day ${available ? "l-day--open" : "l-day--full"}`}
            >
              <span className="l-day__dot" aria-hidden="true" />
              <span className="l-day__dow">{format(date, "EEE")}</span>
              <span className="l-day__num">{format(date, "d")}</span>
              <span className="l-day__mon">{format(date, "MMM")}</span>
            </button>
          );
        })}
      </div>

      {/* Show more dates */}
      <div className="l-cal-more">
        <button
          onClick={() => {
            setDaysVisible((n) => n + DAY_INCREMENT);
            // If we run out of fetched availability, fetch the next month too
            const today = startOfDay(new Date());
            const lastVisible = addDays(today, daysVisible + DAY_INCREMENT);
            const fetchedThrough = endOfMonth(addMonths(today, monthsLoaded - 1));
            if (lastVisible > fetchedThrough) setMonthsLoaded((m) => m + 1);
          }}
          disabled={loading}
        >
          {loading ? "Loading…" : <>Show more dates <ArrowRight size={14} /></>}
        </button>
      </div>

      {/* Legend */}
      <div className="l-legend">
        <span><i aria-hidden="true" /> Available</span>
        <span><i className="full" aria-hidden="true" /> Full</span>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="l-times-wrap" key={selectedDate}>
          <div className="l-times-head">
            <h3>Pick a time</h3>
            <span className="l-hint" style={{ fontWeight: 700 }}>Dublin time</span>
          </div>

          {slotsForSelected.length === 0 ? (
            <p className="l-hint">No slots available for this day.</p>
          ) : (
            <>
              <p className="l-hint">Booked times don&apos;t appear. Pick any time below.</p>
              <div className="l-times">
                {slotsForSelected.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => {
                        setSelectedSlot(slot);
                        onSlotSelected(slot);
                      }}
                      aria-pressed={isSelected}
                      className="l-time"
                    >
                      {slot.start_time.slice(0, 5)}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
