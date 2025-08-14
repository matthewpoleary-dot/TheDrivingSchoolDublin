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

// Prefer “Standard Lesson (1 hour)” and hide motorway/duplicates in UI
function normaliseServices(list: Service[]): Service[] {
  // remove motorway entirely
  let filtered = list.filter(
    (s) => !s.name.toLowerCase().includes("motorway")
  );

  // if two “Standard Lesson” variants exist, keep the “1 hour” version
  const stds = filtered.filter((s) =>
    s.name.toLowerCase().includes("standard lesson")
  );
  if (stds.length > 1) {
    const keep = stds.find((s) => s.name.toLowerCase().includes("1 hour"));
    if (keep) {
      filtered = filtered.filter((s) => {
        const isStd = s.name.toLowerCase().includes("standard lesson");
        return !isStd || s.id === keep.id;
      });
    }
  }

  return filtered;
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

  // Load services (and preselect via ?serviceId=... if present)
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/services");
      const data: Service[] = (await res.json()) || [];
      const cleaned = normaliseServices(data);

      setServices(cleaned);

      // Try preselect from query string
      const u = new URL(window.location.href);
      const qsId = u.searchParams.get("serviceId");

      if (qsId && cleaned.find((s) => s.id === qsId)) {
        setServiceId(qsId);
      } else if (cleaned.length && !serviceId) {
        setServiceId(cleaned[0].id);
      }
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
      setTimeout(() => setToast(""), 2200);
      return;
    }
    if (!clientName || !clientEmail) {
      setToast("Please enter your name and email");
      setTimeout(() => setToast(""), 2200);
      return;
    }

    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        startsAt: selectedSlot,
        client: {
          name: clientName,
          email: clientEmail,
          phone: clientPhone || null,
        },
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
    await showTimes(); // remove the chosen slot
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left: form */}
      <div className="md:col-span-2">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Book a Lesson
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Pick a service, choose a date & time, add your details, and confirm.
        </p>

        {/* Card wrapper in white with subtle border to keep theme consistent */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          {/* 1. Service & date */}
          <div className="mb-6">
            <label className="block text-sm font-medium">Service</label>
            <select
              className="mt-1 w-full rounded border px-3 py-2"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              {services.map((s) => {
                // Build clean label: hide minutes except mention 1 hour for standard
                let label = s.name;
                if (/standard lesson/i.test(s.name) && !/1 hour/i.test(s.name)) {
                  label = "Standard Lesson (1 hour)";
                }
                return (
                  <option key={s.id} value={s.id}>
                    {label} — {euros(s.price_cents)}
                  </option>
                );
              })}
            </select>

            <label className="block text-sm font-medium mt-4">Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded border px-3 py-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <button
              onClick={showTimes}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mt-3"
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
                const label = d.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const active = selectedSlot === iso;
                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedSlot(iso)}
                    className={`rounded border px-3 py-2 text-sm transition ${
                      active
                        ? "bg-black text-white border-black"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Details */}
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
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Confirm booking
          </button>

          {toast && (
            <p className="mt-3 text-sm text-red-700 font-medium">{toast}</p>
          )}
        </div>
      </div>

      {/* Right: summary card */}
      <aside className="md:col-span-1">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
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
