// app/book/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  active?: boolean;
};

function euros(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

/** Normalize services:
 * - exclude "Motorway"
 * - dedupe "Standard Lesson" to just one (prefer 60 min if duplicates)
 * - keep only active (if your data uses active=false to hide)
 */
function normalizeServices(list: Service[]): Service[] {
  const filtered = list.filter(
    (s) => s.active !== false && s.name.trim().toLowerCase() !== "motorway"
  );

  const byName = new Map<string, Service>();

  for (const s of filtered) {
    // Remove things in parentheses from name for matching
    const baseName = s.name.trim().replace(/\(.*?\)/g, "").trim().toLowerCase();

    if (baseName === "standard lesson") {
      const existing = byName.get(baseName);
      if (!existing) {
        byName.set(baseName, s);
      } else {
        // Prefer the "1 hour" variant if available
        const pick =
          /1\s*hour/i.test(s.name) ||
          (existing && !/1\s*hour/i.test(existing.name) && s.duration_minutes === 60)
            ? s
            : existing;
        byName.set(baseName, pick);
      }
    } else {
      if (!byName.has(baseName)) byName.set(baseName, s);
    }
  }

  return Array.from(byName.values());
}


/** Build the dropdown label:
 * - Standard Lesson: show "(60 min)"
 * - Others: no duration text
 */
function serviceLabel(s: Service) {
  const isStandard = s.name.trim().toLowerCase() === "standard lesson";
  const namePart = isStandard ? `Standard Lesson (60 min)` : s.name;
  return `${namePart} (${euros(s.price_cents)})`;
}

export default function BookPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<string>("");
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [toast, setToast] = useState<string>("");

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );

  // Load and normalize services
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/services");
      const raw = await res.json();
      const list = Array.isArray(raw) ? raw : [];
      const normalized = normalizeServices(list);
      setServices(normalized);
      if (normalized.length && !serviceId) setServiceId(normalized[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showTimes = async () => {
    if (!serviceId || !date) return;
    setSelectedSlot("");
    const u = new URL("/api/slots", window.location.origin);
    u.searchParams.set("serviceId", serviceId);
    u.searchParams.set("date", date);
    const res = await fetch(u.toString());
    const data = await res.json();
    setSlots(Array.isArray(data.slots) ? data.slots : []);
  };

  const confirmBooking = async () => {
    if (!serviceId || !selectedSlot) {
      setToast("Please pick a service and time");
      setTimeout(() => setToast(""), 2000);
      return;
    }
    if (!clientName || !clientEmail) {
      setToast("Please enter your name and email");
      setTimeout(() => setToast(""), 2000);
      return;
    }

    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        startsAt: selectedSlot,
        client: { name: clientName, email: clientEmail, phone: clientPhone || null },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setToast(data.error || "Something went wrong");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    setToast("Booking confirmed! Check your email.");
    setTimeout(() => setToast(""), 3000);
    await showTimes(); // refresh to remove the chosen slot
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <h1 className="text-2xl font-semibold mb-2">Book a Lesson</h1>
        <p className="text-sm text-gray-600 mb-6">
          Pick a service, choose a date & time, add your details, and confirm.
        </p>

        {/* 1. Choose service & date */}
        <div className="mb-6 space-y-2">
          <label className="block text-sm font-medium">Service</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {serviceLabel(s)}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium mt-4">Date</label>
          <input
            type="date"
            className="w-full rounded border px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <button
            onClick={showTimes}
            className="mt-3 inline-flex items-center rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            Show times
          </button>
        </div>

        {/* 2. Pick a time */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-2">Pick a time</h2>
          {!slots.length && (
            <p className="text-sm text-gray-500">
              No times yet — choose a weekday within 09:00–17:00 and click “Show times”.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {slots.map((iso) => {
              const d = new Date(iso);
              const label = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              return (
                <button
                  key={iso}
                  onClick={() => setSelectedSlot(iso)}
                  className={`rounded border px-3 py-2 text-sm ${
                    selectedSlot === iso ? "bg-black text-white" : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Your details */}
        <div className="mb-6 space-y-3">
          <h2 className="text-sm font-semibold">Your details</h2>
          <input
            placeholder="Full name"
            className="w-full rounded border px-3 py-2"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
          <input
            placeholder="Email address"
            className="w-full rounded border px-3 py-2"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
          />
          <input
            placeholder="Phone (optional)"
            className="w-full rounded border px-3 py-2"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
          />
        </div>

        {selectedService && (
          <p className="text-sm text-gray-700 mb-4">
            You’re booking <strong>{selectedService.name}</strong>. Total:{" "}
            <strong>{euros(selectedService.price_cents)}</strong>.
          </p>
        )}

        <button
          onClick={confirmBooking}
          className="rounded bg-black px-5 py-2 text-white hover:bg-gray-800"
        >
          Confirm booking
        </button>

        {toast && <p className="mt-3 text-sm text-indigo-700">{toast}</p>}
      </div>

      {/* Summary card */}
      <aside className="md:col-span-1">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-2">Booking Summary</h3>
          <p className="text-sm text-gray-700">
            {selectedService ? `Service: ${selectedService.name}` : "Pick a service"}
          </p>
          <p className="text-sm text-gray-700">Date: {date || "-"}</p>
          <p className="text-sm text-gray-700">
            Time:{" "}
            {selectedSlot
              ? new Date(selectedSlot).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
          </p>
        </div>
      </aside>
    </div>
  );
}
