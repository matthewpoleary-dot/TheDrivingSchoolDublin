"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check } from "@/components/brand";

type WorkingWindow = {
  weekday: number;
  startTime: string;
  endTime: string;
  slotIntervalMinutes: number;
};

type StoredWindow = {
  weekday: number;
  start_time: string;
  end_time: string;
  slot_interval_minutes: number;
};

type DateOverride = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_blackout: boolean;
  note: string | null;
};

const DAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 0, label: "Sunday", short: "Sun" },
] as const;

const PRESETS = [
  { label: "7–3", startTime: "07:00", endTime: "15:00" },
  { label: "8–4", startTime: "08:00", endTime: "16:00" },
  { label: "9–5", startTime: "09:00", endTime: "17:00" },
] as const;

function trimTime(value: string): string {
  return value.slice(0, 5);
}

function blankWindow(weekday: number, evening = false): WorkingWindow {
  return {
    weekday,
    startTime: evening ? "17:30" : "09:00",
    endTime: evening ? "19:30" : "17:00",
    slotIntervalMinutes: 30,
  };
}

export default function AvailabilityEditor() {
  const [windows, setWindows] = useState<WorkingWindow[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exception, setException] = useState({
    date: "",
    kind: "off" as "off" | "extra",
    startTime: "17:30",
    endTime: "19:30",
    note: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/availability", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load working hours");
      const data = await response.json();
      setWindows(
        (data.template as StoredWindow[]).map((row) => ({
          weekday: row.weekday,
          startTime: trimTime(row.start_time),
          endTime: trimTime(row.end_time),
          slotIntervalMinutes: row.slot_interval_minutes,
        }))
      );
      setOverrides(data.overrides ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load working hours");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byDay = useMemo(
    () =>
      new Map<number, WorkingWindow[]>(
        DAYS.map((day) => [
          day.value,
          windows
            .filter((window) => window.weekday === day.value)
            .sort((a, b) => a.startTime.localeCompare(b.startTime)),
        ])
      ),
    [windows]
  );

  function applyPreset(startTime: string, endTime: string) {
    setWindows(
      DAYS.filter((day) => day.value >= 1 && day.value <= 5).map((day) => ({
        weekday: day.value,
        startTime,
        endTime,
        slotIntervalMinutes: 30,
      }))
    );
    setMessage("Preset applied. Press Save working week to make it live.");
  }

  function toggleDay(weekday: number) {
    const open = windows.some((window) => window.weekday === weekday);
    setWindows(
      open
        ? windows.filter((window) => window.weekday !== weekday)
        : [...windows, blankWindow(weekday)]
    );
  }

  function updateWindow(weekday: number, index: number, patch: Partial<WorkingWindow>) {
    const dayWindows = byDay.get(weekday) ?? [];
    const target = dayWindows[index];
    if (!target) return;
    setWindows(windows.map((window) => (window === target ? { ...window, ...patch } : window)));
  }

  function removeWindow(weekday: number, index: number) {
    const target = (byDay.get(weekday) ?? [])[index];
    if (target) setWindows(windows.filter((window) => window !== target));
  }

  async function saveWeek() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "template", windows }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Could not save working hours");
      setMessage("Working week saved. New bookings now use these hours.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save working hours");
    } finally {
      setSaving(false);
    }
  }

  async function addException(event: React.FormEvent) {
    event.preventDefault();
    if (!exception.date) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "override",
          date: exception.date,
          startTime: exception.kind === "off" ? "00:00" : exception.startTime,
          endTime: exception.kind === "off" ? "23:59" : exception.endTime,
          isBlackout: exception.kind === "off",
          note: exception.note,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Could not save that date");
      setException({ ...exception, date: "", note: "" });
      setMessage(exception.kind === "off" ? "Day off added." : "Extra hours added.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that date");
    } finally {
      setSaving(false);
    }
  }

  async function removeException(id: string) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/availability?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Could not remove that date");
      setOverrides(overrides.filter((item) => item.id !== id));
      setMessage("Exception removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove that date");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="panel mt-8" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="eyebrow">Availability</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em]">
            Working hours &amp; time off
          </h2>
        </div>
        <span className="badge badge-quiet">Tap to open</span>
      </summary>

      <div className="border-t-2 border-ink p-5 sm:p-6">
        <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
          Set the normal week here once. Anything already in Google Calendar blocks that
          time automatically, so appointments and holidays do not need to be entered twice.
        </p>

        {message && (
          <p role="status" className="mt-4 border-2 border-pass bg-pass-wash p-3 text-sm font-bold">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 border-2 border-plate bg-plate-wash p-3 text-sm font-bold">
            {error}
          </p>
        )}

        {loading ? (
          <p className="py-10 text-center text-sm text-ink-soft">Loading working hours...</p>
        ) : (
          <>
            <div className="mt-6">
              <p className="field-label">Quick weekday preset</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.startTime, preset.endTime)}
                    className="btn btn-quiet !min-h-10 !py-2 text-sm"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                Presets set Monday to Friday and switch the weekend off. You can add evening
                blocks or weekend hours below.
              </p>
            </div>

            <div className="mt-7 divide-y divide-rule border-y border-rule">
              {DAYS.map((day) => {
                const dayWindows = byDay.get(day.value) ?? [];
                const open = dayWindows.length > 0;
                return (
                  <div key={day.value} className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={open}
                          onClick={() => toggleDay(day.value)}
                          className={`grid h-7 w-12 place-items-center border-2 transition-colors ${
                            open ? "border-pass bg-pass text-white" : "border-rule bg-paper-dim"
                          }`}
                        >
                          {open && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <p className="font-bold">{day.label}</p>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                        {open ? `${dayWindows.length} block${dayWindows.length === 1 ? "" : "s"}` : "Off"}
                      </span>
                    </div>

                    {open && (
                      <div className="mt-3 space-y-3 pl-0 sm:pl-[3.75rem]">
                        {dayWindows.map((window, index) => (
                          <div
                            key={`${day.value}-${index}`}
                            className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2"
                          >
                            <label className="text-xs font-bold text-ink-soft">
                              Start
                              <input
                                type="time"
                                value={window.startTime}
                                onChange={(event) =>
                                  updateWindow(day.value, index, { startTime: event.target.value })
                                }
                                className="field mt-1 !min-h-10 !px-2 !py-1.5"
                              />
                            </label>
                            <span className="pb-2.5 text-ink-faint">to</span>
                            <label className="text-xs font-bold text-ink-soft">
                              Finish
                              <input
                                type="time"
                                value={window.endTime}
                                onChange={(event) =>
                                  updateWindow(day.value, index, { endTime: event.target.value })
                                }
                                className="field mt-1 !min-h-10 !px-2 !py-1.5"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => removeWindow(day.value, index)}
                              className="btn btn-quiet !min-h-10 !px-3 !py-1.5 text-xs"
                              aria-label={`Remove ${day.short} time block`}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setWindows([...windows, blankWindow(day.value, true)])}
                          className="text-sm font-bold underline decoration-plate decoration-2 underline-offset-4"
                        >
                          + Add another time block
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => void saveWeek()}
              disabled={saving}
              className="btn btn-primary mt-5 w-full sm:w-auto"
            >
              {saving ? "Saving..." : "Save working week"}
            </button>

            <div className="rule-heavy mt-10 pt-6">
              <p className="eyebrow">One-off changes</p>
              <h3 className="mt-1 text-lg font-extrabold">Add a day off or extra hours</h3>

              <form onSubmit={addException} className="mt-5 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="field-label">Date</span>
                  <input
                    type="date"
                    required
                    value={exception.date}
                    onChange={(event) => setException({ ...exception, date: event.target.value })}
                    className="field"
                  />
                </label>
                <div>
                  <span className="field-label">Change</span>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ["off", "Day off"],
                      ["extra", "Extra hours"],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={exception.kind === value}
                        onClick={() => setException({ ...exception, kind: value })}
                        className={`slot ${exception.kind === value ? "slot-selected" : ""}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {exception.kind === "extra" && (
                  <div className="grid grid-cols-2 gap-3">
                    <label>
                      <span className="field-label">Start</span>
                      <input
                        type="time"
                        value={exception.startTime}
                        onChange={(event) =>
                          setException({ ...exception, startTime: event.target.value })
                        }
                        className="field"
                      />
                    </label>
                    <label>
                      <span className="field-label">Finish</span>
                      <input
                        type="time"
                        value={exception.endTime}
                        onChange={(event) =>
                          setException({ ...exception, endTime: event.target.value })
                        }
                        className="field"
                      />
                    </label>
                  </div>
                )}

                <label className={exception.kind === "off" ? "md:col-span-2" : ""}>
                  <span className="field-label">Note (optional)</span>
                  <input
                    type="text"
                    value={exception.note}
                    onChange={(event) => setException({ ...exception, note: event.target.value })}
                    placeholder="Holiday, late lessons, appointment..."
                    className="field"
                  />
                </label>

                <button type="submit" disabled={saving} className="btn btn-ink md:col-span-2">
                  Add this change
                </button>
              </form>

              {overrides.length > 0 && (
                <div className="mt-6">
                  <p className="field-label">Upcoming changes</p>
                  <ul className="divide-y divide-rule border-y border-rule">
                    {overrides.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                        <div>
                          <p className="tabular font-bold">
                            {new Date(`${item.date}T12:00:00Z`).toLocaleDateString("en-IE", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                          <p className="text-sm text-ink-soft">
                            {item.is_blackout
                              ? "Day off"
                              : `${trimTime(item.start_time)}–${trimTime(item.end_time)}`}
                            {item.note ? ` · ${item.note}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void removeException(item.id)}
                          disabled={saving}
                          className="btn btn-quiet !min-h-10 !py-2 text-xs"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </details>
  );
}
