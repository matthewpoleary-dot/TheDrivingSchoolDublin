"use client";
// app/book/[token]/page.tsx: EDT package holder session booking
import { use, useState, useEffect } from "react";
import Link from "next/link";
import BookingCalendar, { type Slot } from "@/components/BookingCalendar";
import FlipPlate from "@/components/lton/FlipPlate";
import { EDT_SLOT_SERVICE_TYPE } from "@/lib/services";
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
  package_type?: string;
  second_instalment_paid?: boolean;
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
  const [payingSecond, setPayingSecond] = useState(false);
  const [secondError, setSecondError] = useState("");

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
      <div className="l-page l-result" style={{ textAlign: "center" }} role="status">
        <p className="l-body">Loading your package…</p>
      </div>
    );
  }

  if (pkgError || !pkg) {
    return (
      <div className="l-page l-result">
        <p className="l-notice l-notice--error" role="alert">{pkgError || "Package not found."}</p>
        <p style={{ marginTop: 18 }}>
          <Link href="/contact" className="l-link">Contact us for help</Link>
        </p>
      </div>
    );
  }

  if (pkg.expired) {
    return (
      <section className="l-page l-result">
        <div className="l-result__mark l-result__mark--warn" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="3.5" />
            <path d="M16 10v7l4 3" stroke="currentColor" strokeWidth="3.5" />
          </svg>
        </div>
        <h1 className="l-display l-h2">Package Expired</h1>
        <p className="l-lede">
          Hi {pkg.customer_name}, your {pkg.lessons_total}-lesson package expired on {pkg.expires_at}.
        </p>
        <p className="l-body" style={{ marginTop: 12 }}>
          You used {pkg.lessons_used} of {pkg.lessons_total} lessons.{" "}
          <Link href="/contact" className="l-link">Contact us</Link> to discuss an extension.
        </p>
      </section>
    );
  }

  const needsSecondInstalment =
    pkg.package_type === "split" &&
    pkg.lessons_used >= pkg.lessons_total &&
    !pkg.second_instalment_paid;

  async function handlePaySecondInstalment() {
    setPayingSecond(true);
    setSecondError("");
    try {
      const res = await fetch(`/api/edt/${token}/second-instalment`, { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to start payment");
      window.location.href = data.url;
    } catch (e: unknown) {
      setSecondError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setPayingSecond(false);
    }
  }

  if (pkg.remaining === 0 && !needsSecondInstalment) {
    return (
      <section className="l-page l-result" style={{ textAlign: "center" }}>
        <FlipPlate />
        <h1 className="l-display l-h2" style={{ marginTop: 26 }}>Package Complete!</h1>
        <p className="l-lede" style={{ margin: "0 auto" }}>
          Hi {pkg.customer_name}, you&apos;ve completed all {pkg.lessons_total} EDT lessons. Well done!
        </p>
        <div className="l-result__actions" style={{ justifyContent: "center" }}>
          <Link href="/contact" className="l-btn l-btn--red l-btn--lg">Book additional lessons</Link>
        </div>
      </section>
    );
  }

  if (needsSecondInstalment) {
    return (
      <section className="l-page l-result" style={{ textAlign: "center" }}>
        <h1 className="l-display l-h2">Ready for lessons 7 to 12?</h1>
        <p className="l-lede" style={{ margin: "0 auto" }}>
          Hi {pkg.customer_name}, you&apos;ve completed your first 6 EDT lessons.
          Pay the second instalment to unlock lessons 7 to 12.
        </p>
        <div className="l-result__actions" style={{ justifyContent: "center", marginTop: 28 }}>
          <button
            onClick={handlePaySecondInstalment}
            disabled={payingSecond}
            className="l-btn l-btn--red l-btn--lg"
          >
            {payingSecond ? "Redirecting to payment…" : "Pay for lessons 7–12"}
          </button>
        </div>
        {secondError && (
          <p className="l-notice l-notice--error" role="alert" style={{ marginTop: 16 }}>{secondError}</p>
        )}
      </section>
    );
  }

  if (booked && bookedSlot) {
    return (
      <section className="l-page l-result">
        <div className="l-result__mark l-result__mark--ok" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <path d="M6 18l7.5 7L28 9" stroke="currentColor" strokeWidth="4.5" />
          </svg>
        </div>
        <h1 className="l-display l-h2">Session booked!</h1>
        <dl className="l-facts">
          <div>
            <dt>When</dt>
            <dd className="l-num">{bookedSlot.date} · {bookedSlot.start_time.slice(0, 5)}–{bookedSlot.end_time.slice(0, 5)}</dd>
          </div>
          <div><dt>Confirmation sent to</dt><dd>{pkg.customer_email}</dd></div>
          <div><dt>Lessons remaining</dt><dd className="l-num">{pkg.remaining - 1} of {pkg.lessons_total}</dd></div>
        </dl>
        <div className="l-result__actions">
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
            className="l-btn l-btn--line l-btn--lg"
          >
            Book another session
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="l-page l-flow">
      <h1 className="l-display l-h2">Book your next EDT session.</h1>
      <p className="l-lede">Hi {pkg.customer_name}, pick an available slot below.</p>

      {/* Package status */}
      <div className="l-counters" style={{ margin: "24px 0" }}>
        <div className="is-key">
          <strong>{pkg.remaining}</strong>
          <span>lessons remaining</span>
        </div>
        <div>
          <strong>{pkg.lessons_used}</strong>
          <span>completed</span>
        </div>
        <div>
          <strong>{pkg.lessons_total}</strong>
          <span>total</span>
        </div>
        <div className="l-counters__wide">
          <span>package expires</span>
          <strong className="l-num">{pkg.expires_at}</strong>
        </div>
      </div>

      {pkg.active_sessions >= 2 && (
        <div className="l-notice" role="status">
          <span>
            You already have {pkg.active_sessions} upcoming session{pkg.active_sessions > 1 ? "s" : ""} scheduled.
            Please attend a session before booking more.
          </span>
        </div>
      )}

      {pkg.active_sessions < 2 && (
        <div className="l-panel">
          <BookingCalendar serviceType={EDT_SLOT_SERVICE_TYPE} onSlotSelected={setSelectedSlot} />
        </div>
      )}

      {selectedSlot && pkg.active_sessions < 2 && (
        <div className="l-selected">
          <div>
            <p>Selected</p>
            <p>
              {format(new Date(selectedSlot.date), "EEEE, d MMMM")} · {selectedSlot.start_time.slice(0, 5)}–{selectedSlot.end_time.slice(0, 5)}
            </p>
          </div>
          <button
            onClick={handleBook}
            disabled={booking}
            className="l-btn l-btn--red"
          >
            {booking ? "Booking…" : "Confirm session"}
          </button>
        </div>
      )}

      {bookError && (
        <div className="l-notice l-notice--error" role="alert" style={{ marginTop: 16 }}>
          {bookError}
        </div>
      )}
    </section>
  );
}
