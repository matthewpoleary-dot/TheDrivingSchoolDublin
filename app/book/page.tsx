"use client";

import { useEffect, useMemo, useState } from "react";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
};

type ToastState = { msg: string; tone: "success" | "error" } | null;

export default function BookPage() {
  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Slots
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  // Client details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // UI
  const [toast, setToast] = useState<ToastState>(null);

  // Load services on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/services");
        const rows = await res.json();
        const list: Service[] = Array.isArray(rows) ? rows : rows.services ?? [];
        setServices(list);
        if (list.length) setServiceId(list[0].id);
      } catch (e) {
        setToast({ msg: "Failed to load services", tone: "error" });
        setTimeout(() => setToast(null), 2200);
      }
    })();
  }, []);

  async function loadSlots() {
    if (!serviceId || !date) {
      setToast({ msg: "Pick a service and date first.", tone: "error" });
      setTimeout(() => setToast(null), 2000);
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot("");
    setSlots([]);
    try {
      const url = `/api/slots?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(
        date
      )}`;
      const res = await fetch(url);
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setToast({ msg: "Failed to load slots", tone: "error" });
      setTimeout(() => setToast(null), 2000);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function book() {
    // Front-end guard so we don’t send a bad request
    if (!serviceId || !selectedSlot || !name || !email) {
      setToast({ msg: "Please pick a time and fill your name & email.", tone: "error" });
      setTimeout(() => setToast(null), 2200);
      return;
    }

    const payload = {
      serviceId,
      startsAt: selectedSlot, // ISO string
      client: { name, email, phone },
    };

    console.log("BOOK PAYLOAD →", payload);

    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    console.log("BOOK RESPONSE →", res.status, data);

    if (!res.ok) {
      setToast({ msg: data.error || "Booking failed", tone: "error" });
      setTimeout(() => setToast(null), 2400);
      return;
    }

    setToast({ msg: "Booked! Check your email for confirmation.", tone: "success" });
    setTimeout(() => setToast(null), 2600);

    // Reset only the time selection; keep service/date
    setSelectedSlot("");
  }

  const prettySlots = useMemo(
    () =>
      slots.map((iso) => {
        const d = new Date(iso);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return { iso, label: `${hh}:${mm}` };
      }),
    [slots]
  );

  const selectedService = services.find((s) => s.id === serviceId);

  return (
    <div className="mx-auto max-w-4xl grid gap-8 lg:grid-cols-3">
      {/* Left: main card */}
      <div className="lg:col-span-2 rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Book a Lesson</h1>
          <p className="mt-1 text-sm text-gray-700">
            Pick a service, choose a date & time, add your details, and confirm.
          </p>
        </div>

        <div className="p-5 grid gap-6">
          {/* Step 1 */}
          <section>
            <h2 className="font-semibold mb-3 text-gray-900">1. Choose your service & date</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-gray-900">
                <span>Service</span>
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (€{(s.price_cents / 100).toFixed(2)})
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-900">
                <span>Date</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
            </div>

            <button
              onClick={loadSlots}
              className="mt-3 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              disabled={loadingSlots}
            >
              {loadingSlots ? "Loading…" : "Show times"}
            </button>
          </section>

          {/* Step 2 */}
          <section>
            <h2 className="font-semibold mb-3 text-gray-900">2. Pick a time</h2>
            {prettySlots.length === 0 && !loadingSlots && (
              <p className="text-sm text-gray-700">
                No times yet — choose a weekday within 09:00–17:00 and click “Show times”.
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {prettySlots.map((s) => (
                <button
                  key={s.iso}
                  onClick={() => setSelectedSlot(s.iso)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 transition text-gray-900 ${
                    selectedSlot === s.iso ? "ring-2 ring-indigo-600 border-indigo-600" : ""
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          {/* Step 3 */}
          <section>
            <h2 className="font-semibold mb-3 text-gray-900">3. Your details</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="rounded-lg border px-3 py-2 text-gray-900"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="rounded-lg border px-3 py-2 text-gray-900"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="rounded-lg border px-3 py-2 text-gray-900"
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </section>

          {/* Step 4 */}
          <section className="flex items-center justify-between">
            <div className="text-sm text-gray-900">
              {selectedService ? (
                <>
                  You’re booking <strong>{selectedService.name}</strong>. Total:{" "}
                  <strong>€{(selectedService.price_cents / 100).toFixed(2)}</strong>
                </>
              ) : (
                "Select a service."
              )}
            </div>
            <button
              onClick={book}
              className="inline-flex items-center rounded-lg bg-black px-5 py-3 text-white font-semibold hover:bg-gray-900 transition"
            >
              Confirm booking
            </button>
          </section>
        </div>
      </div>

      {/* Right: summary */}
      <aside className="rounded-2xl border bg-white p-5 shadow-sm h-fit">
        <h3 className="font-semibold mb-3 text-gray-900">Booking Summary</h3>
        <ul className="space-y-2 text-sm text-gray-900">
          <li>
            <span className="text-gray-700">Service:</span> {selectedService?.name ?? "—"}
          </li>
          <li>
            <span className="text-gray-700">Duration:</span>{" "}
            {selectedService?.duration_minutes ?? "—"} minutes
          </li>
          <li>
            <span className="text-gray-700">Price:</span>{" "}
            {selectedService ? `€${(selectedService.price_cents / 100).toFixed(2)}` : "—"}
          </li>
          <li>
            <span className="text-gray-700">Date & time:</span>{" "}
            {selectedSlot ? new Date(selectedSlot).toLocaleString() : date}
          </li>
        </ul>
        <p className="mt-4 text-xs text-gray-500">
          By confirming, you agree to our cancellation policy.
        </p>
      </aside>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 text-white rounded-md shadow ${
            toast.tone === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
