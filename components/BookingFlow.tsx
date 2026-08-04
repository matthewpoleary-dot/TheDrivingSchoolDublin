"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BOOKABLE_LESSON_TYPES,
  BOOKING_POLICY,
  CONTACT,
  TEST_CENTRES,
  contactLinks,
  formatPrice,
  lessonTypeBySlug,
} from "@/lib/config";
import { Plate, Check, ArrowRight } from "@/components/brand";

/**
 * The booking flow.
 *
 * Three steps on one page, no wizard, no route changes: pick a lesson, pick a
 * time, give your details. Everything stays visible so nobody loses their
 * place, and the summary rail keeps the choice and the price on screen while
 * the form is filled in.
 *
 * Deliberate decisions:
 *   - Availability is fetched per lesson type, because durations differ, so a
 *     90-minute pre-test shows fewer starts than a 60-minute lesson. Showing
 *     one grid for all of them would be a lie.
 *   - A slot that vanishes between load and submit returns a 409, and the flow
 *     recovers in place: refresh the grid, keep the typed details, say so.
 *   - Errors go next to the field they belong to, and focus moves to the first
 *     one, because a learner filling this in on a phone should not have to
 *     hunt.
 */

type DayAvailability = { dateKey: string; slots: string[] };

type AvailabilityResponse = {
  configured: boolean;
  timezone: string;
  days: DayAvailability[];
  error?: string;
};

type FieldErrors = Partial<Record<string, string>>;

const DAYS_TO_SHOW = 14;

export default function BookingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialService =
    BOOKABLE_LESSON_TYPES.find((l) => l.slug === searchParams.get("service"))?.slug ??
    BOOKABLE_LESSON_TYPES[0].slug;

  const [serviceSlug, setServiceSlug] = useState(initialService);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error" | "unconfigured">(
    "loading"
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    pickupAddress: "",
    testCentre: "",
    transmission: "",
    notes: "",
    website: "", // honeypot
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const detailsRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);

  const lesson = lessonTypeBySlug(serviceSlug)!;

  // --- Load availability ----------------------------------------------------

  const loadAvailability = useCallback(
    async (slug: string, options: { keepSelection?: boolean } = {}) => {
      setLoadState("loading");
      try {
        const response = await fetch(
          `/api/availability?service=${encodeURIComponent(slug)}&days=${DAYS_TO_SHOW}`,
          { cache: "no-store" }
        );
        const data = (await response.json()) as AvailabilityResponse;

        if (!response.ok) {
          setLoadState("error");
          return;
        }
        if (!data.configured) {
          setLoadState("unconfigured");
          return;
        }

        setAvailability(data.days);
        setLoadState("ready");

        const firstOpen = data.days.find((d) => d.slots.length > 0);

        if (!options.keepSelection) {
          setSelectedDay(firstOpen?.dateKey ?? data.days[0]?.dateKey ?? null);
          setSelectedSlot(null);
        } else if (selectedSlot) {
          // Keep the chosen slot only if it genuinely still exists.
          const stillThere = data.days.some((d) => d.slots.includes(selectedSlot));
          if (!stillThere) setSelectedSlot(null);
        }
      } catch {
        setLoadState("error");
      }
    },
    [selectedSlot]
  );

  useEffect(() => {
    void loadAvailability(serviceSlug);
    // Reloading on serviceSlug alone is intentional: loadAvailability changes
    // identity whenever a slot is picked, and re-fetching then would be wrong.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceSlug]);

  const dayLookup = useMemo(
    () => new Map(availability.map((d) => [d.dateKey, d.slots])),
    [availability]
  );

  const slotsForDay = selectedDay ? (dayLookup.get(selectedDay) ?? []) : [];
  const hasAnyAvailability = availability.some((d) => d.slots.length > 0);

  // --- Submit ---------------------------------------------------------------

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedSlot || submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: serviceSlug,
          startsAt: selectedSlot,
          name: form.name,
          email: form.email,
          phone: form.phone,
          pickupAddress: form.pickupAddress,
          testCentre: form.testCentre,
          transmission: form.transmission || undefined,
          notes: form.notes,
          website: form.website,
        }),
      });

      const data = await response.json();

      if (response.status === 409) {
        // Someone took it. Recover in place, keeping everything they typed.
        setSubmitError(
          data.message ?? "That time has just been taken. Please choose another."
        );
        await loadAvailability(serviceSlug, { keepSelection: true });
        setSelectedSlot(null);
        slotsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      if (!response.ok) {
        if (data.fields) {
          setFieldErrors(data.fields);
          const firstField = Object.keys(data.fields)[0];
          document.getElementById(firstField)?.focus();
        }
        setSubmitError(data.error === "Please check the form" ? null : (data.error ?? "Something went wrong."));
        return;
      }

      router.push(data.redirectUrl);
    } catch {
      setSubmitError(
        "We could not reach the booking system. Please ring or WhatsApp us and we will book you in."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // --- Render ---------------------------------------------------------------

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-start">
      <form onSubmit={handleSubmit} className="min-w-0 space-y-12">
        {/* ---------------------------------------------------------------- */}
        <Step number="1" title="What kind of lesson?">
          <fieldset>
            <legend className="sr-only">Lesson type</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {BOOKABLE_LESSON_TYPES.map((type) => {
                const active = type.slug === serviceSlug;
                return (
                  <button
                    key={type.slug}
                    type="button"
                    onClick={() => setServiceSlug(type.slug)}
                    aria-pressed={active}
                    className={`flex flex-col items-start gap-1 border-2 p-4 text-left transition-colors ${
                      active
                        ? "border-ink bg-ink text-white"
                        : "border-rule bg-white hover:border-ink"
                    }`}
                  >
                    <span className="flex w-full items-start justify-between gap-2">
                      <span className="font-bold">{type.name}</span>
                      {active && <Check className="mt-0.5 text-plate" />}
                    </span>
                    <span
                      className={`tabular text-sm ${active ? "text-white/70" : "text-ink-soft"}`}
                    >
                      {formatPrice(type.priceCents)} &middot; {type.durationMinutes} min
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <p className="mt-4 text-sm text-ink-soft">
            Looking for the full EDT programme or car hire for your test?{" "}
            <a href={contactLinks.whatsapp()} className="font-bold text-ink underline">
              Message us
            </a>{" "}
            and we will sort it.
          </p>
        </Step>

        {/* ---------------------------------------------------------------- */}
        <Step number="2" title="Pick a time" ref={slotsRef}>
          {loadState === "loading" && <SlotSkeleton />}

          {loadState === "unconfigured" && (
            <Notice tone="caution" title="Online booking is not switched on yet">
              Ring or WhatsApp {CONTACT.phoneDisplay} and we will book you in directly.
            </Notice>
          )}

          {loadState === "error" && (
            <Notice tone="caution" title="We could not load the calendar">
              <button
                type="button"
                onClick={() => void loadAvailability(serviceSlug)}
                className="font-bold underline"
              >
                Try again
              </button>
              , or ring {CONTACT.phoneDisplay}.
            </Notice>
          )}

          {loadState === "ready" && !hasAnyAvailability && (
            <Notice tone="caution" title="Nothing free in the next two weeks">
              Ring or WhatsApp {CONTACT.phoneDisplay} and we will find you a time.
            </Notice>
          )}

          {loadState === "ready" && hasAnyAvailability && (
            <>
              <DayStrip
                days={availability}
                selected={selectedDay}
                onSelect={(day) => {
                  setSelectedDay(day);
                  setSelectedSlot(null);
                }}
              />

              <div className="mt-6">
                {slotsForDay.length === 0 ? (
                  <p className="border-2 border-dashed border-rule p-6 text-center text-sm text-ink-soft">
                    Nothing free on this day. Try another.
                  </p>
                ) : (
                  <>
                    <p className="eyebrow mb-3">
                      {slotsForDay.length} time{slotsForDay.length === 1 ? "" : "s"} available
                    </p>
                    <div
                      role="group"
                      aria-label="Available times"
                      className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
                    >
                      {slotsForDay.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setSubmitError(null);
                            requestAnimationFrame(() =>
                              detailsRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              })
                            );
                          }}
                          aria-pressed={slot === selectedSlot}
                          className="slot"
                        >
                          {formatSlotTime(slot)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <p className="mt-5 text-sm text-ink-soft">
                All times are Dublin time. We need at least{" "}
                {BOOKING_POLICY.minimumNoticeHours} hours&apos; notice, so today may look
                quiet.
              </p>
            </>
          )}
        </Step>

        {/* ---------------------------------------------------------------- */}
        <div ref={detailsRef}>
          <Step number="3" title="Your details">
            {!selectedSlot ? (
              <p className="border-2 border-dashed border-rule p-6 text-sm text-ink-soft">
                Pick a time above and this will open.
              </p>
            ) : (
              <div className="space-y-5">
                <Field
                  id="name"
                  label="Full name"
                  required
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                  error={fieldErrors.name}
                  autoComplete="name"
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="phone"
                    label="Mobile"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(v) => setForm({ ...form, phone: v })}
                    error={fieldErrors.phone}
                    autoComplete="tel"
                    inputMode="tel"
                    hint="So we can text you if anything changes"
                  />
                  <Field
                    id="email"
                    label="Email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(v) => setForm({ ...form, email: v })}
                    error={fieldErrors.email}
                    autoComplete="email"
                    inputMode="email"
                    hint="Your confirmation goes here"
                  />
                </div>

                {lesson.needsPickup && (
                  <Field
                    id="pickupAddress"
                    label="Pick-up address"
                    required
                    value={form.pickupAddress}
                    onChange={(v) => setForm({ ...form, pickupAddress: v })}
                    error={fieldErrors.pickupAddress}
                    autoComplete="street-address"
                    hint="Where should Conor collect you?"
                  />
                )}

                {lesson.needsTestCentre && (
                  <div>
                    <label htmlFor="testCentre" className="field-label">
                      Test centre
                    </label>
                    <select
                      id="testCentre"
                      value={form.testCentre}
                      onChange={(e) => setForm({ ...form, testCentre: e.target.value })}
                      className="field"
                    >
                      <option value="">Not sure yet</option>
                      {TEST_CENTRES.map((centre) => (
                        <option key={centre} value={centre}>
                          {centre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <span className="field-label">Car</span>
                  <div className="flex gap-2">
                    {[
                      ["manual", "Manual"],
                      ["automatic", "Automatic"],
                      ["", "Not sure"],
                    ].map(([value, label]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setForm({ ...form, transmission: value })}
                        aria-pressed={form.transmission === value}
                        className="slot flex-1"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="field-label">
                    Anything Conor should know?
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="field resize-y"
                    placeholder="Test booked for the 12th, nervous on roundabouts, that sort of thing."
                  />
                </div>

                {/* Honeypot. Hidden from people, irresistible to bots. */}
                <div aria-hidden="true" className="absolute left-[-9999px]">
                  <label htmlFor="website">Leave this empty</label>
                  <input
                    id="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                </div>

                {submitError && (
                  <div role="alert" aria-live="assertive">
                    <Notice tone="plate" title="Hold on">
                      {submitError}
                    </Notice>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary w-full text-base"
                >
                  {submitting ? (
                    "Holding your slot..."
                  ) : (
                    <>
                      Pay {formatPrice(BOOKING_POLICY.depositCents)} deposit and confirm
                      <ArrowRight />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-ink-soft">
                  Card handled by Stripe. Balance of{" "}
                  <span className="tabular font-bold text-ink">
                    {formatPrice(lesson.priceCents - BOOKING_POLICY.depositCents)}
                  </span>{" "}
                  paid to Conor on the day. Free cancellation up to{" "}
                  {BOOKING_POLICY.freeCancellationHours} hours before.
                </p>
              </div>
            )}
          </Step>
        </div>
      </form>

      <SummaryRail
        lesson={lesson}
        selectedSlot={selectedSlot}
        pickup={form.pickupAddress}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function Step({
  number,
  title,
  children,
  ref,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}) {
  return (
    <section ref={ref} className="rule-heavy pt-5">
      <div className="mb-6 flex items-center gap-3">
        <Plate letter={number} size="sm" tone="ink" />
        <h2 className="text-xl font-extrabold tracking-[-0.02em]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DayStrip({
  days,
  selected,
  onSelect,
}: {
  days: DayAvailability[];
  selected: string | null;
  onSelect: (dateKey: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Choose a day"
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2"
    >
      {days.map((day) => {
        const date = new Date(`${day.dateKey}T12:00:00Z`);
        const open = day.slots.length > 0;
        return (
          <button
            key={day.dateKey}
            type="button"
            onClick={() => onSelect(day.dateKey)}
            disabled={!open}
            aria-pressed={day.dateKey === selected}
            aria-label={`${date.toLocaleDateString("en-IE", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}, ${open ? `${day.slots.length} times available` : "fully booked"}`}
            className="day-tab"
          >
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider opacity-70">
              {date.toLocaleDateString("en-IE", { weekday: "short" })}
            </span>
            <span className="tabular text-lg font-extrabold leading-none">
              {date.getUTCDate()}
            </span>
            <span className="tabular text-[0.625rem] opacity-70">
              {open ? `${day.slots.length} free` : "full"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SummaryRail({
  lesson,
  selectedSlot,
  pickup,
}: {
  lesson: NonNullable<ReturnType<typeof lessonTypeBySlug>>;
  selectedSlot: string | null;
  pickup: string;
}) {
  const balance = lesson.priceCents - BOOKING_POLICY.depositCents;

  return (
    <aside className="lg:sticky lg:top-24">
      <div className="panel p-6">
        <p className="eyebrow">Your lesson</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-[-0.02em]">{lesson.name}</h2>

        <dl className="mt-5 space-y-3 text-sm">
          <Row label="When">
            {selectedSlot ? (
              <span className="font-bold">{formatSlotFull(selectedSlot)}</span>
            ) : (
              <span className="text-ink-faint">Not chosen yet</span>
            )}
          </Row>
          <Row label="Length">{lesson.durationMinutes} minutes</Row>
          {pickup && <Row label="Pick-up">{pickup}</Row>}
        </dl>

        <div className="mt-5 border-t-2 border-ink pt-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Lesson</dt>
              <dd className="tabular font-bold">{formatPrice(lesson.priceCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Deposit today</dt>
              <dd className="tabular font-bold text-plate">
                {formatPrice(BOOKING_POLICY.depositCents)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">On the day</dt>
              <dd className="tabular font-bold">{formatPrice(balance)}</dd>
            </div>
          </dl>
        </div>

        <ul className="mt-5 space-y-2 border-t border-rule pt-4 text-sm text-ink-soft">
          {[
            `Free cancellation up to ${BOOKING_POLICY.freeCancellationHours} hours before`,
            "Dual-control car, fully insured",
            "Confirmation and calendar invite by email",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check className="mt-0.5 text-pass" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel-quiet mt-4 p-5">
        <p className="text-sm font-bold">Rather talk to someone?</p>
        <p className="mt-1 text-sm text-ink-soft">
          Ring or message and we will book you in.
        </p>
        <div className="mt-3 grid gap-2">
          <a href={contactLinks.tel} className="btn btn-outline w-full text-sm">
            {CONTACT.phoneDisplay}
          </a>
          <a
            href={contactLinks.whatsapp()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-quiet w-full text-sm"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </aside>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  required,
  type = "text",
  autoComplete,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email";
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="ml-1 text-plate">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
        className="field"
      />
      {error && (
        <p id={errorId} className="field-error" role="alert">
          <span aria-hidden="true">!</span> {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  );
}

function Notice({
  tone,
  title,
  children,
}: {
  tone: "caution" | "plate" | "pass";
  title: string;
  children: React.ReactNode;
}) {
  const styles = {
    caution: "border-caution bg-caution-wash",
    plate: "border-plate bg-plate-wash",
    pass: "border-pass bg-pass-wash",
  }[tone];

  return (
    <div className={`border-2 p-5 ${styles}`}>
      <p className="font-bold">{title}</p>
      <p className="mt-1 text-sm">{children}</p>
    </div>
  );
}

function SlotSkeleton() {
  return (
    <div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton h-[3.75rem] w-14 flex-none" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="skeleton h-12" />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        Loading available times
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

function formatSlotTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IE", {
    timeZone: "Europe/Dublin",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function formatSlotFull(iso: string): string {
  return new Intl.DateTimeFormat("en-IE", {
    timeZone: "Europe/Dublin",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}
