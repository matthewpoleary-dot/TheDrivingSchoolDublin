"use client";
// app/book/page.tsx — complete rewrite with real booking + Stripe Checkout
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BookingCalendar, { type Slot } from "@/components/BookingCalendar";
import { SERVICES, type ServiceSlug, formatPrice } from "@/lib/pricing";

const SERVICE_OPTIONS: { slug: ServiceSlug; label: string; price: string }[] = [
  { slug: "standard",    label: "Standard Lesson",         price: "€80" },
  { slug: "pre-test",    label: "Pre-Test Lesson",          price: "€100" },
  { slug: "refresher",   label: "Refresher Lesson",         price: "€80" },
  { slug: "edt-6",       label: "6 EDT Lessons",            price: "€455" },
  { slug: "edt-bundle",  label: "EDT Bundle (12 lessons)",  price: "€905" },
  { slug: "car-hire",    label: "Car Hire for Test",        price: "from €150" },
];

// EDT bundle and edt-6 don't need a slot — payment first, then they get a booking link
const NO_SLOT_SERVICES: ServiceSlug[] = ["edt-bundle", "edt-6"];

type Step = "service" | "slot" | "details" | "redirecting";

function BookPageInner() {
  const searchParams = useSearchParams();
  const preselect = searchParams.get("service") as ServiceSlug | null;
  const cancelled = searchParams.get("cancelled") === "1";

  const [step, setStep] = useState<Step>(preselect ? "slot" : "service");
  const [service, setService] = useState<ServiceSlug | null>(preselect);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // If service doesn't need a slot, skip straight to details after service selection
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
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id: selectedSlot?.id ?? undefined,
          service_type: service,
          customer_name: name.trim(),
          customer_email: email.trim().toLowerCase(),
          customer_phone: phone.trim(),
          notes: notes.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Failed to create checkout session");
      }

      setStep("redirecting");
      window.location.href = data.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  // ─── Step: Service selection ─────────────────────────────────────────────
  if (step === "service") {
    return (
      <section className="mx-auto max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Book a Lesson</h1>
          <p className="text-gray-600">Choose your lesson type to get started.</p>
        </div>

        {cancelled && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Payment cancelled — your slot has not been reserved. Select a service to try again.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {SERVICE_OPTIONS.map((opt) => (
            <button
              key={opt.slug}
              onClick={() => {
                setService(opt.slug);
                setSelectedSlot(null);
                setStep(NO_SLOT_SERVICES.includes(opt.slug) ? "details" : "slot");
              }}
              className="flex flex-col items-start rounded-2xl border bg-white p-5 shadow-sm hover:border-red-400 hover:shadow-md transition text-left"
            >
              <span className="font-semibold text-gray-900">{opt.label}</span>
              <span className="mt-1 text-2xl font-extrabold text-red-600">{opt.price}</span>
              <span className="mt-2 text-xs text-gray-500">{SERVICES[opt.slug].description}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  // ─── Step: Slot selection ────────────────────────────────────────────────
  if (step === "slot" && service && serviceConfig) {
    return (
      <section className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setStep("service"); setSelectedSlot(null); }}
            className="text-sm text-gray-500 hover:text-gray-800">← Back</button>
          <h1 className="text-2xl font-extrabold tracking-tight">{serviceConfig.label}</h1>
          <span className="text-xl font-bold text-red-600">{formatPrice(serviceConfig.pricePence)}</span>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-4">Select an available date and time:</p>
          <BookingCalendar
            serviceType={service}
            onSlotSelected={(slot) => {
              setSelectedSlot(slot);
            }}
          />
        </div>

        {selectedSlot && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-800">Selected slot</p>
              <p className="text-sm text-green-700">
                {selectedSlot.date} · {selectedSlot.start_time.slice(0, 5)}–{selectedSlot.end_time.slice(0, 5)}
              </p>
            </div>
            <button
              onClick={() => setStep("details")}
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition"
            >
              Continue →
            </button>
          </div>
        )}
      </section>
    );
  }

  // ─── Step: Customer details ──────────────────────────────────────────────
  if (step === "details" && service && serviceConfig) {
    const isBundle = NO_SLOT_SERVICES.includes(service);
    return (
      <section className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep(isBundle ? "service" : "slot")}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight">Your details</h1>
        </div>

        {/* Booking summary */}
        <div className="rounded-2xl border bg-gray-50 p-4 text-sm space-y-1">
          <p><span className="font-medium">Service:</span> {serviceConfig.label}</p>
          {selectedSlot && (
            <p>
              <span className="font-medium">Slot:</span>{" "}
              {selectedSlot.date} · {selectedSlot.start_time.slice(0, 5)}–{selectedSlot.end_time.slice(0, 5)}
            </p>
          )}
          {isBundle && (
            <p className="text-gray-600">
              You&apos;ll receive a personal booking link by email to schedule your individual sessions.
            </p>
          )}
          <p className="font-semibold text-red-600 text-base">{formatPrice(serviceConfig.pricePence)}</p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); void handleCheckout(); }}
          className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm"
        >
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Email Address <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Phone Number <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              placeholder="+353 86 123 4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Notes (optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              placeholder="Anything the instructor should know…"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Redirecting to payment…" : `Pay ${formatPrice(serviceConfig.pricePence)} securely`}
          </button>

          <p className="text-center text-xs text-gray-400">
            Powered by Stripe · Card, Apple Pay & Google Pay accepted
          </p>
        </form>
      </section>
    );
  }

  // ─── Step: Redirecting ───────────────────────────────────────────────────
  if (step === "redirecting") {
    return (
      <div className="mx-auto max-w-sm text-center space-y-4 py-16">
        <div className="text-4xl">⏳</div>
        <p className="text-lg font-semibold">Redirecting to secure payment…</p>
        <p className="text-sm text-gray-500">Please don&apos;t close this tab.</p>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <p className="text-gray-500">Something went wrong. <Link href="/book" className="text-red-600 underline">Start over</Link></p>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    }>
      <BookPageInner />
    </Suspense>
  );
}
