"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Plate, Check } from "@/components/brand";
import { formatPrice } from "@/lib/config";

/**
 * The instructor's dashboard.
 *
 * Built for one specific person doing one specific thing: opening this on a
 * phone between lessons to see who is next, where they live and what they owe.
 * So the default view is today, the phone number is a tap-to-call link, and
 * the destructive actions ask first.
 */

type Booking = {
  id: string;
  reference: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_address: string | null;
  test_centre: string | null;
  transmission: string | null;
  notes: string | null;
  starts_at: string;
  ends_at: string;
  price_cents: number;
  deposit_cents: number;
  paid_at: string | null;
  refunded_at: string | null;
  google_event_id: string | null;
  services: { name: string; duration_minutes: number } | null;
};

type Tab = "today" | "upcoming" | "all";

export default function AdminDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<{ connected: boolean; message: string } | null>(
    null
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingsRes, availabilityRes] = await Promise.all([
        fetch("/api/admin/bookings?days=60", { cache: "no-store" }),
        fetch("/api/admin/availability", { cache: "no-store" }),
      ]);

      if (bookingsRes.status === 401) {
        router.refresh();
        return;
      }
      if (!bookingsRes.ok) throw new Error("Could not load bookings");

      const data = await bookingsRes.json();
      setBookings(data.bookings ?? []);

      if (availabilityRes.ok) {
        const availability = await availabilityRes.json();
        setCalendar(availability.calendar ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Dublin" }).format(
    new Date()
  );

  const filtered = useMemo(() => {
    const live = bookings.filter((b) => ["confirmed", "pending"].includes(b.status));

    if (tab === "today") {
      return live.filter((b) => dayKey(b.starts_at) === todayKey);
    }
    if (tab === "upcoming") {
      return live.filter((b) => new Date(b.starts_at).getTime() >= Date.now());
    }
    return bookings;
  }, [bookings, tab, todayKey]);

  const stats = useMemo(() => {
    const upcoming = bookings.filter(
      (b) => ["confirmed", "pending"].includes(b.status) && new Date(b.starts_at) >= new Date()
    );
    return {
      today: bookings.filter(
        (b) => dayKey(b.starts_at) === todayKey && ["confirmed", "pending"].includes(b.status)
      ).length,
      upcoming: upcoming.length,
      owed: upcoming.reduce((sum, b) => sum + (b.price_cents - b.deposit_cents), 0),
      unsynced: upcoming.filter((b) => !b.google_event_id).length,
    };
  }, [bookings, todayKey]);

  async function act(booking: Booking, action: "cancel" | "complete" | "no_show") {
    const labels = {
      cancel: `Cancel ${booking.customer_name}'s lesson and refund the deposit?`,
      complete: `Mark ${booking.customer_name}'s lesson as done?`,
      no_show: `Mark ${booking.customer_name} as a no-show? The deposit is not refunded.`,
    };

    if (!window.confirm(labels[action])) return;

    setBusyId(booking.id);
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setToast(data.error ?? "That did not work");
        return;
      }

      setToast(
        action === "cancel"
          ? "Cancelled, refunded and removed from your calendar."
          : "Updated."
      );
      await load();
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(null), 4000);
    }
  }

  async function logOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.refresh();
  }

  return (
    <Container size="wide" className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Plate letter="A" size="md" tone="ink" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-[-0.025em]">Bookings</h1>
            <p className="text-sm text-ink-soft">
              {new Date().toLocaleDateString("en-IE", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => void load()} className="btn btn-quiet text-sm">
            Refresh
          </button>
          <button onClick={() => void logOut()} className="btn btn-quiet text-sm">
            Log out
          </button>
        </div>
      </div>

      {/* Health */}
      {calendar && !calendar.connected && (
        <div className="mt-6 border-2 border-caution bg-caution-wash p-4 text-sm">
          <p className="font-bold">Google Calendar is not connected</p>
          <p className="mt-1">{calendar.message}</p>
        </div>
      )}

      {stats.unsynced > 0 && calendar?.connected && (
        <div className="mt-6 border-2 border-caution bg-caution-wash p-4 text-sm">
          <p className="font-bold">
            {stats.unsynced} upcoming{" "}
            {stats.unsynced === 1 ? "lesson is" : "lessons are"} not on your calendar yet
          </p>
          <p className="mt-1">
            The hourly job retries these automatically. If it persists, check that the
            calendar is still shared with the service account.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <StatTile label="Today" value={String(stats.today)} />
        <StatTile label="Upcoming" value={String(stats.upcoming)} />
        <StatTile label="To collect" value={formatPrice(stats.owed)} />
        <StatTile
          label="Calendar"
          value={calendar?.connected ? "Synced" : "Off"}
          tone={calendar?.connected ? "pass" : "caution"}
        />
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-2 border-b-2 border-ink pb-3">
        {(
          [
            ["today", "Today"],
            ["upcoming", "Upcoming"],
            ["all", "Everything"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              tab === value ? "bg-ink text-white" : "bg-white hover:bg-paper-dim"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {toast && (
        <p role="status" className="mt-4 border-2 border-pass bg-pass-wash p-3 text-sm font-bold">
          {toast}
        </p>
      )}

      {/* List */}
      <div className="mt-6">
        {loading && <p className="py-12 text-center text-ink-soft">Loading...</p>}

        {error && (
          <div className="border-2 border-plate bg-plate-wash p-5">
            <p className="font-bold">{error}</p>
            <button onClick={() => void load()} className="mt-2 text-sm underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="border-2 border-dashed border-rule py-14 text-center text-ink-soft">
            {tab === "today" ? "Nothing on today." : "Nothing here."}
          </p>
        )}

        <div className="space-y-3">
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              busy={busyId === booking.id}
              onAction={act}
            />
          ))}
        </div>
      </div>
    </Container>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pass" | "caution";
}) {
  const colour =
    tone === "pass" ? "text-pass" : tone === "caution" ? "text-caution" : "text-ink";
  return (
    <div className="panel-quiet p-4">
      <p className="eyebrow">{label}</p>
      <p className={`tabular mt-1.5 text-2xl font-extrabold tracking-[-0.03em] ${colour}`}>
        {value}
      </p>
    </div>
  );
}

function BookingCard({
  booking,
  busy,
  onAction,
}: {
  booking: Booking;
  busy: boolean;
  onAction: (b: Booking, action: "cancel" | "complete" | "no_show") => void;
}) {
  const startsAt = new Date(booking.starts_at);
  const isPast = startsAt.getTime() < Date.now();
  const isLive = ["confirmed", "pending"].includes(booking.status);
  const balance = booking.price_cents - booking.deposit_cents;

  return (
    <article className="panel-quiet p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="tabular text-lg font-extrabold">
              {startsAt.toLocaleString("en-IE", {
                timeZone: "Europe/Dublin",
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </p>
            <StatusBadge status={booking.status} />
            {!booking.google_event_id && isLive && !isPast && (
              <span className="badge badge-caution">Not on calendar</span>
            )}
          </div>

          <p className="mt-1.5 font-bold">{booking.customer_name}</p>
          <p className="text-sm text-ink-soft">
            {booking.services?.name} &middot;{" "}
            <span className="tabular">{booking.reference}</span>
          </p>

          <div className="mt-3 space-y-1 text-sm">
            <p>
              <a href={`tel:${booking.customer_phone}`} className="tabular font-bold underline">
                {booking.customer_phone}
              </a>
            </p>
            {booking.pickup_address && (
              <p className="text-ink-soft">
                <span className="font-bold text-ink">Pick-up:</span> {booking.pickup_address}
              </p>
            )}
            {booking.test_centre && (
              <p className="text-ink-soft">
                <span className="font-bold text-ink">Test centre:</span> {booking.test_centre}
              </p>
            )}
            {booking.notes && (
              <p className="text-ink-soft">
                <span className="font-bold text-ink">Notes:</span> {booking.notes}
              </p>
            )}
          </div>
        </div>

        <div className="flex-none text-right">
          <p className="tabular text-lg font-extrabold">{formatPrice(balance)}</p>
          <p className="text-xs text-ink-faint">to collect</p>
          {booking.paid_at && (
            <p className="mt-1 flex items-center justify-end gap-1 text-xs text-pass">
              <Check className="h-3 w-3" /> {formatPrice(booking.deposit_cents)} paid
            </p>
          )}
        </div>
      </div>

      {isLive && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-rule pt-4">
          {isPast && (
            <>
              <button
                onClick={() => onAction(booking, "complete")}
                disabled={busy}
                className="btn btn-quiet !min-h-10 !py-2 text-xs"
              >
                Mark done
              </button>
              <button
                onClick={() => onAction(booking, "no_show")}
                disabled={busy}
                className="btn btn-quiet !min-h-10 !py-2 text-xs"
              >
                No-show
              </button>
            </>
          )}
          <button
            onClick={() => onAction(booking, "cancel")}
            disabled={busy}
            className="btn btn-quiet !min-h-10 !py-2 text-xs text-plate-dark"
          >
            {busy ? "Working..." : "Cancel and refund"}
          </button>
        </div>
      )}
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { className: string; label: string }> = {
    confirmed: { className: "badge-pass", label: "Confirmed" },
    pending: { className: "badge-caution", label: "Awaiting payment" },
    cancelled: { className: "badge-plate", label: "Cancelled" },
    completed: { className: "badge-quiet", label: "Done" },
    no_show: { className: "badge-plate", label: "No-show" },
  };
  const item = map[status] ?? { className: "badge-quiet", label: status };
  return <span className={`badge ${item.className}`}>{item.label}</span>;
}

function dayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Dublin" }).format(new Date(iso));
}
