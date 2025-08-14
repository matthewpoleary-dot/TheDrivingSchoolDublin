// app/admin/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
};

type BookingRow = {
  id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: "confirmed" | "cancelled" | "completed" | string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  service?: Service | null;
};

export default function AdminPage() {
  // Token handling
  const [token, setToken] = useState("");
  const [hasToken, setHasToken] = useState(false);

  // Filters
  const today = format(new Date(), "yyyy-MM-dd");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(
    format(new Date(Date.now() + 14 * 86400000), "yyyy-MM-dd")
  );

  // Data
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Load stored token once
  useEffect(() => {
    const t = localStorage.getItem("adminToken") || "";
    if (t) {
      setToken(t);
      setHasToken(true);
    }
  }, []);

  function toast(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(""), 2200);
  }

  function saveToken() {
    const t = token.trim();
    if (!t) return;
    localStorage.setItem("adminToken", t);
    setHasToken(true);
    toast("Token saved");
  }

  async function fetchBookings() {
    if (!hasToken) return;
    try {
      setLoading(true);
      const u = new URL("/api/admin/bookings", window.location.origin);
      if (dateFrom) u.searchParams.set("date_from", dateFrom);
      if (dateTo) u.searchParams.set("date_to", dateTo);

      const res = await fetch(u.toString(), {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load bookings");
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast(e.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hasToken) fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken]);

  async function updateStatus(id: string, status: "cancelled" | "confirmed" | "completed") {
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast("Updated");
      await fetchBookings();
    } catch (e: any) {
      toast(e.message || "Update failed");
    }
  }

  // Derived lists
  const upcoming = useMemo(
    () =>
      rows
        .slice()
        .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at)),
    [rows]
  );

  // ============== RENDER ==============

  if (!hasToken) {
    return (
      <section className="mx-auto max-w-md py-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Admin login</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter your admin token (set as <code>ADMIN_TOKEN</code> in your env).
        </p>

        <input
          type="password"
          placeholder="Admin token"
          className="w-full rounded border px-3 py-2 mb-3"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />

        <button
          onClick={saveToken}
          className="inline-flex items-center rounded-lg px-5 py-2.5 font-semibold text-white bg-red-600 hover:bg-red-700"
        >
          Continue
        </button>

        {msg && <p className="mt-4 text-sm text-red-700">{msg}</p>}
      </section>
    );
  }

  return (
    <section className="py-6">
      <header className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-600">Manage bookings</p>
        </div>

        <div className="ml-auto flex items-end gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">From</label>
            <input
              type="date"
              className="rounded border px-3 py-2"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">To</label>
            <input
              type="date"
              className="rounded border px-3 py-2"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <button
            onClick={fetchBookings}
            className="inline-flex items-center rounded-lg px-5 py-2.5 font-semibold text-white bg-red-600 hover:bg-red-700"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-700">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-gray-600" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : upcoming.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-gray-600" colSpan={6}>
                  No bookings in this range.
                </td>
              </tr>
            ) : (
              upcoming.map((b) => {
                const d = new Date(b.starts_at);
                const dateLabel = d.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                const timeLabel = d.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3">{dateLabel}</td>
                    <td className="px-4 py-3">{timeLabel}</td>
                    <td className="px-4 py-3">{b.service?.name ?? b.service_id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.client_name}</div>
                      <div className="text-gray-600">
                        {b.client_email}
                        {b.client_phone ? ` · ${b.client_phone}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">{b.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {b.status !== "cancelled" && (
                          <button
                            className="inline-flex rounded border px-3 py-1 hover:bg-gray-50"
                            onClick={() => updateStatus(b.id, "cancelled")}
                          >
                            Cancel
                          </button>
                        )}
                        {b.status !== "confirmed" && (
                          <button
                            className="inline-flex rounded border px-3 py-1 hover:bg-gray-50"
                            onClick={() => updateStatus(b.id, "confirmed")}
                          >
                            Confirm
                          </button>
                        )}
                        {b.status !== "completed" && (
                          <button
                            className="inline-flex rounded border px-3 py-1 hover:bg-gray-50"
                            onClick={() => updateStatus(b.id, "completed")}
                          >
                            Completed
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {msg && <p className="mt-3 text-sm text-red-700">{msg}</p>}
    </section>
  );
}
