"use client";
// app/book/page.tsx
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BookingCalendar, { type Slot } from "@/components/BookingCalendar";
import { SERVICES, type ServiceSlug, formatPrice } from "@/lib/pricing";

type ServiceGroup = {
  heading: string;
  options: { slug: ServiceSlug; label: string; price: string; subtitle?: string; tag?: string }[];
};

const SERVICE_GROUPS: ServiceGroup[] = [
  {
    heading: "Lessons",
    options: [
      { slug: "standard",  label: "Standard Lesson",   price: "€80",  subtitle: "60 minutes, one-to-one." },
      { slug: "pre-test",  label: "Pre-Test Lesson",   price: "€100", subtitle: "Mock route, manoeuvres, examiner feedback, plus exam questions and road signs." },
      { slug: "refresher", label: "Refresher Lesson",  price: "€80",  subtitle: "For licensed drivers returning to the wheel." },
    ],
  },
  {
    heading: "EDT programmes",
    options: [
      { slug: "edt-6",      label: "6 Reduced EDT Lessons",     price: "€455", subtitle: "The reduced EDT package." },
      { slug: "edt-bundle", label: "EDT Bundle, 12 lessons",    price: "€905", subtitle: "Pay once. Book sessions one at a time.", tag: "Best value" },
      { slug: "edt-split",  label: "EDT Bundle, split payment", price: "€475 × 2", subtitle: "Pay €475 now. €475 before lessons 7 to 12. €950 total." },
    ],
  },
];

// Car hire = single row with a dropdown that picks the variant
const CAR_HIRE_OPTIONS: { slug: ServiceSlug; label: string; price: string }[] = [
  { slug: "car-hire-centre", label: "At the test centre",            price: "€150" },
  { slug: "car-hire-local",  label: "Local pickup and drop-off",     price: "€200" },
  { slug: "car-hire-lesson", label: "Car hire plus pre-test lesson", price: "€245" },
];

const NO_SLOT_SERVICES: ServiceSlug[] = ["edt-bundle", "edt-6", "edt-split"];

// Areas Conor covers — used in the customer details dropdown
const COVERED_AREAS = ["D2", "D4", "D6", "D6W", "D8", "D12", "D14"] as const;

type Step = "service" | "slot" | "details" | "redirecting";

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: "service", label: "Service" },
  { key: "slot",    label: "Time" },
  { key: "details", label: "Details" },
];

// ─── Step indicator (serif italic numbers) ───────────────────────────────────
function StepIndicator({ current }: { current: Step }) {
  const order: Step[] = ["service", "slot", "details"];
  const activeIdx = order.indexOf(current === "redirecting" ? "details" : current);
  const numerals = ["i", "ii", "iii"];

  return (
    <div style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 24, marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", maxWidth: 400 }}>
        {STEP_LABELS.map((s, i) => {
          const done   = i < activeIdx;
          const active = i === activeIdx;
          return (
            <div key={s.key} style={{ display: "flex", flex: i < STEP_LABELS.length - 1 ? 1 : undefined, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: 100,
                    fontFamily: "var(--font-instrument-serif), Georgia, serif",
                    fontStyle: "italic",
                    fontSize: active ? 16 : 14,
                    fontWeight: 400,
                    background: active ? "var(--red)" : done ? "transparent" : "transparent",
                    color: active ? "white" : done ? "var(--red)" : "var(--ink-3)",
                    border: active ? "none" : done ? "1px solid var(--red)" : "1px solid var(--rule-strong)",
                    transition: "all 0.2s",
                  }}
                >
                  {done ? "✓" : numerals[i]}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: active ? "var(--ink)" : "var(--ink-3)",
                  }}
                >
                  {s.label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <span
                  style={{
                    flex: 1,
                    height: 1,
                    background: done ? "var(--red)" : "var(--rule)",
                    margin: "0 12px",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shared input style ───────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 6,
  border: "1px solid var(--rule-strong)",
  padding: "10px 14px",
  fontSize: 15,
  color: "var(--ink)",
  background: "white",
  outline: "none",
  boxSizing: "border-box",
};

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
    return (
      <div style={{ padding: "48px 22px 64px", maxWidth: 720, margin: "0 auto" }}>
        <StepIndicator current="service" />
        <h1
          style={{
            fontFamily: "var(--font-instrument-serif), Georgia, serif",
            fontWeight: 400,
            fontSize: 44,
            lineHeight: 1.05,
            letterSpacing: "-1px",
            color: "var(--ink)",
            marginBottom: 10,
          }}
        >
          Book a <em style={{ fontStyle: "italic" }}>lesson.</em>
        </h1>
        <p style={{ fontSize: 17, color: "var(--ink-2)", marginBottom: 40 }}>
          Choose your lesson type to get started.
        </p>

        {cancelled && (
          <div
            style={{
              borderRadius: 8,
              border: "1px solid #fde68a",
              background: "#fffbeb",
              padding: "14px 18px",
              fontSize: 15,
              color: "#92400e",
              marginBottom: 28,
            }}
          >
            Payment cancelled. Your slot has not been reserved. Select a service to try again.
          </div>
        )}

        {SERVICE_GROUPS.map((group, gi) => (
          <div key={group.heading} style={{ marginBottom: 36, marginTop: gi === 0 ? 0 : 24 }}>
            <h2
              className="section-label"
              style={{ marginBottom: 12 }}
            >
              <span className="num">{String(gi + 1).padStart(2, "0")}</span> {group.heading}
            </h2>
            <div style={{ display: "grid", gap: 0, borderTop: "1px solid var(--rule)" }}>
              {group.options.map((opt) => (
                <button
                  key={opt.slug}
                  onClick={() => {
                    setService(opt.slug);
                    setSelectedSlot(null);
                    setStep(NO_SLOT_SERVICES.includes(opt.slug) ? "details" : "slot");
                  }}
                  className="service-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    alignItems: "center",
                    gap: 20,
                    padding: "22px 8px 22px 0",
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid var(--rule)",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    minHeight: 88,
                    transition: "background 0.15s ease",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 6, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 18, fontWeight: 500, color: "var(--ink)" }}>
                        {opt.label}
                      </div>
                      {opt.tag && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--red)",
                            textTransform: "uppercase",
                            letterSpacing: "0.6px",
                            padding: "3px 7px",
                            border: "1px solid var(--red)",
                            borderRadius: 100,
                            lineHeight: 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {opt.tag}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, maxWidth: 420 }}>
                      {opt.subtitle ?? SERVICES[opt.slug].description}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-instrument-serif), Georgia, serif",
                      fontSize: 28,
                      color: "var(--ink)",
                      letterSpacing: "-0.5px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {opt.price}
                  </div>
                  <span
                    aria-hidden="true"
                    className="service-arrow"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 40,
                      height: 40,
                      borderRadius: 100,
                      border: "1px solid var(--rule-strong)",
                      color: "var(--ink)",
                      fontSize: 16,
                      transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                      flexShrink: 0,
                    }}
                  >
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* ── Car Hire — single row with dropdown ────────────────────────── */}
        <div style={{ marginBottom: 36, marginTop: 24 }}>
          <h2 className="section-label" style={{ marginBottom: 12 }}>
            <span className="num">{String(SERVICE_GROUPS.length + 1).padStart(2, "0")}</span>{" "}
            Car hire for your test
          </h2>
          <div style={{ borderTop: "1px solid var(--rule)" }}>
            <div
              className="service-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                alignItems: "center",
                gap: 20,
                padding: "22px 8px 22px 0",
                borderBottom: "1px solid var(--rule)",
                minHeight: 88,
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 500, color: "var(--ink)", marginBottom: 8 }}>
                  Car Hire for Test
                </div>
                <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 12, maxWidth: 420 }}>
                  Choose your option:
                </div>
                <select
                  value={carHireSlug}
                  onChange={(e) => setCarHireSlug(e.target.value as ServiceSlug)}
                  style={{
                    appearance: "none",
                    WebkitAppearance: "none",
                    background:
                      "white url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' stroke='%230A0A0A' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\") no-repeat right 16px center",
                    border: "1px solid var(--rule-strong)",
                    borderRadius: 8,
                    padding: "12px 44px 12px 16px",
                    fontSize: 15,
                    color: "var(--ink)",
                    cursor: "pointer",
                    minWidth: 260,
                    fontFamily: "inherit",
                  }}
                  aria-label="Pick a car-hire option"
                >
                  {CAR_HIRE_OPTIONS.map((o) => (
                    <option key={o.slug} value={o.slug}>
                      {o.label} — {o.price}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-instrument-serif), Georgia, serif",
                  fontSize: 28,
                  color: "var(--ink)",
                  letterSpacing: "-0.5px",
                  whiteSpace: "nowrap",
                }}
              >
                {CAR_HIRE_OPTIONS.find((o) => o.slug === carHireSlug)?.price}
              </div>
              <button
                onClick={() => {
                  setService(carHireSlug);
                  setSelectedSlot(null);
                  setStep("slot");
                }}
                aria-label="Continue with this car-hire option"
                className="service-arrow"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  border: "1px solid var(--rule-strong)",
                  background: "white",
                  color: "var(--ink)",
                  fontSize: 16,
                  cursor: "pointer",
                  transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                  flexShrink: 0,
                }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Slot selection ──────────────────────────────────────────────────────────
  if (step === "slot" && service && serviceConfig) {
    return (
      <div style={{ padding: "48px 22px 64px", maxWidth: 640, margin: "0 auto" }}>
        <StepIndicator current="slot" />
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => { setStep("service"); setSelectedSlot(null); }}
            style={{ fontSize: 13, color: "var(--ink-2)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            ← Back
          </button>
          <h1
            style={{
              fontFamily: "var(--font-instrument-serif), Georgia, serif",
              fontWeight: 400,
              fontSize: 28,
              letterSpacing: "-0.5px",
              color: "var(--ink)",
            }}
          >
            {serviceConfig.label}
          </h1>
          <span
            style={{
              fontFamily: "var(--font-instrument-serif), Georgia, serif",
              fontSize: 22,
              color: "var(--ink-2)",
              letterSpacing: "-0.5px",
            }}
          >
            {formatPrice(serviceConfig.pricePence)}
          </span>
        </div>

        <div
          style={{
            border: "1px solid var(--rule)",
            borderRadius: 8,
            padding: 24,
            background: "white",
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)", marginBottom: 16 }}>
            Select an available date and time:
          </p>
          <BookingCalendar
            serviceType={service}
            onSlotSelected={(slot) => setSelectedSlot(slot)}
          />
        </div>

        {selectedSlot && (
          <div
            style={{
              marginTop: 16,
              border: "1px solid var(--rule)",
              borderRadius: 8,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>
                Selected slot
              </p>
              <p style={{ fontSize: 13, color: "var(--ink-2)" }}>
                {selectedSlot.date} · {selectedSlot.start_time.slice(0, 5)}–{selectedSlot.end_time.slice(0, 5)}
              </p>
            </div>
            <button
              onClick={() => setStep("details")}
              className="btn-primary"
              style={{ padding: "10px 20px", fontSize: 14, whiteSpace: "nowrap" }}
            >
              Continue →
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
      <div style={{ padding: "48px 22px 64px", maxWidth: 520, margin: "0 auto" }}>
        <StepIndicator current="details" />
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => setStep(isBundle ? "service" : "slot")}
            style={{ fontSize: 13, color: "var(--ink-2)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            ← Back
          </button>
          <h1
            style={{
              fontFamily: "var(--font-instrument-serif), Georgia, serif",
              fontWeight: 400,
              fontSize: 28,
              letterSpacing: "-0.5px",
              color: "var(--ink)",
            }}
          >
            Your details
          </h1>
        </div>

        {/* Booking summary */}
        <div
          style={{
            borderTop: "1px solid var(--rule)",
            borderBottom: "1px solid var(--rule)",
            padding: "16px 0",
            marginBottom: 28,
            display: "flex",
            flexDirection: "column" as const,
            gap: 6,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: "var(--ink-2)" }}>Service</span>
            <span style={{ color: "var(--ink)", fontWeight: 500 }}>{serviceConfig.label}</span>
          </div>
          {selectedSlot && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "var(--ink-2)" }}>Slot</span>
              <span style={{ color: "var(--ink)", fontWeight: 500 }}>
                {selectedSlot.date} · {selectedSlot.start_time.slice(0, 5)}–{selectedSlot.end_time.slice(0, 5)}
              </span>
            </div>
          )}
          {isBundle && (
            <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>
              You&apos;ll receive a personal booking link by email to schedule your individual sessions.
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, marginTop: 4 }}>
            <span style={{ color: "var(--ink-2)" }}>Total</span>
            <span
              style={{
                fontFamily: "var(--font-instrument-serif), Georgia, serif",
                fontSize: 22,
                color: "var(--ink)",
                letterSpacing: "-0.5px",
              }}
            >
              {formatPrice(serviceConfig.pricePence)}
            </span>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); void handleCheckout(); }}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>
              Full Name <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              placeholder="Your full name"
              onFocus={(e) => { e.target.style.border = "1px solid var(--ink)"; }}
              onBlur={(e)  => { e.target.style.border = "1px solid var(--rule-strong)"; }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>
              Email Address <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="you@example.com"
              onFocus={(e) => { e.target.style.border = "1px solid var(--ink)"; }}
              onBlur={(e)  => { e.target.style.border = "1px solid var(--rule-strong)"; }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>
              Phone Number <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
              placeholder="+353 86 123 4567"
              onFocus={(e) => { e.target.style.border = "1px solid var(--ink)"; }}
              onBlur={(e)  => { e.target.style.border = "1px solid var(--rule-strong)"; }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>
              Pickup area <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <select
              required
              value={area}
              onChange={(e) => setArea(e.target.value)}
              style={{
                ...inputStyle,
                appearance: "none",
                WebkitAppearance: "none",
                background:
                  "white url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' stroke='%230A0A0A' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\") no-repeat right 14px center",
                paddingRight: 44,
                cursor: "pointer",
              }}
            >
              <option value="" disabled>Pick your Dublin postcode</option>
              {COVERED_AREAS.map((a) => (
                <option key={a} value={a}>Dublin {a.slice(1)}</option>
              ))}
              <option value="other">Other area (I&apos;ll contact you first)</option>
            </select>
            {area === "other" && (
              <p style={{ fontSize: 12, color: "var(--red)", marginTop: 8, lineHeight: 1.5 }}>
                We mainly cover D2, D4, D6, D6W, D8, D12, and D14.{" "}
                <Link href="/contact" style={{ color: "var(--red)", textDecoration: "underline" }}>
                  Contact us
                </Link>{" "}
                to confirm coverage before paying.
              </p>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>
              Notes <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...inputStyle, resize: "vertical" }}
              placeholder="Anything the instructor should know…"
              onFocus={(e) => { e.target.style.border = "1px solid var(--ink)"; }}
              onBlur={(e)  => { e.target.style.border = "1px solid var(--rule-strong)"; }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 14, color: "var(--red)" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || area === "other" || !area}
            className="btn-primary"
            style={{ width: "100%", padding: "16px 22px", fontSize: 16 }}
          >
            {submitting
              ? "Redirecting to payment…"
              : area === "other"
              ? "Contact us before paying"
              : `Pay ${formatPrice(serviceConfig.pricePence)} securely`}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: "var(--ink-3)" }}>
            Powered by Stripe · Card, Apple Pay &amp; Google Pay accepted
          </p>
        </form>
      </div>
    );
  }

  // ── Redirecting ─────────────────────────────────────────────────────────────
  if (step === "redirecting") {
    return (
      <div style={{ padding: "96px 22px", textAlign: "center", maxWidth: 400, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "var(--font-instrument-serif), Georgia, serif",
            fontSize: 24,
            fontWeight: 400,
            color: "var(--ink)",
            marginBottom: 8,
          }}
        >
          Redirecting to payment…
        </p>
        <p style={{ fontSize: 14, color: "var(--ink-2)" }}>Please don&apos;t close this tab.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "96px 22px", textAlign: "center" }}>
      <p style={{ fontSize: 15, color: "var(--ink-2)" }}>
        Something went wrong.{" "}
        <Link href="/book" style={{ color: "var(--red)" }}>
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
        <div style={{ padding: "96px 22px", textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--ink-2)" }}>Loading…</p>
        </div>
      }
    >
      <BookPageInner />
    </Suspense>
  );
}
