"use client";
// app/book/page.tsx
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BookingCalendar, { type Slot } from "@/components/BookingCalendar";
import { ArrowRight } from "@/components/lton/Icons";
import { SERVICES, type ServiceSlug, formatPrice } from "@/lib/pricing";

type ServiceGroup = {
  heading: string;
  options: { slug: ServiceSlug; label: string; price: string; subtitle?: string; tag?: string }[];
};

const price = (slug: ServiceSlug) => formatPrice(SERVICES[slug].pricePence);

const SERVICE_GROUPS: ServiceGroup[] = [
  {
    heading: "Lessons",
    options: [
      { slug: "standard",  label: "Standard Lesson",   price: price("standard"),  subtitle: "60 minutes, one-to-one." },
      { slug: "pre-test",  label: "Pre-Test Lesson",   price: price("pre-test"),  subtitle: "Mock route, manoeuvres, examiner feedback, plus exam questions and road signs." },
      { slug: "refresher", label: "Refresher Lesson",  price: price("refresher"), subtitle: "For licensed drivers returning to the wheel." },
    ],
  },
  {
    heading: "EDT programmes",
    options: [
      { slug: "edt-6",      label: "6 Reduced EDT Lessons",     price: price("edt-6"),      subtitle: "The reduced EDT package." },
      { slug: "edt-bundle", label: "EDT Bundle, 12 lessons",    price: price("edt-bundle"), subtitle: "Pay once. Book sessions one at a time.", tag: "Best value" },
      { slug: "edt-split",  label: "EDT Bundle, split payment", price: `${price("edt-split")} × 2`, subtitle: `Pay ${price("edt-split")} now. ${price("edt-split")} before lessons 7 to 12. ${formatPrice(SERVICES["edt-split"].pricePence * 2)} total.` },
    ],
  },
];

// Car hire = single row with a dropdown that picks the variant
const CAR_HIRE_OPTIONS: { slug: ServiceSlug; label: string; price: string }[] = [
  { slug: "car-hire-centre", label: "At the test centre",            price: price("car-hire-centre") },
  { slug: "car-hire-local",  label: "Local pickup and drop-off",     price: price("car-hire-local") },
  { slug: "car-hire-lesson", label: "Car hire plus pre-test lesson", price: price("car-hire-lesson") },
];

const NO_SLOT_SERVICES: ServiceSlug[] = ["edt-bundle", "edt-6", "edt-split"];

// Areas Conor covers, used in the customer details dropdown
const COVERED_AREAS = ["D2", "D4", "D6", "D6W", "D8", "D12", "D14"] as const;

type Step = "service" | "slot" | "details" | "redirecting";

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: "service", label: "Service" },
  { key: "slot",    label: "Time" },
  { key: "details", label: "Details" },
];

// ─── Step indicator: numbered plates joined by a road line ───────────────────
function StepIndicator({ current }: { current: Step }) {
  const order: Step[] = ["service", "slot", "details"];
  const activeIdx = order.indexOf(current === "redirecting" ? "details" : current);

  return (
    <ol className="l-stepper" aria-label="Booking steps">
      {STEP_LABELS.map((s, i) => {
        const state = i < activeIdx ? "done" : i === activeIdx ? "active" : "todo";
        return (
          <li key={s.key} data-state={state} aria-current={state === "active" ? "step" : undefined}>
            <span className="l-stepper__n">
              {state === "done" ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 7.5l3.2 3L12 3.5" stroke="currentColor" strokeWidth="2.4" />
                </svg>
              ) : i + 1}
            </span>
            {s.label}
          </li>
        );
      })}
    </ol>
  );
}

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="l-back">
      <ArrowRight size={16} /> Back
    </button>
  );
}

function BookPageInner() {
  const searchParams = useSearchParams();
  const preselect = searchParams.get("service") as ServiceSlug | null;
  const cancelled  = searchParams.get("cancelled") === "1";

  const [step, setStep]               = useState<Step>(preselect ? "slot" : "service");
  const [service, setService]         = useState<ServiceSlug | null>(preselect);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [name,  setName]   = useState("");
  const [email, setEmail]  = useState("");
  const [phone, setPhone]  = useState("");
  const [notes, setNotes]  = useState("");
  const [area,  setArea]   = useState("");

  // Car-hire dropdown selection (single-row UX)
  const [carHireSlug, setCarHireSlug] = useState<ServiceSlug>("car-hire-centre");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    if (service && NO_SLOT_SERVICES.includes(service) && step === "slot") {
      setStep("details");
    }
  }, [service, step]);

  const serviceConfig = service ? SERVICES[service] : null;

  async function handleCheckout() {
    if (!service) return;
    setError("");
    setSubmitting(true);
    try {
      const trimmedNotes = notes.trim();
      const combinedNotes = area
        ? `Pickup area: ${area}.${trimmedNotes ? ` ${trimmedNotes}` : ""}`
        : trimmedNotes || undefined;

      const res  = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id:         selectedSlot?.id ?? undefined,
          service_type:    service,
          customer_name:   name.trim(),
          customer_email:  email.trim().toLowerCase(),
          customer_phone:  phone.trim(),
          notes:           combinedNotes,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to create checkout session");
      setStep("redirecting");
      window.location.href = data.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  // ── Service selection ───────────────────────────────────────────────────────
  if (step === "service") {
    const hire = CAR_HIRE_OPTIONS.find((o) => o.slug === carHireSlug);
    return (
      <div className="l-page l-flow">
        <StepIndicator current="service" />
        <h1 className="l-display l-h2">Book a lesson.</h1>
        <p className="l-lede">Choose your lesson type to get started.</p>

        {cancelled && (
          <div className="l-notice" role="status" style={{ marginTop: 24 }}>
            Payment cancelled. Your slot has not been reserved. Select a service to try again.
          </div>
        )}

        {SERVICE_GROUPS.map((group) => (
          <div key={group.heading} className="l-svc-group">
            <h2>{group.heading}</h2>
            <div className="l-svc-list">
              {group.options.map((opt) => (
                <button
                  key={opt.slug}
                  onClick={() => {
                    setService(opt.slug);
                    setSelectedSlot(null);
                    setStep(NO_SLOT_SERVICES.includes(opt.slug) ? "details" : "slot");
                  }}
                  className="l-svc"
                >
                  <div>
                    <div className="l-svc__name">
                      {opt.label}
                      {opt.tag && <span className="l-tag l-tag--solid">{opt.tag}</span>}
                    </div>
                    <div className="l-svc__sub">{opt.subtitle ?? SERVICES[opt.slug].description}</div>
                  </div>
                  <div className="l-svc__price l-num">{opt.price}</div>
                  <span aria-hidden="true" className="l-svc__go"><ArrowRight /></span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* ── Car Hire: single row with dropdown ─────────────────────────── */}
        <div className="l-svc-group">
          <h2>Car hire for your test</h2>
          <div className="l-svc-list">
            <div className="l-svc l-svc--hire">
              <div>
                <div className="l-svc__name">Car Hire for Test</div>
                <div className="l-svc__sub" style={{ marginBottom: 12 }}>Choose your option:</div>
              </div>
              <div className="l-svc__price l-num" style={{ alignSelf: "start" }}>{hire?.price}</div>
              <div className="l-svc__controls">
                <select
                  value={carHireSlug}
                  onChange={(e) => setCarHireSlug(e.target.value as ServiceSlug)}
                  className="l-input"
                  aria-label="Pick a car-hire option"
                >
                  {CAR_HIRE_OPTIONS.map((o) => (
                    <option key={o.slug} value={o.slug}>
                      {o.label}, {o.price}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setService(carHireSlug);
                    setSelectedSlot(null);
                    setStep("slot");
                  }}
                  aria-label="Continue with this car-hire option"
                  className="l-svc__go"
                  style={{ cursor: "pointer", height: 50, width: 44 }}
                >
                  <ArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Slot selection ──────────────────────────────────────────────────────────
  if (step === "slot" && service && serviceConfig) {
    return (
      <div className="l-page l-flow">
        <StepIndicator current="slot" />
        <Back onClick={() => { setStep("service"); setSelectedSlot(null); }} />
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "4px 16px", margin: "8px 0 24px" }}>
          <h1 className="l-h3" style={{ marginBottom: 0 }}>{serviceConfig.label}</h1>
          <span className="l-svc__price l-num">{formatPrice(serviceConfig.pricePence)}</span>
        </div>

        <div className="l-panel">
          <p className="l-label" style={{ marginBottom: 16 }}>Select an available date and time:</p>
          <BookingCalendar
            serviceType={service}
            onSlotSelected={(slot) => setSelectedSlot(slot)}
          />
        </div>

        {selectedSlot && (
          <div className="l-selected">
            <div>
              <p>Selected slot</p>
              <p className="l-num">
                {selectedSlot.date} · {selectedSlot.start_time.slice(0, 5)}–{selectedSlot.end_time.slice(0, 5)}
              </p>
            </div>
            <button onClick={() => setStep("details")} className="l-btn l-btn--red">
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Customer details ────────────────────────────────────────────────────────
  if (step === "details" && service && serviceConfig) {
    const isBundle = NO_SLOT_SERVICES.includes(service);
    return (
      <div className="l-page l-flow l-flow--narrow">
        <StepIndicator current="details" />
        <Back onClick={() => setStep(isBundle ? "service" : "slot")} />
        <h1 className="l-h3" style={{ margin: "8px 0 20px" }}>Your details</h1>

        {/* Booking summary */}
        <div className="l-summary">
          <div className="l-summary__row">
            <span>Service</span>
            <span>{serviceConfig.label}</span>
          </div>
          {selectedSlot && (
            <div className="l-summary__row">
              <span>Slot</span>
              <span className="l-num">
                {selectedSlot.date} · {selectedSlot.start_time.slice(0, 5)}–{selectedSlot.end_time.slice(0, 5)}
              </span>
            </div>
          )}
          {isBundle && (
            <p className="l-hint">
              You&apos;ll receive a personal booking link by email to schedule your individual sessions.
            </p>
          )}
          <div className="l-summary__row l-summary__total">
            <span>Total</span>
            <span className="l-num">{formatPrice(serviceConfig.pricePence)}</span>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); void handleCheckout(); }}
          className="l-form"
        >
          <div className="l-field">
            <label htmlFor="bk-name" className="l-label">
              Full Name <i aria-hidden="true">*</i>
            </label>
            <input
              id="bk-name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="l-input"
              placeholder="Your full name"
            />
          </div>

          <div className="l-field">
            <label htmlFor="bk-email" className="l-label">
              Email Address <i aria-hidden="true">*</i>
            </label>
            <input
              id="bk-email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="l-input"
              placeholder="you@example.com"
            />
          </div>

          <div className="l-field">
            <label htmlFor="bk-phone" className="l-label">
              Phone Number <i aria-hidden="true">*</i>
            </label>
            <input
              id="bk-phone"
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="l-input"
              placeholder="+353 86 123 4567"
            />
          </div>

          <div className="l-field">
            <label htmlFor="bk-area" className="l-label">
              Pickup area <i aria-hidden="true">*</i>
            </label>
            <select
              id="bk-area"
              required
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="l-input"
              style={{ cursor: "pointer" }}
            >
              <option value="" disabled>Pick your Dublin postcode</option>
              {COVERED_AREAS.map((a) => (
                <option key={a} value={a}>Dublin {a.slice(1)}</option>
              ))}
              <option value="other">Other area (I&apos;ll contact you first)</option>
            </select>
            {area === "other" && (
              <p className="l-notice l-notice--error" style={{ marginTop: 8, fontSize: 14 }}>
                <span>
                  We mainly cover D2, D4, D6, D6W, D8, D12, and D14.{" "}
                  <Link href="/contact" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>
                    Contact us
                  </Link>{" "}
                  to confirm coverage before paying.
                </span>
              </p>
            )}
          </div>

          <div className="l-field">
            <label htmlFor="bk-notes" className="l-label">
              Notes <em>(optional)</em>
            </label>
            <textarea
              id="bk-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="l-input"
              style={{ minHeight: 88 }}
              placeholder="Anything the instructor should know…"
            />
          </div>

          {error && (
            <p className="l-notice l-notice--error" role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || area === "other" || !area}
            className="l-btn l-btn--red l-btn--lg l-btn--block"
          >
            {submitting
              ? "Redirecting to payment…"
              : area === "other"
              ? "Contact us before paying"
              : `Pay ${formatPrice(serviceConfig.pricePence)} securely`}
          </button>

          <p className="l-hint" style={{ textAlign: "center" }}>
            Powered by Stripe · Card, Apple Pay &amp; Google Pay accepted
          </p>
        </form>
      </div>
    );
  }

  // ── Redirecting ─────────────────────────────────────────────────────────────
  if (step === "redirecting") {
    return (
      <div className="l-page l-flow l-flow--narrow" style={{ paddingTop: 96, textAlign: "center" }} role="status">
        <p className="l-h3" style={{ marginBottom: 10 }}>Redirecting to payment…</p>
        <p className="l-hint">Please don&apos;t close this tab.</p>
      </div>
    );
  }

  return (
    <div className="l-page l-flow" style={{ paddingTop: 96, textAlign: "center" }}>
      <p className="l-body">
        Something went wrong.{" "}
        <Link href="/book" className="l-link">
          Start over
        </Link>
      </p>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="l-page l-flow" style={{ paddingTop: 96, textAlign: "center" }}>
          <p className="l-body">Loading…</p>
        </div>
      }
    >
      <BookPageInner />
    </Suspense>
  );
}
