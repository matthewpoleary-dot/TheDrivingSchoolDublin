"use client";
// components/lton/NextSlots.tsx — the hero's "Next free lessons" card.
//
// Reads the same public availability the booking calendar uses (GET /api/availability)
// and shows the next few open standard-lesson times. Each time, and the button, go to
// /book?service=standard, where the learner picks the slot on the live calendar.
import { useEffect, useState } from "react";
import Link from "next/link";
import { format, addDays, startOfDay } from "date-fns";
import { SERVICES, formatPrice } from "@/lib/pricing";
import { ArrowRight } from "./Icons";

type Slot = { id: string; date: string; start_time: string; end_time: string };

const SHOW = 3;
const DAYS_AHEAD = 14;
const BOOK_HREF = "/book?service=standard";

export default function NextSlots() {
  const [slots, setSlots] = useState<Slot[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const today = startOfDay(new Date());
    const start = format(today, "yyyy-MM-dd");
    const end = format(addDays(today, DAYS_AHEAD), "yyyy-MM-dd");

    fetch(`/api/availability?start_date=${start}&end_date=${end}&service_type=standard`)
      .then((r) => r.json())
      .then((data: Slot[]) => {
        if (cancelled) return;
        const now = Date.now();
        const upcoming = (Array.isArray(data) ? data : [])
          .filter((s) => new Date(`${s.date}T${s.start_time}`).getTime() > now)
          .sort((a, b) => `${a.date}T${a.start_time}`.localeCompare(`${b.date}T${b.start_time}`))
          .slice(0, SHOW);
        setSlots(upcoming);
      })
      .catch(() => { if (!cancelled) setSlots([]); });

    return () => { cancelled = true; };
  }, []);

  const lesson = SERVICES.standard;

  return (
    <aside className="l-nextslots" aria-labelledby="nextslots-title" aria-busy={slots === null}>
      <div className="l-nextslots__head">
        <span className="l-nextslots__plate" aria-hidden="true"><span>L</span></span>
        <div>
          <p id="nextslots-title" className="l-nextslots__title">Next free lessons</p>
          <p className="l-nextslots__meta">Standard lesson · {lesson.durationMinutes} minutes</p>
        </div>
      </div>

      {slots === null ? (
        <ul className="l-nextslots__list" aria-hidden="true">
          {Array.from({ length: SHOW }).map((_, i) => (
            <li key={i}><span className="l-nextslots__ghost" /></li>
          ))}
        </ul>
      ) : slots.length === 0 ? (
        <p className="l-nextslots__empty">
          No free slots in the next two weeks. See the calendar for later dates.
        </p>
      ) : (
        <ul className="l-nextslots__list">
          {slots.map((s) => (
            <li key={s.id}>
              <Link href={BOOK_HREF} className="l-nextslots__slot">
                <span>{format(new Date(`${s.date}T00:00:00`), "EEE d MMM")}</span>
                <strong className="l-num">{s.start_time.slice(0, 5)}</strong>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="l-nextslots__foot">
        <p className="l-nextslots__price l-num">{formatPrice(lesson.pricePence)}</p>
        <Link href={BOOK_HREF} className="l-btn l-btn--ink l-btn--sm">
          {slots && slots.length === 0 ? "See the calendar" : "Book a time"} <ArrowRight size={14} />
        </Link>
      </div>
    </aside>
  );
}
