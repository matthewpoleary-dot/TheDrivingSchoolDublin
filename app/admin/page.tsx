// app/admin/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { formatZoned } from "@/lib/time";

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
  const [token, setToken] = useState<string>("");
  const [inputToken, setInputToken] = useState<string>("");
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [toast, setToast] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("adminToken");
    if (saved) setToken(saved);
  }, []);

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
        try {
          body = (await res.json()) as { error?: string };
        } catch {
          // ignore
        }
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
      try {
        body = (await res.json()) as ApiOk;
      } catch {
        // ignore
      }

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
          Paste your admin token to view and manage bookings.
        </p>
        <input
          className="w-full rounded border px-3 py-2 mb-3"
          placeholder="Admin token"
          value={inputToken}
          onChange={(e) => setInputToken(e.target.value)}
        />
        <button
          onClick={() => {
            if (!inputToken.trim()) return;
            sessionStorage.setItem("adminToken", inputToken.trim());
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Admin — Bookings</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="rounded border px-3 py-2 hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem("adminToken");
              setToken("");
              setRows([]);
            }}
            className="rounded border px-3 py-2 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </div>

      {toast && <p className="text-sm text-green-700 mb-3">{toast}</p>}
      {loading && <p className="text-sm text-gray-600 mb-3">Loading…</p>}
      {errorMsg && <p className="text-sm text-red-600 mb-3">{errorMsg}</p>}

      {!rows.length ? (
        <p className="text-sm text-gray-600">No bookings yet.</p>
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
              {rows.map((r) => {
                const when = formatZoned(r.starts_at); // ✅ consistent timezone
                const serviceLabel =
                  r.services?.name ?? `${r.service_id.slice(0, 6)}…`;
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
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}
                      >
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
