"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateQuote,
  formatEuro,
  SERVICE_CATALOG,
  SERVICES,
} from "@/lib/booking/catalog";
import type {
  AvailableSlot,
  BookingDetails,
  BookingDraft,
  BookingStep,
  PaymentChoice,
  ServiceCode,
} from "@/lib/booking/types";
import PaymentForm from "@/components/booking/PaymentForm";

const EMPTY_DETAILS: BookingDetails = {
  name: "",
  email: "",
  phone: "",
  pickupAddress: "",
  eircode: "",
  carChoice: "manual_instructor",
  paymentChoice: "full",
  consent: false,
};

const INITIAL_DRAFT: BookingDraft = {
  serviceCode: null,
  slotStart: null,
  details: EMPTY_DETAILS,
};

const STEP_LABELS = ["Service", "Time", "Details & payment"] as const;

function dateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Dublin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function displayDate(date: Date) {
  return {
    weekday: new Intl.DateTimeFormat("en-IE", {
      weekday: "short",
      timeZone: "Europe/Dublin",
    }).format(date),
    day: new Intl.DateTimeFormat("en-IE", {
      day: "2-digit",
      timeZone: "Europe/Dublin",
    }).format(date),
    month: new Intl.DateTimeFormat("en-IE", {
      month: "short",
      timeZone: "Europe/Dublin",
    }).format(date),
  };
}

function displayTime(iso: string) {
  return new Intl.DateTimeFormat("en-IE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Dublin",
  }).format(new Date(iso));
}

function longDate(iso: string) {
  return new Intl.DateTimeFormat("en-IE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Dublin",
  }).format(new Date(iso));
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none">
      <path d="m4 10 4 4 8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none">
      <path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Progress({ step }: { step: BookingStep }) {
  return (
    <ol aria-label="Booking progress" className="grid grid-cols-3 border-b border-gray-200 bg-gray-50/70 px-4 sm:px-8">
      {STEP_LABELS.map((label, index) => {
        const number = (index + 1) as BookingStep;
        const active = number === step;
        const complete = number < step;
        return (
          <li key={label} aria-current={active ? "step" : undefined} className={`relative flex items-center gap-2 py-5 text-xs font-bold uppercase tracking-[0.14em] sm:text-sm ${active ? "text-gray-950" : complete ? "text-red-600" : "text-gray-400"}`}>
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] ${active ? "bg-gray-950 text-white" : complete ? "bg-red-600 text-white" : "border border-gray-300 bg-white"}`}>
              {complete ? <CheckIcon /> : number}
            </span>
            <span className="hidden sm:inline">{label}</span>
            {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-red-600" />}
          </li>
        );
      })}
    </ol>
  );
}

export default function BookingWizard() {
  const [step, setStep] = useState<BookingStep>(1);
  const [draft, setDraft] = useState<BookingDraft>(INITIAL_DRAFT);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotMode, setSlotMode] = useState<"live" | "preview" | "setup_required">("live");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<{
    clientSecret: string;
    bookingIntentId: string;
  } | null>(null);
  const [error, setError] = useState("");

  const dates = useMemo(() => {
    const result: Date[] = [];
    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);

    while (result.length < 7) {
      cursor.setDate(cursor.getDate() + 1);
      if (cursor.getDay() !== 0) result.push(new Date(cursor));
    }
    return result;
  }, []);

  useEffect(() => {
    if (!selectedDate && dates[0]) setSelectedDate(dateKey(dates[0]));
  }, [dates, selectedDate]);

  useEffect(() => {
    if (step !== 2 || !draft.serviceCode || !selectedDate) return;

    const controller = new AbortController();
    async function loadSlots() {
      setLoadingSlots(true);
      setError("");
      setDraft((current) => ({ ...current, slotStart: null }));
      try {
        const params = new URLSearchParams({
          service: draft.serviceCode!,
          date: selectedDate,
        });
        const response = await fetch(`/api/booking/slots?${params}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Could not load times");
        setSlots(payload.slots ?? []);
        setSlotMode(payload.mode ?? "live");
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") {
          setSlots([]);
          setError((requestError as Error).message);
        }
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
    return () => controller.abort();
  }, [draft.serviceCode, selectedDate, step]);

  const selectedService = draft.serviceCode
    ? SERVICE_CATALOG[draft.serviceCode]
    : null;
  const quote = selectedService
    ? calculateQuote(selectedService, draft.details.paymentChoice)
    : null;

  function selectService(serviceCode: ServiceCode) {
    setDraft((current) => ({ ...current, serviceCode, slotStart: null }));
    setError("");
  }

  function updateDetails<K extends keyof BookingDetails>(
    key: K,
    value: BookingDetails[K],
  ) {
    setDraft((current) => ({
      ...current,
      details: { ...current.details, [key]: value },
    }));
  }

  function continueFromService() {
    if (!draft.serviceCode) {
      setError("Choose a lesson before continuing.");
      return;
    }
    setError("");
    setStep(2);
  }

  function continueFromTime() {
    if (!draft.slotStart) {
      setError("Choose an available time before continuing.");
      return;
    }
    setError("");
    setStep(3);
  }

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.serviceCode || !draft.slotStart) return;

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/booking/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceCode: draft.serviceCode,
          slotStart: draft.slotStart,
          ...draft.details,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not prepare payment");

      if (!payload.clientSecret || !payload.bookingIntentId) {
        throw new Error("Secure checkout could not be started.");
      }
      setPayment({
        clientSecret: payload.clientSecret,
        bookingIntentId: payload.bookingIntentId,
      });
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-[0_28px_80px_-38px_rgba(17,24,39,0.35)]">
      <Progress step={step} />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 p-5 sm:p-8 lg:p-10">
          {step === 1 && (
            <div>
              <div className="mb-7">
                <p className="text-sm font-semibold text-red-600">Step 1 of 3</p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.03em] text-gray-950">Choose your lesson</h2>
                <p className="mt-2 text-gray-600">Every booking includes a 30-minute travel buffer, so your instructor arrives prepared and on time.</p>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                {SERVICES.map((service) => {
                  const selected = service.code === draft.serviceCode;
                  return (
                    <button
                      key={service.code}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectService(service.code)}
                      className={`group relative flex min-h-72 flex-col rounded-2xl border p-5 text-left transition duration-200 ${selected ? "border-gray-950 bg-gray-950 text-white shadow-xl" : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-lg"}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-[0.18em] ${selected ? "text-red-300" : "text-red-600"}`}>{service.eyebrow}</span>
                      <h3 className="mt-4 text-xl font-black tracking-tight">{service.name}</h3>
                      <p className={`mt-3 text-sm leading-6 ${selected ? "text-gray-300" : "text-gray-600"}`}>{service.description}</p>
                      <ul className={`mt-5 space-y-2 text-sm ${selected ? "text-gray-200" : "text-gray-700"}`}>
                        {service.highlights.map((item) => (
                          <li key={item} className="flex items-center gap-2"><span className={selected ? "text-red-300" : "text-red-600"}><CheckIcon /></span>{item}</li>
                        ))}
                      </ul>
                      <div className="mt-auto flex items-end justify-between border-t border-current/15 pt-5">
                        <div><span className="text-3xl font-black">{formatEuro(service.priceCents)}</span><span className={`ml-1 text-xs ${selected ? "text-gray-400" : "text-gray-500"}`}>total</span></div>
                        <span className={`grid h-8 w-8 place-items-center rounded-full ${selected ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 group-hover:bg-red-50 group-hover:text-red-600"}`}>{selected ? <CheckIcon /> : <ArrowIcon />}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <WizardActions error={error} onContinue={continueFromService} />
            </div>
          )}

          {step === 2 && selectedService && (
            <div>
              <div className="mb-7">
                <p className="text-sm font-semibold text-red-600">Step 2 of 3</p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.03em] text-gray-950">Find a time that suits</h2>
                <p className="mt-2 text-gray-600">Times are shown in Dublin time and update against the instructor&apos;s calendar.</p>
              </div>

              {slotMode === "preview" && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Preview times are shown while the live calendar connection is being configured.
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {dates.map((date) => {
                  const parts = displayDate(date);
                  const key = dateKey(date);
                  const selected = key === selectedDate;
                  return (
                    <button key={key} type="button" onClick={() => setSelectedDate(key)} className={`rounded-xl border px-2 py-3 text-center transition ${selected ? "border-gray-950 bg-gray-950 text-white shadow-md" : "border-gray-200 hover:border-gray-400"}`}>
                      <span className={`block text-[10px] font-bold uppercase tracking-wider ${selected ? "text-red-300" : "text-gray-500"}`}>{parts.weekday}</span>
                      <span className="mt-1 block text-2xl font-black">{parts.day}</span>
                      <span className={`block text-xs ${selected ? "text-gray-300" : "text-gray-500"}`}>{parts.month}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-7 min-h-44 rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-gray-950">Available times</h3>
                  <span className="text-xs text-gray-500">Europe/Dublin</span>
                </div>
                {loadingSlots ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-11 animate-pulse rounded-lg bg-gray-200" />)}
                  </div>
                ) : slots.length ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((slot) => {
                      const selected = draft.slotStart === slot.start;
                      return (
                        <button key={slot.start} type="button" aria-pressed={selected} onClick={() => setDraft((current) => ({ ...current, slotStart: slot.start }))} className={`rounded-lg border px-3 py-3 text-sm font-bold transition ${selected ? "border-red-600 bg-red-600 text-white shadow-md" : "border-gray-200 bg-white text-gray-800 hover:border-red-300 hover:text-red-600"}`}>
                          {displayTime(slot.start)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-lg bg-white p-5 text-center text-sm text-gray-600">No bookable times are available on this date. Try another day.</p>
                )}
              </div>

              <WizardActions error={error} back={() => setStep(1)} onContinue={continueFromTime} />
            </div>
          )}

          {step === 3 && selectedService && draft.slotStart && quote && (payment ? (
            <PaymentForm
              clientSecret={payment.clientSecret}
              bookingIntentId={payment.bookingIntentId}
              amountCents={quote.payableNowCents}
              onBack={() => setPayment(null)}
            />
          ) : (
            <form onSubmit={submitBooking}>
              <div className="mb-7">
                <p className="text-sm font-semibold text-red-600">Step 3 of 3</p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.03em] text-gray-950">Your details</h2>
                <p className="mt-2 text-gray-600">Add the pickup point and choose how you would like to pay.</p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" required><input required autoComplete="name" value={draft.details.name} onChange={(e) => updateDetails("name", e.target.value)} className="booking-input" /></Field>
                <Field label="Mobile number" required><input required type="tel" autoComplete="tel" placeholder="+353 86 123 4567" value={draft.details.phone} onChange={(e) => updateDetails("phone", e.target.value)} className="booking-input" /></Field>
                <Field label="Email address" required className="sm:col-span-2"><input required type="email" autoComplete="email" value={draft.details.email} onChange={(e) => updateDetails("email", e.target.value)} className="booking-input" /></Field>
                <Field label="South Dublin pickup address" required className="sm:col-span-2" hint="Include the house number, street and area."><input required autoComplete="street-address" placeholder="e.g. 14 Main Street, Dundrum, Dublin 14" value={draft.details.pickupAddress} onChange={(e) => updateDetails("pickupAddress", e.target.value)} className="booking-input" /></Field>
                <Field label="Eircode" hint="Optional, but helps us find you quickly."><input autoComplete="postal-code" placeholder="D14 XXXX" value={draft.details.eircode} onChange={(e) => updateDetails("eircode", e.target.value.toUpperCase())} className="booking-input uppercase" /></Field>
                <Field label="Lesson car" required hint="Automatic lessons use your own insured car."><select required value={draft.details.carChoice} onChange={(e) => updateDetails("carChoice", e.target.value as BookingDetails["carChoice"])} className="booking-input"><option value="manual_instructor">Manual — instructor&apos;s car</option><option value="automatic_student">Automatic — your own car</option></select></Field>
              </div>

              <fieldset className="mt-8">
                <legend className="text-sm font-bold text-gray-950">Payment choice</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <PaymentOption choice="full" selected={draft.details.paymentChoice === "full"} title={`Pay ${formatEuro(quote.totalCents)} now`} detail="Nothing left to pay on the day." onSelect={(choice) => updateDetails("paymentChoice", choice)} />
                  <PaymentOption choice="deposit_cash" selected={draft.details.paymentChoice === "deposit_cash"} title={`Pay ${formatEuro(calculateQuote(selectedService, "deposit_cash").payableNowCents)} deposit`} detail={`${formatEuro(calculateQuote(selectedService, "deposit_cash").outstandingCashCents)} cash on the day.`} onSelect={(choice) => updateDetails("paymentChoice", choice)} />
                </div>
              </fieldset>

              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                <input required type="checkbox" checked={draft.details.consent} onChange={(e) => updateDetails("consent", e.target.checked)} className="mt-1 h-4 w-4 accent-red-600" />
                <span>I agree to be contacted about this booking and understand that deposits are non-refundable once the lesson is confirmed.</span>
              </label>

              <WizardActions error={error} back={() => setStep(2)} submit submitting={submitting} onContinue={() => undefined} />
            </form>
          ))}
        </div>

        <aside className="border-t border-gray-200 bg-gray-950 p-6 text-white lg:border-l lg:border-t-0 lg:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">Booking summary</p>
          {selectedService ? (
            <div className="mt-6">
              <h3 className="text-2xl font-black tracking-tight">{selectedService.name}</h3>
              <div className="mt-5 space-y-4 border-y border-white/10 py-5 text-sm">
                <SummaryRow label="Lesson" value={`${selectedService.durationMinutes} min`} />
                <SummaryRow label="Travel buffer" value={`${selectedService.bufferAfterMinutes} min`} />
                {draft.slotStart && <SummaryRow label="Time" value={longDate(draft.slotStart)} stacked />}
                <SummaryRow label="Total" value={formatEuro(selectedService.priceCents)} strong />
              </div>
              {quote && step === 3 && (
                <div className="mt-5 rounded-xl bg-white/8 p-4">
                  <SummaryRow label="Pay now" value={formatEuro(quote.payableNowCents)} strong />
                  {quote.outstandingCashCents > 0 && <p className="mt-2 text-xs leading-5 text-gray-400">{formatEuro(quote.outstandingCashCents)} will be due in cash on the day.</p>}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-6 text-sm leading-6 text-gray-400">Your lesson, time and payment choice will appear here as you book.</p>
          )}
          <div className="mt-10 border-t border-white/10 pt-6 text-xs leading-5 text-gray-400">
            <p className="font-bold text-gray-200">Need help?</p>
            <a href="tel:+353860235666" className="mt-1 inline-block text-red-300 hover:text-red-200">+353 86 0235 666</a>
          </div>
        </aside>
      </div>
    </div>
  );
}

function WizardActions({ error, back, onContinue, submit = false, submitting = false }: { error: string; back?: () => void; onContinue: () => void; submit?: boolean; submitting?: boolean }) {
  return (
    <div className="mt-8">
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <div className="flex items-center justify-between gap-4">
        {back ? <button type="button" onClick={back} className="rounded-lg px-2 py-3 text-sm font-bold text-gray-600 hover:text-gray-950">← Back</button> : <span />}
        <button type={submit ? "submit" : "button"} onClick={submit ? undefined : onContinue} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? "Preparing checkout…" : submit ? "Continue to secure payment" : "Continue"}
          {!submitting && <ArrowIcon />}
        </button>
      </div>
    </div>
  );
}

function Field({ label, required = false, hint, className = "", children }: { label: string; required?: boolean; hint?: string; className?: string; children: React.ReactNode }) {
  return <label className={className}><span className="mb-1.5 block text-sm font-bold text-gray-900">{label}{required && <span className="text-red-600"> *</span>}</span>{children}{hint && <span className="mt-1.5 block text-xs text-gray-500">{hint}</span>}</label>;
}

function PaymentOption({ choice, selected, title, detail, onSelect }: { choice: PaymentChoice; selected: boolean; title: string; detail: string; onSelect: (choice: PaymentChoice) => void }) {
  return <label className={`cursor-pointer rounded-xl border p-4 transition ${selected ? "border-gray-950 bg-gray-950 text-white shadow-lg" : "border-gray-200 hover:border-gray-400"}`}><input type="radio" name="paymentChoice" value={choice} checked={selected} onChange={() => onSelect(choice)} className="sr-only" /><span className="flex items-start justify-between gap-3"><span><span className="block text-sm font-bold">{title}</span><span className={`mt-1 block text-xs leading-5 ${selected ? "text-gray-300" : "text-gray-500"}`}>{detail}</span></span><span className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full border ${selected ? "border-red-400 bg-red-600 text-white" : "border-gray-300"}`}>{selected && <CheckIcon />}</span></span></label>;
}

function SummaryRow({ label, value, strong = false, stacked = false }: { label: string; value: string; strong?: boolean; stacked?: boolean }) {
  return <div className={stacked ? "space-y-1" : "flex items-start justify-between gap-4"}><span className="text-gray-400">{label}</span><span className={`${strong ? "text-lg font-black text-white" : "font-semibold text-gray-100"} ${stacked ? "block max-w-full" : "max-w-[180px] text-right"}`}>{value}</span></div>;
}
