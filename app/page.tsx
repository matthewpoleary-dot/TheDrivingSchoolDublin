// app/page.tsx
import Link from "next/link";
import Image from "next/image";

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="currentColor">
      <path d="M20.285 6.707a1 1 0 0 1 0 1.414l-9.9 9.9a1 1 0 0 1-1.414 0l-5.257-5.257a1 1 0 1 1 1.414-1.414l4.55 4.55 9.193-9.193a1 1 0 0 1 1.414 0Z"/>
    </svg>
  );
}

function LogoVisual() {
  return (
    <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-red-50 to-gray-50 grid place-items-center">
      <Image
        src="/Logo.jpg"
        alt="The Driving School Dublin Logo"
        width={400}
        height={400}
        priority
        className="rounded-lg"
      />
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
          Online booking is <strong>coming soon</strong>. For now, contact us to arrange a
          lesson time that suits you.
        </p>

        <div className="mt-8 flex gap-3">
          <Link href="/contact" className="btn-primary">Contact us</Link>
          <Link href="/prices" className="btn-outline">See prices</Link>
        </div>

        {/* Quick bullets */}
        <ul className="mt-8 space-y-2 text-sm text-gray-800">
          <li>✓ RSA‑approved ADI • Manual & Automatic</li>
          <li>✓ Flexible weekday & evening slots</li>
          <li>✓ EDT programmes • Pre‑test specialists</li>
        </ul>
      </div>

      {/* Visual card */}
      <div className="card">
        <LogoVisual />

        {/* Highlights (updated to non-booking messaging) */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="kpi">
            <span className="icon-bubble"><IconCheck /></span>
            <h3 className="kpi-title">RSA‑approved ADIs</h3>
            <p className="kpi-sub">Qualified, experienced instructors.</p>
          </div>
          <div className="kpi">
            <span className="icon-bubble"><IconCheck /></span>
            <h3 className="kpi-title">Pre‑test specialists</h3>
            <p className="kpi-sub">Tallaght, Dún Laoghaire & Churchtown routes.</p>
          </div>
          <div className="kpi">
            <span className="icon-bubble"><IconCheck /></span>
            <h3 className="kpi-title">Flexible scheduling</h3>
            <p className="kpi-sub">Weekday & evening lessons available.</p>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="lg:col-span-2 section-soft flex flex-wrap items-center justify-center gap-6 text-sm text-gray-700">
        <span className="font-medium text-gray-900">EDT ready</span>
        <span>•</span>
        <span>Pick‑up in local area</span>
        <span>•</span>
        <span>Test‑route familiarisation</span>
        <span>•</span>
        <span>Gift vouchers available</span>
      </div>
    </section>
  );
}
