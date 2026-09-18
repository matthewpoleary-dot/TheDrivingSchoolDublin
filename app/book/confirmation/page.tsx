"use client";
// app/book/confirmation/page.tsx
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "@/components/lton/Icons";

type SessionData = {
  customer_email?: string;
  amount_total?: number;
  metadata?: { service_type?: string; booking_id?: string };
  payment_status?: string;
};

const SERVICE_LABELS: Record<string, string> = {
  standard: "Standard Lesson",
  "pre-test": "Pre-Test Lesson",
  refresher: "Refresher Lesson",
  "edt-6": "6 Reduced EDT Lessons",
  "edt-bundle": "EDT Bundle (12 lessons)",
  "car-hire": "Car Hire for Test",
};

function ConfirmationInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }

    fetch(`/api/checkout/session?id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data: SessionData) => setSession(data))
      .catch(() => setError("Could not load booking details."))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="l-page l-result" style={{ textAlign: "center" }} role="status">
        <p className="l-body">Verifying your booking…</p>
      </div>
    );
  }

  const serviceType = session?.metadata?.service_type;
  const isEdtBundle = serviceType === "edt-bundle" || serviceType === "edt-6";
  const serviceLabel = serviceType ? SERVICE_LABELS[serviceType] ?? serviceType : "Lesson";

  return (
    <section className="l-page l-result">
      <div className="l-result__mark l-result__mark--ok" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <path d="M6 18l7.5 7L28 9" stroke="currentColor" strokeWidth="4.5" />
        </svg>
      </div>
      <h1 className="l-display l-h2">Payment confirmed!</h1>

      <dl className="l-facts">
        <div><dt>Service</dt><dd>{serviceLabel}</dd></div>
        {session?.customer_email && (
          <div><dt>Confirmation sent to</dt><dd>{session.customer_email}</dd></div>
        )}
        {session?.amount_total != null && (
          <div><dt>Amount paid</dt><dd className="l-num">€{(session.amount_total / 100).toFixed(2)}</dd></div>
        )}
      </dl>

      <div className="l-next">
        <h2>What happens next:</h2>
        {isEdtBundle ? (
          <ol>
            <li>Check your email. You&apos;ll receive a personal booking link.</li>
            <li>Use that link to book your first session at any time.</li>
            <li>You can book up to 2 sessions in advance.</li>
            <li>Your package is valid for 12 months from today.</li>
          </ol>
        ) : (
          <ol>
            <li>You&apos;ll receive a confirmation email with your lesson details.</li>
            <li>The instructor will contact you if anything needs confirming.</li>
            <li>Please arrive 5 minutes early on the day.</li>
          </ol>
        )}
      </div>

      {error && <p className="l-notice l-notice--error" role="alert" style={{ marginTop: 20 }}>{error}</p>}

      <div className="l-result__actions">
        <Link href="/" className="l-btn l-btn--red l-btn--lg">
          Back to home <ArrowRight />
        </Link>
        <Link href="/prices" className="l-btn l-btn--line l-btn--lg">
          View all prices
        </Link>
      </div>
    </section>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="l-page l-result" style={{ textAlign: "center" }}>
        <p className="l-body">Loading…</p>
      </div>
    }>
      <ConfirmationInner />
    </Suspense>
  );
}
