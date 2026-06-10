"use client";
// components/BookingCalendar.tsx — nomad-style date cards + green/red availability
import { useState, useEffect, useMemo } from "react";
import { format, addDays, addMonths, endOfMonth, startOfDay } from "date-fns";

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

// Availability colours — clearly distinct, still professional.
const AVAILABLE_BORDER = "#5DAB6F";   // forest green
const AVAILABLE_BG = "#E8F5EC";
const AVAILABLE_TEXT = "#2E6B3B";

const UNAVAILABLE_BORDER = "#D5867F";  // brick red
const UNAVAILABLE_BG = "#FBE7E4";
const UNAVAILABLE_TEXT = "#8A3D33";

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
        <p style={{ fontSize: 13, color: "var(--ink-2)", textAlign: "center", padding: "24px 0" }}>
          Loading availability…
        </p>
      )}

      {/* Date cards */}
      <div className="grid grid-cols-3 sm:grid-cols-5" style={{ gap: 10 }}>
        {dateCards.map(({ date, dateStr, available }) => {
          const isSelected = selectedDate === dateStr;

          let bg = "white";
          let border = `1px solid ${available ? AVAILABLE_BORDER : UNAVAILABLE_BORDER}`;
          let textMain = "var(--ink)";
          let textMuted = available ? AVAILABLE_TEXT : UNAVAILABLE_TEXT;
          let opacity = 1;
          const cursor: React.CSSProperties["cursor"] = available ? "pointer" : "not-allowed";

          if (isSelected) {
            bg = "var(--red)";
            border = "1px solid var(--red)";
            textMain = "white";
            textMuted = "rgba(255,255,255,0.85)";
          } else if (!available) {
            bg = UNAVAILABLE_BG;
            opacity = 0.7;
          } else {
            bg = AVAILABLE_BG;
          }

          return (
            <button
              key={dateStr}
              disabled={!available}
              onClick={() => {
                setSelectedDate(dateStr);
                setSelectedSlot(null);
              }}
              className={available && !isSelected ? "date-card-available" : ""}
              style={{
                background: bg,
                color: textMain,
                border,
                borderWidth: 2,
                borderRadius: 10,
                padding: "18px 8px",
                minHeight: 96,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                cursor,
                opacity,
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: isSelected ? "rgba(255,255,255,0.9)" : textMuted,
                }}
              >
                {format(date, "EEE")}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-instrument-serif), Georgia, serif",
                  fontStyle: "italic",
                  fontSize: 34,
                  lineHeight: 1,
                  letterSpacing: "-1px",
                  color: textMain,
                }}
              >
                {format(date, "d")}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                  color: isSelected ? "rgba(255,255,255,0.9)" : textMuted,
                }}
              >
                {format(date, "MMM")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Show more dates */}
      <div style={{ textAlign: "center", marginTop: 18 }}>
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

      {/* Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 24,
          marginTop: 16,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          color: "var(--ink-3)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              border: `1px solid ${AVAILABLE_BORDER}`,
              background: AVAILABLE_BG,
            }}
          />
          Available
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              border: `1px solid ${UNAVAILABLE_BORDER}`,
              background: UNAVAILABLE_BG,
            }}
          />
          Full
        </span>
      </div>

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
            <>
              <p style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 10 }}>
                Booked times don&apos;t appear. Pick any time below.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 10 }}>
                {slotsForSelected.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => {
                        setSelectedSlot(slot);
                        onSlotSelected(slot);
                      }}
                      className="time-pill"
                      style={{
                        background: isSelected ? "var(--red)" : "white",
                        color: isSelected ? "white" : "var(--ink)",
                        border: isSelected
                          ? "2px solid var(--red)"
                          : "2px solid var(--rule-strong)",
                        borderRadius: 100,
                        padding: "16px 8px",
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: "pointer",
                        minHeight: 56,
                        transition: "background 0.15s, border-color 0.15s, color 0.15s",
                      }}
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
