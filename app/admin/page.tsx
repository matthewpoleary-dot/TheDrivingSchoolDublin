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
  source?: "regular" | "edt";
  edt_session_number?: number;
  edt_package_total?: number;
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

type EdtSession = {
  id: string;
  status: "scheduled" | "completed" | "cancelled";
  lesson_number: number | null;
  created_at: string;
  slot: { date: string; start_time: string; end_time: string } | null;
};

type Tab = "calendar" | "add-availability" | "bookings" | "edt";

const ALL_SERVICE_TYPES = ["standard", "pre-test", "refresher", "edt-6", "edt-bundle", "car-hire"];

function getErrMsg(e: unknown): string {
  return e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [inputToken, setInputToken] = useState("");
  const [tab, setTab] = useState<Tab>("calendar");
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
  const [expandedPkgId, setExpandedPkgId] = useState<string | null>(null);
  const [pkgSessions, setPkgSessions] = useState<Record<string, EdtSession[]>>({});
  const [loadingPkgSessions, setLoadingPkgSessions] = useState<string | null>(null);

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

  const togglePackage = useCallback(async (id: string) => {
    if (expandedPkgId === id) {
      setExpandedPkgId(null);
      return;
    }
    setExpandedPkgId(id);
    if (!pkgSessions[id]) {
      setLoadingPkgSessions(id);
      try {
        const res = await fetch(`/api/admin/edt-packages/${id}/sessions`, { headers: authHeader() });
        if (!res.ok) throw new Error("Failed to load sessions");
        const data = await res.json() as EdtSession[];
        setPkgSessions((prev) => ({ ...prev, [id]: Array.isArray(data) ? data : [] }));
      } catch (e) {
        showError(getErrMsg(e));
      } finally {
        setLoadingPkgSessions(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedPkgId, pkgSessions, token]);

  // Load data when tab changes
  useEffect(() => {
    if (!isAuthed) return;
    if (tab === "bookings") void loadBookings();
    if (tab === "calendar") void loadSlots();
    if (tab === "add-availability") void loadSlots();
    if (tab === "edt") void loadEdtPackages();
  }, [tab, isAuthed, loadBookings, loadSlots, loadEdtPackages]);

  // ─── Login screen ─────────────────────────────────────────────────────────

  if (!isAuthed) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-slate-100 p-8 space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900">Welcome back, Conor</h1>
            <p className="text-sm text-slate-500">Enter your admin password to manage bookings and your schedule.</p>
          </div>
          <input
            className="w-full rounded-xl bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            placeholder="Admin password"
            type="password"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && inputToken.trim()) setToken(inputToken.trim()); }}
          />
          <button
            onClick={() => { if (inputToken.trim()) setToken(inputToken.trim()); }}
            className="w-full rounded-xl bg-[#d90429] hover:bg-[#b00322] px-4 py-3 text-base font-semibold text-white transition shadow-sm"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  // ─── Tab bar ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Your dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage bookings, set your availability, and track EDT packages.</p>
        </div>
        <button
          onClick={() => { setToken(""); setInputToken(""); }}
          className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition"
        >
          Sign out
        </button>
      </div>

      {/* Status messages */}
      {toast && (
        <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <span className="text-lg">✓</span> {toast}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-800 flex items-center gap-2">
          <span className="text-lg">!</span> {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap bg-slate-100 p-1.5 rounded-2xl w-fit">
        {([
          { key: "calendar",         label: "📅 My calendar" },
          { key: "add-availability", label: "➕ Add availability" },
          { key: "bookings",         label: "📋 Bookings list" },
          { key: "edt",              label: "🎓 EDT packages" },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              tab === t.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BOOKINGS TAB ──────────────────────────────────────────────────── */}
      {tab === "bookings" && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-5 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-semibold text-slate-900">Customer bookings</p>
              <p className="text-xs text-slate-500">Everyone who has booked a lesson, newest first.</p>
            </div>
            <button onClick={loadBookings} className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition">
              ↻ Refresh
            </button>
            <input
              type="date"
              value={bookingDateFilter}
              onChange={(e) => setBookingDateFilter(e.target.value)}
              className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            />
            {bookingDateFilter && (
              <button onClick={() => setBookingDateFilter("")} className="text-sm font-medium text-slate-500 hover:text-slate-900 underline">
                Clear date
              </button>
            )}
          </div>

          {loadingBookings && <p className="text-sm text-slate-500">Loading…</p>}

          {!loadingBookings && !filteredBookings.length && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-10 text-center">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-base font-semibold text-slate-900">No bookings yet</p>
              <p className="text-sm text-slate-500 mt-1">When customers book lessons they&apos;ll show up here.</p>
            </div>
          )}

          {filteredBookings.length > 0 && (
            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date / Time</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Service</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => {
                    const badge: Record<PaymentStatus, string> = {
                      paid:      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
                      pending:   "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
                      failed:    "bg-red-50 text-red-700 ring-1 ring-red-200",
                      cancelled: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
                      refunded:  "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
                    };
                    return (
                      <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {b.slot ? (
                            <>
                              <div className="font-medium text-slate-900">{b.slot.date}</div>
                              <div className="text-slate-500 text-xs">
                                {b.slot.start_time.slice(0, 5)}–{b.slot.end_time.slice(0, 5)}
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Package purchase</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{b.customer_name}</div>
                          <div className="text-slate-500 text-xs">{b.customer_email}</div>
                          {b.customer_phone && <div className="text-slate-500 text-xs">{b.customer_phone}</div>}
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-700">{b.service_type}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-900">€{(b.amount_pence / 100).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badge[b.payment_status] ?? ""}`}>
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

      {/* ── CALENDAR TAB ──────────────────────────────────────────────────── */}
      {tab === "calendar" && (
        <div className="space-y-6">
          {/* Quick-help banner */}
          <div className="bg-gradient-to-br from-red-50 via-white to-emerald-50 ring-1 ring-slate-100 rounded-2xl p-5">
            <p className="font-bold text-slate-900">Your week at a glance</p>
            <p className="text-sm text-slate-600 mt-1">
              <span className="font-semibold text-red-700">Red</span> slots are confirmed lessons — tap one to see the customer&apos;s details.
              <span className="font-semibold text-emerald-700"> Green</span> slots are open for customers to book.
              To add more open slots, switch to the <span className="font-semibold">Add availability</span> tab.
            </p>
          </div>

          {/* Week view */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWeekOffset((w) => w - 1)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 w-9 h-9 text-slate-700 font-bold transition"
                  title="Previous week"
                >
                  ←
                </button>
                <span className="text-base font-bold text-slate-900 px-2 min-w-[180px] text-center">
                  {format(weekStart, "d MMM")} – {format(weekEnd, "d MMM yyyy")}
                </span>
                <button
                  onClick={() => setWeekOffset((w) => w + 1)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 w-9 h-9 text-slate-700 font-bold transition"
                  title="Next week"
                >
                  →
                </button>
                {weekOffset !== 0 && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="ml-2 text-sm font-medium text-red-600 hover:text-red-700 underline"
                  >
                    Today
                  </button>
                )}
              </div>
              <button onClick={loadSlots} className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition">
                ↻ Refresh
              </button>
            </div>

            {loadingSlots && <p className="text-sm text-slate-500">Loading…</p>}

            <div className="grid grid-cols-7 gap-3">
              {weekDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const todayKey = format(new Date(), "yyyy-MM-dd");
                const isToday = dateKey === todayKey;
                const isPast = dateKey < todayKey;
                const daySlots = slots.filter((s) => s.date === dateKey);
                const bookedCount = daySlots.filter((s) => s.is_booked).length;
                return (
                  <div key={dateKey} className={isPast ? "opacity-40" : ""}>
                    {/* Day header */}
                    <div className="text-center pb-3 mb-3 border-b border-slate-100">
                      <div className={`text-[11px] font-semibold uppercase tracking-wider ${
                        isToday ? "text-red-600" : isPast ? "text-slate-400" : "text-slate-400"
                      }`}>
                        {format(day, "EEE")}
                      </div>
                      <div className={`text-2xl font-bold mt-0.5 ${
                        isToday ? "text-red-600" : isPast ? "text-slate-400" : "text-slate-900"
                      }`}>
                        {format(day, "d")}
                      </div>
                      {bookedCount > 0 && !isPast && (
                        <div className="text-[10px] font-semibold text-red-600 mt-1">
                          {bookedCount} booked
                        </div>
                      )}
                    </div>

                    {/* Slot list */}
                    <div className="space-y-1">
                      {daySlots.map((s) => {
                        const hasCustomer = s.is_booked && s.booking?.customer_name;
                        return (
                          <div
                            key={s.id}
                            onClick={() => s.is_booked && setSelectedSlot(s)}
                            className={`rounded-md px-2 py-1.5 relative group transition ${
                              s.is_booked
                                ? "bg-red-50 text-red-800 cursor-pointer hover:bg-red-100 border border-red-200"
                                : "text-slate-600 hover:bg-slate-50 border border-transparent"
                            }`}
                          >
                            <div className={`text-sm ${s.is_booked ? "font-semibold" : "font-medium"}`}>
                              {s.start_time.slice(0, 5)}
                            </div>
                            {hasCustomer && (
                              <div className="text-[11px] text-red-700 font-medium truncate mt-0.5">
                                {s.booking!.customer_name!.split(" ")[0]}
                              </div>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); void deleteSlot(s.id); }}
                              disabled={deletingId === s.id}
                              className="absolute top-0.5 right-0.5 hidden group-hover:flex items-center justify-center w-4 h-4 rounded-full bg-white text-slate-400 hover:text-red-600 text-xs font-bold leading-none border border-slate-200"
                              title={s.is_booked ? "Cancel booking & delete slot" : "Delete slot"}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                      {!daySlots.length && (
                        <div className="text-[11px] text-slate-300 text-center py-3">
                          No slots
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-5 text-xs text-slate-500 pt-4 border-t border-slate-100 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded bg-red-50 border border-red-200" />
                Booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded border border-slate-200" />
                Open
              </span>
              <span className="hidden sm:inline text-slate-400">
                · Hover a slot to reveal × delete · Tap a booked slot to see the customer
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD AVAILABILITY TAB ──────────────────────────────────────────── */}
      {tab === "add-availability" && (
        <div className="space-y-6">
          {/* Quick-help banner */}
          <div className="bg-emerald-50 ring-1 ring-emerald-100 rounded-2xl p-5">
            <p className="font-bold text-slate-900">Add open slots for customers to book</p>
            <p className="text-sm text-slate-600 mt-1">
              Use <span className="font-semibold">Fill my schedule automatically</span> for the easiest setup — pick a date range and your usual hours,
              and we&apos;ll create every slot in one go. Use <span className="font-semibold">Add one slot manually</span> for one-off appointments.
            </p>
          </div>

          {/* Add single slot */}
          <details className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
            <summary className="font-bold text-slate-900 cursor-pointer text-base flex items-center gap-2">
              <span className="text-xl">➕</span> Add one slot manually
              <span className="text-xs font-normal text-slate-500 ml-2">(for one-off appointments)</span>
            </summary>
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
              className="mt-5 rounded-xl bg-[#d90429] hover:bg-[#b00322] px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 shadow-sm"
            >
              {addingSlot ? "Adding…" : "Add this slot"}
            </button>
          </details>

          {/* Auto-fill schedule */}
          <details className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6" open>
            <summary className="font-bold text-slate-900 cursor-pointer text-base flex items-center gap-2">
              <span className="text-xl">✨</span> Fill my schedule automatically
              <span className="text-xs font-normal text-slate-500 ml-2">(recommended)</span>
            </summary>
            <p className="text-sm text-slate-600 mt-3 mb-5">
              Pick a date range and your usual hours, and we&apos;ll create every available slot in one go.
              You can always delete individual slots later if you need time off.
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
              className="rounded-xl bg-[#d90429] hover:bg-[#b00322] px-6 py-3 text-base font-semibold text-white transition disabled:opacity-50 shadow-sm inline-flex items-center gap-2"
            >
              {addingAf ? "Generating slots…" : "✨ Generate slots"}
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
              {selectedSlot.booking && selectedSlot.booking.customer_name ? (
                <>
                  <div className="border-t pt-2 mt-2" />
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer</span>
                    <span className="font-medium">{selectedSlot.booking.customer_name}</span>
                  </div>
                  {selectedSlot.booking.customer_phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone</span>
                      <a href={`tel:${selectedSlot.booking.customer_phone}`} className="font-medium text-red-600 hover:underline">
                        {selectedSlot.booking.customer_phone}
                      </a>
                    </div>
                  )}
                  {selectedSlot.booking.customer_email && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email</span>
                      <a href={`mailto:${selectedSlot.booking.customer_email}`} className="font-medium text-red-600 hover:underline truncate max-w-[180px]">
                        {selectedSlot.booking.customer_email}
                      </a>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service</span>
                    <span className="font-medium capitalize">
                      {selectedSlot.booking.source === "edt"
                        ? `EDT lesson ${selectedSlot.booking.edt_session_number} of ${selectedSlot.booking.edt_package_total}`
                        : selectedSlot.booking.service_type || "—"}
                    </span>
                  </div>
                  {selectedSlot.booking.source !== "edt" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Amount</span>
                        <span className="font-medium">
                          {typeof selectedSlot.booking.amount_pence === "number"
                            ? `€${(selectedSlot.booking.amount_pence / 100).toFixed(2)}`
                            : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status</span>
                        <span className={`font-medium capitalize ${selectedSlot.booking.payment_status === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                          {selectedSlot.booking.payment_status}
                        </span>
                      </div>
                    </>
                  )}
                  {selectedSlot.booking.source === "edt" && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Paid via</span>
                      <span className="font-medium">EDT package (already paid)</span>
                    </div>
                  )}
                  {selectedSlot.booking.notes && (
                    <div className="border-t pt-2">
                      <p className="text-gray-500 text-xs mb-1">Notes</p>
                      <p className="text-sm">{selectedSlot.booking.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 p-3 text-sm text-amber-800 space-y-2">
                  <p className="font-semibold">Orphan slot</p>
                  <p className="text-xs">
                    This slot is locked as booked, but we couldn&apos;t find a customer
                    in the bookings list <em>or</em> in the EDT sessions table.
                  </p>
                  <p className="text-xs">
                    Most likely the booking was cancelled mid-flow, a payment didn&apos;t
                    complete, or a test booking was cleaned up. Use{" "}
                    <span className="font-semibold">Free this slot</span> below to
                    re-open it for customers.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedSlot(null)}
                className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  await deleteSlot(selectedSlot.id);
                  setSelectedSlot(null);
                }}
                disabled={deletingId === selectedSlot.id}
                className="flex-1 rounded-xl bg-[#d90429] hover:bg-[#b00322] text-white px-3 py-2 text-sm font-semibold transition disabled:opacity-50"
              >
                {deletingId === selectedSlot.id
                  ? "Working…"
                  : selectedSlot.booking?.customer_name
                  ? "Cancel booking"
                  : "Free this slot"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDT PACKAGES TAB ──────────────────────────────────────────────── */}
      {tab === "edt" && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-5 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-semibold text-slate-900">EDT package learners</p>
              <p className="text-xs text-slate-500">Customers working through their 12-lesson programme.</p>
            </div>
            <button onClick={loadEdtPackages} className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition">
              ↻ Refresh
            </button>
          </div>

          {loadingEdt && <p className="text-sm text-slate-500">Loading…</p>}
          {!loadingEdt && !edtPackages.length && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-10 text-center">
              <p className="text-4xl mb-2">🎓</p>
              <p className="text-base font-semibold text-slate-900">No EDT packages yet</p>
              <p className="text-sm text-slate-500 mt-1">When someone buys the EDT bundle they&apos;ll show up here.</p>
            </div>
          )}

          {edtPackages.length > 0 && (
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
              {/* Header row */}
              <div className="hidden md:grid bg-slate-50 px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-semibold grid-cols-[2fr_2fr_1fr_auto] gap-4">
                <div>Customer</div>
                <div>Progress</div>
                <div>Expires</div>
                <div className="w-6" />
              </div>

              {edtPackages.map((p) => {
                const pct = Math.round((p.lessons_used / p.lessons_total) * 100);
                const isOpen = expandedPkgId === p.id;
                const sessions = pkgSessions[p.id];
                const loadingThis = loadingPkgSessions === p.id;
                return (
                  <div key={p.id} className="border-t border-slate-100">
                    <button
                      onClick={() => void togglePackage(p.id)}
                      className="w-full text-left grid grid-cols-[1fr_auto] md:grid-cols-[2fr_2fr_1fr_auto] gap-4 items-center px-4 py-4 hover:bg-slate-50/70 transition"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{p.customer_name}</div>
                        <div className="text-slate-500 text-xs">{p.customer_email}</div>
                        <div className="md:hidden mt-2 text-xs text-slate-500">
                          {p.lessons_used} of {p.lessons_total} · expires {p.expires_at}
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-3">
                        <div className="h-2 w-28 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-2 bg-[#d90429] rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-slate-700 font-semibold tabular-nums text-sm">
                          {p.lessons_used} of {p.lessons_total}
                        </span>
                      </div>
                      <div className="hidden md:block text-slate-700 text-sm">{p.expires_at}</div>
                      <div
                        className={`text-slate-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                        aria-hidden="true"
                      >
                        ›
                      </div>
                    </button>

                    {isOpen && (
                      <div className="bg-slate-50/70 border-t border-slate-100 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                          Scheduled lessons
                        </p>
                        {loadingThis && (
                          <p className="text-sm text-slate-500">Loading sessions…</p>
                        )}
                        {!loadingThis && sessions && sessions.length === 0 && (
                          <p className="text-sm text-slate-500">
                            Nothing booked yet. The customer has their personal booking link by email.
                          </p>
                        )}
                        {!loadingThis && sessions && sessions.length > 0 && (
                          <div className="space-y-1.5">
                            {sessions.map((s) => {
                              const isCancelled = s.status === "cancelled";
                              const isDone = s.status === "completed";
                              return (
                                <div
                                  key={s.id}
                                  className={`flex items-center gap-3 text-sm rounded-lg px-3 py-2 bg-white border ${
                                    isCancelled
                                      ? "border-slate-200 text-slate-400 line-through"
                                      : isDone
                                      ? "border-emerald-200 text-emerald-800"
                                      : "border-slate-200 text-slate-800"
                                  }`}
                                >
                                  <span className="font-semibold tabular-nums w-16 shrink-0">
                                    {s.lesson_number != null ? `#${s.lesson_number}` : "—"}
                                  </span>
                                  {s.slot ? (
                                    <>
                                      <span className="font-medium">
                                        {format(new Date(`${s.slot.date}T00:00:00`), "EEE d MMM yyyy")}
                                      </span>
                                      <span className="text-slate-500">
                                        {s.slot.start_time.slice(0, 5)}–{s.slot.end_time.slice(0, 5)}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-slate-400 italic">No slot attached</span>
                                  )}
                                  <span
                                    className={`ml-auto text-xs font-semibold uppercase tracking-wider ${
                                      isCancelled ? "text-slate-400" : isDone ? "text-emerald-600" : "text-red-600"
                                    }`}
                                  >
                                    {s.status}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
