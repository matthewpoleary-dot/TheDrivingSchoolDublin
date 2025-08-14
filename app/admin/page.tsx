// app/admin/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { dateKeyZoned, formatZoned } from "@/lib/time";

type BookingStatus = "confirmed" | "cancelled" | "completed";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
};

type BookingRow = {
  id: string;
  service_id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  starts_at: string; // ISO
  ends_at: string;   // ISO
  status: BookingStatus;
  services?: Service; // if joined
};

type ApiOk = { ok: true } | { ok?: false; error?: string };

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

export default function AdminPage() {
  // token only in memory for this visit
  const [token, setToken] = useState<string>("");
  const [inputToken, setInputToken] = useState<string>("");

  // data
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [toast, setToast] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // view state
  const [tab, setTab] = useState<"all" | "day">("day");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // default today in TIMEZONE
    return dateKeyZoned(new Date().toISOString());
  });

  const isAuthed = useMemo(() => token.trim().length > 0, [token]);

  async function load() {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        let body: { error?: string } | undefined;
        try { body = (await res.json()) as { error?: string }; } catch {}
        throw new Error(body?.error || `Failed to load (${res.status})`);
      }
      const data = (await res.json()) as unknown;
      setRows(Array.isArray(data) ? (data as BookingRow[]) : []);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Auto-load immediately after successful token entry
  useEffect(() => {
    if (isAuthed) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  const filtered = useMemo(() => {
    if (tab === "all") return rows;
    return rows.filter((r) => dateKeyZoned(r.starts_at) === selectedDate);
  }, [rows, tab, selectedDate]);

  async function updateStatus(id: string, status: BookingStatus) {
    try {
      setSavingId(id);
      setToast("");
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      let body: ApiOk | undefined;
      try { body = (await res.json()) as ApiOk; } catch {}

      if (!res.ok || !body || (body as { ok?: boolean }).ok !== true) {
        throw new Error((body as { error?: string })?.error || "Update failed");
      }

      await load();
      setToast(
        status === "completed"
          ? "Marked as completed and emails sent."
          : "Marked as cancelled and emails sent."
      );
      setTimeout(() => setToast(""), 2500);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err) || "Failed to update booking");
      setTimeout(() => setErrorMsg(""), 3000);
    } finally {
      setSavingId(null);
    }
  }

  if (!isAuthed) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Admin login</h1>
        <p className="text-sm text-gray-600 mb-3">
          Enter your admin token to manage bookings.
        </p>
        <input
          className="w-full rounded border px-3 py-2 mb-3"
          placeholder="Admin token"
          type="password"
          value={inputToken}
          onChange={(e) => setInputToken(e.target.value)}
        />
        <button
          onClick={() => {
            if (!inputToken.trim()) return;
            setToken(inputToken.trim());
          }}
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin — Bookings</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="rounded border px-3 py-2 hover:bg-gray-50">
            Refresh
          </button>
          <button
            onClick={() => {
              setToken("");
              setRows([]);
              setInputToken("");
            }}
            className="rounded border px-3 py-2 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab("day")}
          className={`rounded px-3 py-2 text-sm border ${
            tab === "day" ? "bg-black text-white" : "bg-white hover:bg-gray-50"
          }`}
        >
          Day
        </button>
        <button
          onClick={() => setTab("all")}
          className={`rounded px-3 py-2 text-sm border ${
            tab === "all" ? "bg-black text-white" : "bg-white hover:bg-gray-50"
          }`}
        >
          All
        </button>

        {tab === "day" && (
          <div className="ml-3 flex items-center gap-2">
            <label className="text-sm text-gray-700">Date</label>
            <input
              type="date"
              className="rounded border px-3 py-2 text-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {toast && <p className="text-sm text-green-700">{toast}</p>}
      {loading && <p className="text-sm text-gray-600">Loading…</p>}
      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      {!filtered.length ? (
        <p className="text-sm text-gray-600">
          {tab === "day" ? "No bookings for this day." : "No bookings yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const when = formatZoned(r.starts_at);
                const serviceLabel = r.services?.name ?? `${r.service_id.slice(0, 6)}…`;
                const badge =
                  r.status === "confirmed"
                    ? "bg-green-100 text-green-700"
                    : r.status === "completed"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-red-100 text-red-700";
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{when}</td>
                    <td className="px-3 py-2">
                      {r.client_name}
                      <div className="text-gray-500">{r.client_email}</div>
                    </td>
                    <td className="px-3 py-2">{serviceLabel}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(r.id, "completed")}
                          disabled={savingId === r.id}
                          className="rounded border px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {savingId === r.id ? "Saving…" : "Completed"}
                        </button>
                        <button
                          onClick={() => updateStatus(r.id, "cancelled")}
                          disabled={savingId === r.id}
                          className="rounded border px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {savingId === r.id ? "Saving…" : "Cancel"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
