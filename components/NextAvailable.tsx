"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BOOKING_POLICY, CONTACT, contactLinks, formatPrice } from "@/lib/config";
import { ArrowRight } from "@/components/brand";

/**
 * Live availability in the hero.
 *
 * The single most useful thing this site can do above the fold is prove that
 * booking is real and immediate, so it shows actual free slots from the
 * instructor's calendar rather than a "Book now" button that leads to a form.
 * Tapping a time goes straight into the flow with that slot pre-selected.
 *
 * Every failure mode falls back to the phone, because a learner who cannot
 * book should still be able to reach a human in one tap.
 */

type DayAvailability = { dateKey: string; slots: string[] };

type State =
  | { kind: "loading" }
  | { kind: "ready"; days: DayAvailability[] }
  | { kind: "empty" }
  | { kind: "unavailable" };

const SERVICE = "standard-lesson";

export default function NextAvailable() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`/api/availability?service=${SERVICE}&days=10`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (cancelled) return;

        if (!response.ok || !data.configured) {
          setState({ kind: "unavailable" });
          return;
        }

        const withSlots = (data.days as DayAvailability[]).filter((d) => d.slots.length > 0);
        setState(withSlots.length === 0 ? { kind: "empty" } : { kind: "ready", days: withSlots });
      } catch {
        if (!cancelled) setState({ kind: "unavailable" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="panel p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Next available</p>
          <h2 className="mt-1.5 text-xl font-extrabold tracking-[-0.025em]">
            Book a lesson now
          </h2>
        </div>
        {/* Only claim to be live when live times are genuinely on screen. */}
        {state.kind === "ready" && (
          <span className="badge badge-pass whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-pass" aria-hidden="true" />
            Live
          </span>
        )}
      </div>

      <div className="mt-6">
        {state.kind === "loading" && <Loading />}

        {state.kind === "ready" && (
          <div className="space-y-4">
            {state.days.slice(0, 3).map((day) => (
              <div key={day.dateKey}>
                <p className="mb-2 text-[0.8125rem] font-bold text-ink-soft">
                  {formatDayLabel(day.dateKey)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {day.slots.slice(0, 4).map((slot) => (
                    <Link
                      key={slot}
                      href={`/book?service=${SERVICE}&slot=${encodeURIComponent(slot)}`}
                      className="slot px-3.5"
                    >
                      {formatTime(slot)}
                    </Link>
                  ))}
                  {day.slots.length > 4 && (
                    <Link
                      href={`/book?service=${SERVICE}`}
                      className="slot px-3.5 !border-dashed text-ink-soft"
                    >
                      +{day.slots.length - 4}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {state.kind === "empty" && (
          <div className="border-2 border-dashed border-rule p-5 text-center">
            <p className="text-sm font-bold">Fully booked for the next while</p>
            <p className="mt-1 text-sm text-ink-soft">
              Give us a ring and we will find you something.
            </p>
          </div>
        )}

        {state.kind === "unavailable" && (
          <div className="border-2 border-dashed border-rule p-5 text-center">
            <p className="text-sm font-bold">Book by phone or WhatsApp</p>
            <p className="mt-1 text-sm text-ink-soft">
              We will confirm your lesson the same day.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 border-t-2 border-ink pt-5">
        <Link href="/book" className="btn btn-primary w-full">
          See all times
          <ArrowRight />
        </Link>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={contactLinks.tel} className="btn btn-quiet text-sm">
            Call
          </a>
          <a
            href={contactLinks.whatsapp()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-quiet text-sm"
          >
            WhatsApp
          </a>
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-ink-faint">
          {formatPrice(BOOKING_POLICY.depositCents)} deposit holds your slot. Free
          cancellation up to {BOOKING_POLICY.freeCancellationHours} hours before.
          <span className="sr-only"> Or call {CONTACT.phoneDisplay}.</span>
        </p>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="space-y-4" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading available times</span>
      {Array.from({ length: 3 }).map((_, row) => (
        <div key={row}>
          <div className="skeleton mb-2 h-4 w-28" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-[4.25rem]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IE", {
    timeZone: "Europe/Dublin",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function formatDayLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Dublin" }).format(
    new Date()
  );
  const tomorrow = new Date(Date.now() + 86_400_000);
  const tomorrowKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Dublin" }).format(
    tomorrow
  );

  if (dateKey === todayKey) return "Today";
  if (dateKey === tomorrowKey) return "Tomorrow";

  return new Intl.DateTimeFormat("en-IE", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
}
