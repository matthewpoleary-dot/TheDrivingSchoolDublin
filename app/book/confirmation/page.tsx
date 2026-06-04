"use client";
// app/book/confirmation/page.tsx
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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
      <div className="mx-auto max-w-xl text-center py-16">
        <p className="text-gray-500">Verifying your booking…</p>
      </div>
    );
  }

  const serviceType = session?.metadata?.service_type;
  const isEdtBundle = serviceType === "edt-bundle" || serviceType === "edt-6";
  const serviceLabel = serviceType ? SERVICE_LABELS[serviceType] ?? serviceType : "Lesson";

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h1 className="text-2xl font-extrabold tracking-tight text-green-900">Payment confirmed!</h1>

        <div className="space-y-1 text-sm text-green-800">
          <p><span className="font-semibold">Service:</span> {serviceLabel}</p>
          {session?.customer_email && (
            <p><span className="font-semibold">Confirmation sent to:</span> {session.customer_email}</p>
          )}
          {session?.amount_total != null && (
            <p><span className="font-semibold">Amount paid:</span> €{(session.amount_total / 100).toFixed(2)}</p>
          )}
        </div>

        {isEdtBundle ? (
          <div className="rounded-xl bg-white border border-green-200 p-4 text-sm text-left text-green-900 space-y-2">
            <p className="font-semibold">What happens next:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Check your email — you&apos;ll receive a personal booking link.</li>
              <li>Use that link to book your first session at any time.</li>
              <li>You can book up to 2 sessions in advance.</li>
              <li>Your package is valid for 12 months from today.</li>
            </ol>
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-green-200 p-4 text-sm text-left text-green-900 space-y-2">
            <p className="font-semibold">What happens next:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>You&apos;ll receive a confirmation email with your lesson details.</li>
              <li>The instructor will contact you if anything needs confirming.</li>
              <li>Please arrive 5 minutes early on the day.</li>
            </ol>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/" className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition">
          Back to home
        </Link>
        <Link href="/prices" className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-gray-50 transition">
          View all prices
        </Link>
      </div>
    </section>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    }>
      <ConfirmationInner />
    </Suspense>
  );
}
