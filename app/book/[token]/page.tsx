"use client";
// app/book/[token]/page.tsx — EDT package holder session booking
import { use, useState, useEffect } from "react";
import Link from "next/link";
import BookingCalendar, { type Slot } from "@/components/BookingCalendar";
import { format } from "date-fns";

type PackageData = {
  id: string;
  customer_name: string;
  customer_email: string;
  lessons_total: number;
  lessons_used: number;
  remaining: number;
  expires_at: string;
  expired: boolean;
  active_sessions: number;
};

type Props = { params: Promise<{ token: string }> };

export default function EdtBookingPage({ params }: Props) {
  const { token } = use(params);

  const [pkg, setPkg] = useState<PackageData | null>(null);
  const [loadingPkg, setLoadingPkg] = useState(true);
  const [pkgError, setPkgError] = useState("");

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");
  const [booked, setBooked] = useState(false);
  const [bookedSlot, setBookedSlot] = useState<Slot | null>(null);

  useEffect(() => {
    fetch(`/api/edt/${token}`)
      .then((r) => r.json())
      .then((data: PackageData & { error?: string }) => {
        if (data.error) setPkgError(data.error);
        else setPkg(data);
      })
      .catch(() => setPkgError("Failed to load package. Please try again."))
      .finally(() => setLoadingPkg(false));
  }, [token]);

  async function handleBook() {
    if (!selectedSlot) return;
    setBooking(true);
    setBookError("");

    try {
      const res = await fetch(`/api/edt/${token}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot_id: selectedSlot.id }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Booking failed");
      }

      setBookedSlot(selectedSlot);
      setBooked(true);
    } catch (e: unknown) {
      setBookError(e instanceof Error ? e.message : "Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  if (loadingPkg) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-gray-500">Loading your package…</p>
      </div>
    );
  }

  if (pkgError || !pkg) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center space-y-4">
        <p className="text-red-600 font-medium">{pkgError || "Package not found."}</p>
        <Link href="/contact" className="text-sm text-red-600 underline">Contact us for help</Link>
      </div>
    );
  }

  if (pkg.expired) {
    return (
      <section className="mx-auto max-w-xl space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center space-y-3">
          <h1 className="text-xl font-extrabold text-amber-900">Package Expired</h1>
          <p className="text-sm text-amber-800">
            Hi {pkg.customer_name} — your {pkg.lessons_total}-lesson package expired on {pkg.expires_at}.
          </p>
          <p className="text-sm text-amber-800">
            You used {pkg.lessons_used} of {pkg.lessons_total} lessons.
            <Link href="/contact" className="ml-1 underline">Contact us</Link> to discuss an extension.
          </p>
        </div>
      </section>
    );
  }

  if (pkg.remaining === 0) {
    return (
      <section className="mx-auto max-w-xl space-y-4">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center space-y-3">
          <div className="text-4xl">🎉</div>
          <h1 className="text-xl font-extrabold text-green-900">Package Complete!</h1>
          <p className="text-sm text-green-800">
            Hi {pkg.customer_name} — you&apos;ve completed all {pkg.lessons_total} EDT lessons. Well done!
          </p>
          <Link href="/contact" className="text-sm text-red-600 underline">Book additional lessons</Link>
        </div>
      </section>
    );
  }

  if (booked && bookedSlot) {
    return (
      <section className="mx-auto max-w-xl space-y-4">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h1 className="text-xl font-extrabold text-green-900">Session booked!</h1>
          <p className="text-sm text-green-800">
            {bookedSlot.date} · {bookedSlot.start_time.slice(0, 5)}–{bookedSlot.end_time.slice(0, 5)}
          </p>
          <p className="text-sm text-green-800">
            A confirmation has been sent to {pkg.customer_email}.
          </p>
          <p className="text-sm text-green-700 font-medium">
            Lessons remaining: {pkg.remaining - 1} of {pkg.lessons_total}
          </p>
          <button
            onClick={() => {
              setBooked(false);
              setSelectedSlot(null);
              // Refresh package data
              setLoadingPkg(true);
              fetch(`/api/edt/${token}`)
                .then((r) => r.json())
                .then((data: PackageData) => setPkg(data))
                .finally(() => setLoadingPkg(false));
            }}
            className="mt-2 rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-green-100 transition"
          >
            Book another session
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Book your next EDT session</h1>
        <p className="text-gray-600">Hi {pkg.customer_name} — pick an available slot below.</p>
      </div>

      {/* Package status */}
      <div className="rounded-2xl border bg-white p-5 flex flex-wrap gap-6 text-sm">
        <div className="text-center">
          <p className="text-2xl font-extrabold text-red-600">{pkg.remaining}</p>
          <p className="text-gray-500">lessons remaining</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-extrabold text-gray-800">{pkg.lessons_used}</p>
          <p className="text-gray-500">completed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-extrabold text-gray-800">{pkg.lessons_total}</p>
          <p className="text-gray-500">total</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">{pkg.expires_at}</p>
          <p className="text-gray-500">package expires</p>
        </div>
      </div>

      {pkg.active_sessions >= 2 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You already have {pkg.active_sessions} upcoming session{pkg.active_sessions > 1 ? "s" : ""} scheduled.
          Please attend a session before booking more.
        </div>
      )}

      {pkg.active_sessions < 2 && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <BookingCalendar serviceType="standard" onSlotSelected={setSelectedSlot} />
        </div>
      )}

      {selectedSlot && pkg.active_sessions < 2 && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-green-800">Selected</p>
            <p className="text-sm text-green-700">
              {format(new Date(selectedSlot.date), "EEEE, d MMMM")} · {selectedSlot.start_time.slice(0, 5)}–{selectedSlot.end_time.slice(0, 5)}
            </p>
          </div>
          <button
            onClick={handleBook}
            disabled={booking}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
          >
            {booking ? "Booking…" : "Confirm session"}
          </button>
        </div>
      )}

      {bookError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {bookError}
        </div>
      )}
    </section>
  );
}
