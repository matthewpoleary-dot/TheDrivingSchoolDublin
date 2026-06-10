"use client";
// components/BookingCalendar.tsx — nomad-style date cards + time-slot pills
import { useState, useEffect, useMemo } from "react";
import { format, addMonths, endOfMonth, startOfMonth } from "date-fns";

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

const INITIAL_LIMIT = 15;
const PAGE_INCREMENT = 15;

export default function BookingCalendar({ serviceType, onSlotSelected }: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [monthsLoaded, setMonthsLoaded] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_LIMIT);

  // Fetch availability across N months from today
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const today = new Date();
    const start = format(startOfMonth(today), "yyyy-MM-dd");
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

  // Unique dates with availability, sorted
  const availableDates = useMemo(() => {
    const set = new Set(futureSlots.map((s) => s.date));
    return Array.from(set).sort();
  }, [futureSlots]);

  const visibleDates = availableDates.slice(0, visibleLimit);
  const hasMore = availableDates.length > visibleLimit;
  const canLoadMoreMonths = monthsLoaded < 4;

  const slotsForSelected = selectedDate
    ? futureSlots.filter((s) => s.date === selectedDate)
    : [];

  // Empty state — nothing in current load
  if (!loading && availableDates.length === 0) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6 }}>
          No availability right now.{" "}
          <a
            href="/contact"
            style={{ color: "var(--red)", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Contact us
          </a>{" "}
          and we&apos;ll arrange a time.
        </p>
      </div>
    );
  }

  return (
    <div>
      {loading && availableDates.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--ink-2)", textAlign: "center", padding: "24px 0" }}>
          Loading availability…
        </p>
      )}

      {/* Date cards */}
      <div
        className="grid grid-cols-3 sm:grid-cols-5"
        style={{ gap: 10 }}
      >
        {visibleDates.map((dateStr) => {
          const d = new Date(`${dateStr}T00:00:00`);
          const isSelected = selectedDate === dateStr;
          return (
            <button
              key={dateStr}
              onClick={() => {
                setSelectedDate(dateStr);
                setSelectedSlot(null);
              }}
              style={{
                background: isSelected ? "var(--red)" : "white",
                color: isSelected ? "white" : "var(--ink)",
                border: isSelected ? "1px solid var(--red)" : "1px solid var(--rule)",
                borderRadius: 8,
                padding: "14px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  color: isSelected ? "rgba(255,255,255,0.85)" : "var(--ink-3)",
                }}
              >
                {format(d, "EEE")}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-instrument-serif), Georgia, serif",
                  fontStyle: "italic",
                  fontSize: 26,
                  lineHeight: 1,
                  letterSpacing: "-0.5px",
                }}
              >
                {format(d, "d")}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.4px",
                  textTransform: "uppercase",
                  color: isSelected ? "rgba(255,255,255,0.85)" : "var(--ink-3)",
                }}
              >
                {format(d, "MMM")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Show more dates */}
      {(hasMore || canLoadMoreMonths) && (
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button
            onClick={() => {
              if (hasMore) {
                setVisibleLimit((n) => n + PAGE_INCREMENT);
              } else {
                setMonthsLoaded((m) => m + 1);
              }
            }}
            disabled={loading}
            style={{
              fontSize: 13,
              color: "var(--ink-2)",
              background: "none",
              border: "none",
              cursor: loading ? "default" : "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              padding: 0,
            }}
          >
            {loading ? "Loading…" : "Show more dates →"}
          </button>
        </div>
      )}

      {/* Time slots */}
      {selectedDate && (
        <div style={{ marginTop: 36 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-instrument-serif), Georgia, serif",
                fontSize: 22,
                fontStyle: "italic",
                color: "var(--ink)",
                letterSpacing: "-0.5px",
              }}
            >
              Pick a time
            </h3>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.8px",
                color: "var(--ink-3)",
                textTransform: "uppercase",
              }}
            >
              Dublin
            </span>
          </div>

          {slotsForSelected.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--ink-2)" }}>
              No slots available for this day.
            </p>
          ) : (
            <div
              className="grid grid-cols-2 sm:grid-cols-4"
              style={{ gap: 8 }}
            >
              {slotsForSelected.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id;
                return (
                  <button
                    key={slot.id}
                    onClick={() => {
                      setSelectedSlot(slot);
                      onSlotSelected(slot);
                    }}
                    style={{
                      background: isSelected ? "var(--red)" : "white",
                      color: isSelected ? "white" : "var(--ink)",
                      border: isSelected ? "1px solid var(--red)" : "1px solid var(--rule)",
                      borderRadius: 100,
                      padding: "12px 8px",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                  >
                    {slot.start_time.slice(0, 5)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
