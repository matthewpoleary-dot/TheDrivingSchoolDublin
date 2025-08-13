// app/page.tsx
import Link from "next/link";

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="currentColor">
      <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.5A2.5 2.5 0 0 1 22 6.5v13A2.5 2.5 0 0 1 19.5 22h-15A2.5 2.5 0 0 1 2 19.5v-13A2.5 2.5 0 0 1 4.5 4H6V3a1 1 0 0 1 1-1Zm12 8H5v9.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5V10Zm-1.5-4H19.5a.5.5 0 0 1 .5.5V8H4V6.5a.5.5 0 0 1 .5-.5H6v1a1 1 0 1 0 2 0V6h8v1a1 1 0 1 0 2 0V6Z"/>
    </svg>
  );
}
function IconTimer() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="currentColor">
      <path d="M9 2h6v2H9zM12 6a8 8 0 1 1-8 8 8.009 8.009 0 0 1 8-8zm0 2a6 6 0 1 0 6 6 6.007 6.007 0 0 0-6-6zm1 1h-2v5l4 2 1-1.732-3-1.5z"/>
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="currentColor">
      <path d="M20.285 6.707a1 1 0 0 1 0 1.414l-9.9 9.9a1 1 0 0 1-1.414 0l-5.257-5.257a1 1 0 1 1 1.414-1.414l4.55 4.55 9.193-9.193a1 1 0 0 1 1.414 0Z"/>
    </svg>
  );
}
function CarVisual() {
  return (
    <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-red-50 to-gray-50 grid place-items-center">
      <svg viewBox="0 0 420 180" className="w-[84%] max-w-[520px]" aria-hidden="true">
        <rect x="0" y="30" width="420" height="120" rx="16" fill="#ffffff" stroke="#e5e7eb" />
        <rect x="70" y="70" width="210" height="50" rx="12" fill="#111827" />
        <rect x="90" y="60" width="140" height="35" rx="8" fill="#d90429" />
        <circle cx="110" cy="130" r="16" fill="#111827" />
        <circle cx="230" cy="130" r="16" fill="#111827" />
        <rect x="240" y="70" width="90" height="24" rx="6" fill="#e5e7eb" />
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <section className="grid gap-10 lg:grid-cols-2 items-center">
      {/* Hero copy */}
      <div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
          Book your <span className="text-red-600">driving lesson</span> in seconds
        </h1>
        <p className="mt-4 text-gray-700 leading-7">
          Choose a lesson type, pick a time that suits, and you’re set.
          Instant confirmation — no back-and-forth messages.
        </p>

        <div className="mt-8 flex gap-3">
          <Link href="/book" className="btn-primary">Book now</Link>
          <Link href="/prices" className="btn-outline">See prices</Link>
        </div>

        {/* Quick bullets */}
        <ul className="mt-8 space-y-2 text-sm text-gray-800">
          <li>✓ RSA-approved ADI • Manual & Automatic</li>
          <li>✓ Weekday availability • Flexible times</li>
          <li>✓ Email confirmation & calendar invite</li>
        </ul>
      </div>

      {/* Visual card */}
      <div className="card">
        <CarVisual />

        {/* Highlights */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="kpi">
            <span className="icon-bubble"><IconCalendar /></span>
            <h3 className="kpi-title">Live availability</h3>
            <p className="kpi-sub">Pick exact times that suit you.</p>
          </div>
          <div className="kpi">
            <span className="icon-bubble"><IconTimer /></span>
            <h3 className="kpi-title">60–90 min lessons</h3>
            <p className="kpi-sub">Structured, goal-focused sessions.</p>
          </div>
          <div className="kpi">
            <span className="icon-bubble"><IconCheck /></span>
            <h3 className="kpi-title">Instant confirm</h3>
            <p className="kpi-sub">Email + calendar invite.</p>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="lg:col-span-2 section-soft flex flex-wrap items-center justify-center gap-6 text-sm text-gray-700">
        <span className="font-medium text-gray-900">EDT ready</span>
        <span>•</span>
        <span>Pick-up in local area</span>
        <span>•</span>
        <span>Test-route familiarisation</span>
        <span>•</span>
        <span>Gift vouchers available</span>
      </div>
    </section>
  );
}
