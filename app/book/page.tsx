"use client";
// app/book/page.tsx
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BookingCalendar, { type Slot } from "@/components/BookingCalendar";
import { SERVICES, type ServiceSlug, formatPrice } from "@/lib/pricing";

const SERVICE_OPTIONS: { slug: ServiceSlug; label: string; price: string }[] = [
  { slug: "standard",    label: "Standard Lesson",        price: "€80" },
  { slug: "pre-test",    label: "Pre-Test Lesson",         price: "€100" },
  { slug: "refresher",   label: "Refresher Lesson",        price: "€80" },
  { slug: "edt-6",       label: "6 EDT Lessons",           price: "€455" },
  { slug: "edt-bundle",  label: "EDT Bundle (12 lessons)", price: "€905" },
  { slug: "car-hire",    label: "Car Hire for Test",       price: "from €150" },
];

const NO_SLOT_SERVICES: ServiceSlug[] = ["edt-bundle", "edt-6"];

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
      const res  = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id:         selectedSlot?.id ?? undefined,
          service_type:    service,
          customer_name:   name.trim(),
          customer_email:  email.trim().toLowerCase(),
          customer_phone:  phone.trim(),
          notes:           notes.trim() || undefined,
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
      <div style={{ padding: "48px 22px 64px", maxWidth: 640, margin: "0 auto" }}>
        <StepIndicator current="service" />
        <h1
          style={{
            fontFamily: "var(--font-instrument-serif), Georgia, serif",
            fontWeight: 400,
            fontSize: 36,
            lineHeight: 1.05,
            letterSpacing: "-0.8px",
            color: "var(--ink)",
            marginBottom: 8,
          }}
        >
          Book a <em style={{ fontStyle: "italic" }}>lesson.</em>
        </h1>
        <p style={{ fontSize: 15, color: "var(--ink-2)", marginBottom: 32 }}>
          Choose your lesson type to get started.
        </p>

        {cancelled && (
          <div
            style={{
              borderRadius: 6,
              border: "1px solid #fde68a",
              background: "#fffbeb",
              padding: "12px 16px",
              fontSize: 14,
              color: "#92400e",
              marginBottom: 24,
            }}
          >
            Payment cancelled — your slot has not been reserved. Select a service to try again.
          </div>
        )}

        <div style={{ display: "grid", gap: 1, borderTop: "1px solid var(--rule)" }}>
          {SERVICE_OPTIONS.map((opt) => (
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
                gap: 16,
                padding: "20px 8px 20px 0",
                background: "none",
                border: "none",
                borderBottom: "1px solid var(--rule)",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "padding 0.15s ease",
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
                  {SERVICES[opt.slug].description}
                </div>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-instrument-serif), Georgia, serif",
                  fontSize: 24,
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
                  width: 32,
                  height: 32,
                  borderRadius: 100,
                  border: "1px solid var(--rule-strong)",
                  color: "var(--ink)",
                  fontSize: 14,
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
            disabled={submitting}
            className="btn-primary"
            style={{ width: "100%", padding: "16px 22px", fontSize: 16 }}
          >
            {submitting
              ? "Redirecting to payment…"
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
