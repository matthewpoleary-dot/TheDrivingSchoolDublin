"use client";
// app/admin/page.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { format, addWeeks, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentStatus = "pending" | "paid" | "refunded" | "cancelled" | "failed";

type Booking = {
  id: string;
  slot_id: string | null;
  service_type: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_status: PaymentStatus;
  amount_pence: number;
  created_at: string;
  notes: string | null;
  // joined from availability_slots via admin API
  slot?: { date: string; start_time: string; end_time: string } | null;
};

type SlotBooking = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_type: string;
  payment_status: string;
  amount_pence: number;
  notes: string | null;
};

type AvailabilitySlot = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  lesson_types: string[];
  is_booked: boolean;
  booking?: SlotBooking | null;
};

type EdtPackage = {
  id: string;
  customer_name: string;
  customer_email: string;
  lessons_total: number;
  lessons_used: number;
  expires_at: string;
};

type Tab = "bookings" | "availability" | "edt";

const ALL_SERVICE_TYPES = ["standard", "pre-test", "refresher", "edt-6", "edt-bundle", "car-hire"];

function getErrMsg(e: unknown): string {
  return e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [inputToken, setInputToken] = useState("");
  const [tab, setTab] = useState<Tab>("bookings");
  const [toast, setToast] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const isAuthed = token.trim().length > 0;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }
  function showError(msg: string) {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  }

  function authHeader() {
    return { Authorization: `Bearer ${token}` };
  }

  // ─── Bookings tab ────────────────────────────────────────────────────────

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingDateFilter, setBookingDateFilter] = useState("");

  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch("/api/admin/bookings", { headers: authHeader() });
      const data = await res.json() as Booking[];
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      showError(getErrMsg(e));
    } finally {
      setLoadingBookings(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredBookings = useMemo(() => {
    if (!bookingDateFilter) return bookings;
    return bookings.filter((b) => b.slot?.date === bookingDateFilter);
  }, [bookings, bookingDateFilter]);

  // ─── Availability tab ────────────────────────────────────────────────────

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  // Single slot form
  const [slotDate, setSlotDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("10:00");
  const [slotDuration, setSlotDuration] = useState(60);
  const [slotTypes, setSlotTypes] = useState<string[]>(["standard"]);
  const [addingSlot, setAddingSlot] = useState(false);

  // Auto-fill schedule form
  const [afStartDate, setAfStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [afEndDate, setAfEndDate] = useState(format(addWeeks(new Date(), 4), "yyyy-MM-dd"));
  const [afDuration, setAfDuration] = useState(60);
  const [afTravel, setAfTravel] = useState(30);
  const [afTypes, setAfTypes] = useState<string[]>(ALL_SERVICE_TYPES);
  const [afDays, setAfDays] = useState([
    { dow: 1, label: "Mon", enabled: true,  start: "07:00", end: "21:00" },
    { dow: 2, label: "Tue", enabled: true,  start: "07:00", end: "21:00" },
    { dow: 3, label: "Wed", enabled: true,  start: "07:00", end: "21:00" },
    { dow: 4, label: "Thu", enabled: true,  start: "07:00", end: "21:00" },
    { dow: 5, label: "Fri", enabled: true,  start: "07:00", end: "16:00" },
    { dow: 6, label: "Sat", enabled: false, start: "07:00", end: "14:00" },
    { dow: 0, label: "Sun", enabled: false, start: "07:00", end: "14:00" },
  ]);
  const [addingAf, setAddingAf] = useState(false);

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const start = format(addDays(weekStart, -7), "yyyy-MM-dd");
      const end = format(addDays(weekEnd, 7), "yyyy-MM-dd");
      const res = await fetch(`/api/admin/slots?start=${start}&end=${end}`, { headers: authHeader() });
      if (!res.ok) throw new Error("Failed to load slots");
      const data = await res.json() as AvailabilitySlot[];
      setSlots(Array.isArray(data) ? data : []);
    } catch (e) {
      showError(getErrMsg(e));
    } finally {
      setLoadingSlots(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, weekOffset]);

  async function addSingleSlot() {
    if (!slotDate || !slotStart || !slotEnd || !slotTypes.length) return;
    setAddingSlot(true);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "single",
          date: slotDate,
          start_time: slotStart,
          end_time: slotEnd,
          duration_minutes: slotDuration,
          lesson_types: slotTypes,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      showToast("Slot added");
      await loadSlots();
    } catch (e) {
      showError(getErrMsg(e));
    } finally {
      setAddingSlot(false);
    }
  }

  async function addAutoFillSlots() {
    const enabledDays = afDays.filter((d) => d.enabled);
    if (!afStartDate || !afEndDate || !enabledDays.length || !afTypes.length) return;
    setAddingAf(true);
    try {
      // Build schedule: group days with same start/end together
      const schedule = enabledDays.map((d) => ({
        weekdays: [d.dow],
        day_start: d.start,
        day_end: d.end,
      }));
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "auto-fill",
          start_date: afStartDate,
          end_date: afEndDate,
          schedule,
          duration_minutes: afDuration,
          travel_time_minutes: afTravel,
          lesson_types: afTypes,
        }),
      });
      const data = await res.json() as { created?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      showToast(`Created ${data.created ?? 0} slots`);
      await loadSlots();
    } catch (e) {
      showError(getErrMsg(e));
    } finally {
      setAddingAf(false);
    }
  }

  async function deleteSlot(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/availability/${id}`, { method: "DELETE", headers: authHeader() });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      showToast("Slot removed");
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      showError(getErrMsg(e));
    } finally {
      setDeletingId(null);
    }
  }

  // ─── EDT Packages tab ────────────────────────────────────────────────────

  const [edtPackages, setEdtPackages] = useState<EdtPackage[]>([]);
  const [loadingEdt, setLoadingEdt] = useState(false);

  const loadEdtPackages = useCallback(async () => {
    setLoadingEdt(true);
    try {
      const res = await fetch("/api/admin/edt-packages", { headers: authHeader() });
      const data = await res.json() as EdtPackage[];
      setEdtPackages(Array.isArray(data) ? data : []);
    } catch (e) {
      showError(getErrMsg(e));
    } finally {
      setLoadingEdt(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Load data when tab changes
  useEffect(() => {
    if (!isAuthed) return;
    if (tab === "bookings") void loadBookings();
    if (tab === "availability") void loadSlots();
    if (tab === "edt") void loadEdtPackages();
  }, [tab, isAuthed, loadBookings, loadSlots, loadEdtPackages]);

  // ─── Login screen ─────────────────────────────────────────────────────────

  if (!isAuthed) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Admin</h1>
        <input
          className="w-full rounded border px-3 py-2 mb-3"
          placeholder="Admin token"
          type="password"
          value={inputToken}
          onChange={(e) => setInputToken(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && inputToken.trim()) setToken(inputToken.trim()); }}
        />
        <button
          onClick={() => { if (inputToken.trim()) setToken(inputToken.trim()); }}
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          Continue
        </button>
      </div>
    );
  }

  // ─── Tab bar ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <button
          onClick={() => { setToken(""); setInputToken(""); }}
          className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>

      {toast && <p className="rounded bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">{toast}</p>}
      {errorMsg && <p className="rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">{errorMsg}</p>}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["bookings", "availability", "edt"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-4 py-2 text-sm border capitalize ${
              tab === t ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"
            }`}
          >
            {t === "edt" ? "EDT Packages" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── BOOKINGS TAB ──────────────────────────────────────────────────── */}
      {tab === "bookings" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={loadBookings} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
              Refresh
            </button>
            <input
              type="date"
              value={bookingDateFilter}
              onChange={(e) => setBookingDateFilter(e.target.value)}
              className="rounded border px-3 py-1.5 text-sm"
            />
            {bookingDateFilter && (
              <button onClick={() => setBookingDateFilter("")} className="text-sm text-gray-500 underline">
                Clear filter
              </button>
            )}
          </div>

          {loadingBookings && <p className="text-sm text-gray-500">Loading…</p>}

          {!loadingBookings && !filteredBookings.length && (
            <p className="text-sm text-gray-500">No bookings found.</p>
          )}

          {filteredBookings.length > 0 && (
            <div className="overflow-x-auto rounded border bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Date/Slot</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Service</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => {
                    const badge: Record<PaymentStatus, string> = {
                      paid: "bg-green-100 text-green-700",
                      pending: "bg-yellow-100 text-yellow-700",
                      failed: "bg-red-100 text-red-700",
                      cancelled: "bg-gray-100 text-gray-600",
                      refunded: "bg-blue-100 text-blue-700",
                    };
                    return (
                      <tr key={b.id} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap">
                          {b.slot ? (
                            <>
                              <div>{b.slot.date}</div>
                              <div className="text-gray-500 text-xs">
                                {b.slot.start_time.slice(0, 5)}–{b.slot.end_time.slice(0, 5)}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">No slot (bundle)</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div>{b.customer_name}</div>
                          <div className="text-gray-500 text-xs">{b.customer_email}</div>
                          {b.customer_phone && <div className="text-gray-500 text-xs">{b.customer_phone}</div>}
                        </td>
                        <td className="px-3 py-2 capitalize">{b.service_type}</td>
                        <td className="px-3 py-2 whitespace-nowrap">€{(b.amount_pence / 100).toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge[b.payment_status] ?? ""}`}>
                            {b.payment_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── AVAILABILITY TAB ──────────────────────────────────────────────── */}
      {tab === "availability" && (
        <div className="space-y-6">
          {/* Week view */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                ← Prev week
              </button>
              <span className="text-sm font-medium">
                {format(weekStart, "d MMM")} – {format(weekEnd, "d MMM yyyy")}
              </span>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Next week →
              </button>
              <button onClick={loadSlots} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
                Refresh
              </button>
            </div>

            {loadingSlots && <p className="text-sm text-gray-500">Loading…</p>}

            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const daySlots = slots.filter((s) => s.date === dateKey);
                return (
                  <div key={dateKey} className="min-h-24">
                    <div className="text-xs font-medium text-gray-500 mb-1 text-center">
                      {format(day, "EEE")}<br />{format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {daySlots.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => s.is_booked && setSelectedSlot(s)}
                          className={`rounded p-1 text-xs relative group ${
                            s.is_booked
                              ? "bg-red-100 text-red-700 cursor-pointer hover:bg-red-200"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          <div>{s.start_time.slice(0, 5)}</div>
                          <div className="opacity-70">{s.duration_minutes}m</div>
                          {s.is_booked && s.booking && (
                            <div className="text-red-600 truncate max-w-full text-[10px] leading-tight">
                              {s.booking.customer_name.split(" ")[0]}
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); void deleteSlot(s.id); }}
                            disabled={deletingId === s.id}
                            className="absolute top-0.5 right-0.5 hidden group-hover:block text-red-500 hover:text-red-700 text-xs font-bold leading-none"
                            title={s.is_booked ? "Cancel booking & delete slot" : "Delete slot"}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {!daySlots.length && <div className="text-xs text-gray-300 text-center">—</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-green-100" /> Open</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-100" /> Booked</span>
            </div>
          </div>

          {/* Add single slot */}
          <details className="rounded-2xl border bg-white p-5">
            <summary className="font-semibold cursor-pointer text-sm">Add a single slot</summary>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Date</label>
                <input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)}
                  className="w-full rounded border px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Start</label>
                <input type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)}
                  className="w-full rounded border px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">End</label>
                <input type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)}
                  className="w-full rounded border px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Duration (min)</label>
                <input type="number" value={slotDuration} onChange={(e) => setSlotDuration(Number(e.target.value))}
                  className="w-full rounded border px-2 py-1.5 text-sm" min={30} max={480} />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs text-gray-500 block mb-1">Lesson types</label>
              <div className="flex flex-wrap gap-2">
                {ALL_SERVICE_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={slotTypes.includes(t)}
                      onChange={(e) => setSlotTypes(e.target.checked ? [...slotTypes, t] : slotTypes.filter((x) => x !== t))}
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={addSingleSlot}
              disabled={addingSlot}
              className="mt-4 rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {addingSlot ? "Adding…" : "Add slot"}
            </button>
          </details>

          {/* Auto-fill schedule */}
          <details className="rounded-2xl border bg-white p-5" open>
            <summary className="font-semibold cursor-pointer text-sm">Auto-fill schedule</summary>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Generates all available slots across a date range. Delete individual slots to block time off.
            </p>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">From date</label>
                <input type="date" value={afStartDate} onChange={(e) => setAfStartDate(e.target.value)}
                  className="w-full rounded border px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">To date</label>
                <input type="date" value={afEndDate} onChange={(e) => setAfEndDate(e.target.value)}
                  className="w-full rounded border px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Lesson duration</label>
                <select value={afDuration} onChange={(e) => setAfDuration(Number(e.target.value))}
                  className="w-full rounded border px-2 py-1.5 text-sm">
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                  <option value={120}>120 min</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Travel buffer</label>
                <select value={afTravel} onChange={(e) => setAfTravel(Number(e.target.value))}
                  className="w-full rounded border px-2 py-1.5 text-sm">
                  <option value={0}>None</option>
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                </select>
              </div>
            </div>

            {/* Per-day schedule */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-2">Days &amp; hours</label>
              <div className="space-y-2">
                {afDays.map((day, idx) => (
                  <div key={day.dow} className="flex items-center gap-3">
                    <label className="flex items-center gap-2 w-16 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={day.enabled}
                        onChange={(e) => {
                          const updated = [...afDays];
                          updated[idx] = { ...updated[idx], enabled: e.target.checked };
                          setAfDays(updated);
                        }}
                      />
                      {day.label}
                    </label>
                    {day.enabled && (
                      <>
                        <input type="time" value={day.start}
                          onChange={(e) => {
                            const updated = [...afDays];
                            updated[idx] = { ...updated[idx], start: e.target.value };
                            setAfDays(updated);
                          }}
                          className="rounded border px-2 py-1 text-sm w-28" />
                        <span className="text-xs text-gray-400">to</span>
                        <input type="time" value={day.end}
                          onChange={(e) => {
                            const updated = [...afDays];
                            updated[idx] = { ...updated[idx], end: e.target.value };
                            setAfDays(updated);
                          }}
                          className="rounded border px-2 py-1 text-sm w-28" />
                        <span className="text-xs text-gray-400">
                          (~{Math.floor((
                            (parseInt(day.end.split(":")[0]) * 60 + parseInt(day.end.split(":")[1])) -
                            (parseInt(day.start.split(":")[0]) * 60 + parseInt(day.start.split(":")[1]))
                          ) / (afDuration + afTravel))} slots)
                        </span>
                      </>
                    )}
                    {!day.enabled && <span className="text-xs text-gray-300">off</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Lesson types */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-1">Lesson types</label>
              <div className="flex flex-wrap gap-2">
                {ALL_SERVICE_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={afTypes.includes(t)}
                      onChange={(e) => setAfTypes(e.target.checked ? [...afTypes, t] : afTypes.filter((x) => x !== t))}
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={addAutoFillSlots}
              disabled={addingAf}
              className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {addingAf ? "Generating…" : "Generate slots"}
            </button>
          </details>
        </div>
      )}

      {/* ── BOOKING DETAIL MODAL ─────────────────────────────────────────── */}
      {selectedSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSelectedSlot(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="font-semibold text-lg">Booking details</h2>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">{selectedSlot.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium">
                  {selectedSlot.start_time.slice(0, 5)} – {selectedSlot.end_time.slice(0, 5)}
                  <span className="text-gray-400 ml-1">({selectedSlot.duration_minutes}min)</span>
                </span>
              </div>
              {selectedSlot.booking ? (
                <>
                  <div className="border-t pt-2 mt-2" />
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer</span>
                    <span className="font-medium">{selectedSlot.booking.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <a href={`tel:${selectedSlot.booking.customer_phone}`} className="font-medium text-red-600 hover:underline">
                      {selectedSlot.booking.customer_phone}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <a href={`mailto:${selectedSlot.booking.customer_email}`} className="font-medium text-red-600 hover:underline truncate max-w-[180px]">
                      {selectedSlot.booking.customer_email}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service</span>
                    <span className="font-medium capitalize">{selectedSlot.booking.service_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-medium">€{(selectedSlot.booking.amount_pence / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-medium capitalize ${selectedSlot.booking.payment_status === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                      {selectedSlot.booking.payment_status}
                    </span>
                  </div>
                  {selectedSlot.booking.notes && (
                    <div className="border-t pt-2">
                      <p className="text-gray-500 text-xs mb-1">Notes</p>
                      <p className="text-sm">{selectedSlot.booking.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-400 text-sm">No booking details available.</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedSlot(null)}
                className="flex-1 rounded border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  await deleteSlot(selectedSlot.id);
                  setSelectedSlot(null);
                }}
                disabled={deletingId === selectedSlot.id}
                className="flex-1 rounded bg-red-600 text-white px-3 py-2 text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === selectedSlot.id ? "Cancelling…" : "Cancel booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDT PACKAGES TAB ──────────────────────────────────────────────── */}
      {tab === "edt" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={loadEdtPackages} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
              Refresh
            </button>
          </div>

          {loadingEdt && <p className="text-sm text-gray-500">Loading…</p>}
          {!loadingEdt && !edtPackages.length && (
            <p className="text-sm text-gray-500">No EDT packages yet.</p>
          )}

          {edtPackages.length > 0 && (
            <div className="overflow-x-auto rounded border bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Progress</th>
                    <th className="px-3 py-2">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {edtPackages.map((p) => {
                    const pct = Math.round((p.lessons_used / p.lessons_total) * 100);
                    return (
                      <tr key={p.id} className="border-t">
                        <td className="px-3 py-2">
                          <div>{p.customer_name}</div>
                          <div className="text-gray-500 text-xs">{p.customer_email}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 rounded-full bg-gray-200 overflow-hidden">
                              <div className="h-2 bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span>{p.lessons_used}/{p.lessons_total}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">{p.expires_at}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
