import Link from "next/link";
import FAQ from "@/components/FAQ";

export const metadata = {
  title: "Prices | The Driving School Dublin",
  description: "Clear, transparent pricing for driving lessons in Dublin. Standard lessons, EDT bundles, pre-test sessions, and car hire for your test.",
};

const PRICING_CARDS = [
  {
    name: "Standard Lesson",
    price: "€80",
    per: "per hour",
    desc: "Manual (instructor's car) or Automatic (your car)",
    features: [
      "One-to-one structured coaching",
      "Manual: dual-control instructor car",
      "Automatic: use your own car",
    ],
  },
  {
    name: "Pre-Test Lesson",
    price: "€100",
    per: "per session",
    desc: "90-minute test route familiarisation",
    features: [
      "Focus on likely test items",
      "Last-minute refresher & tips",
      "Examiner insights",
    ],
  },
  {
    name: "Refresher Lessons",
    price: "€80",
    per: "per hour",
    desc: "Get back behind the wheel with confidence",
    features: [
      "Ideal for returning drivers",
      "Build confidence at your pace",
      "Tailored to your needs",
    ],
  },
];

const CAR_HIRE_OPTIONS = [
  { label: "Meet at test centre", price: "€150" },
  { label: "Local pick-up & drop-off", price: "€200" },
  { label: "Car hire + pre-test lesson", price: "€245" },
];

export default function PricesPage() {
  return (
    <section className="space-y-16">
      {/* Header */}
      <div className="space-y-2">
        <p className="section-label">Pricing</p>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Prices</h1>
        <p className="text-gray-500">Clear, upfront costs — no hidden fees.</p>
      </div>

      {/* Main lesson cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {PRICING_CARDS.map((card) => (
          <div key={card.name} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4">
            <div>
              <p className="font-semibold text-gray-900">{card.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.desc}</p>
              <p className="mt-4 text-4xl font-bold text-gray-900">{card.price}</p>
              <p className="text-sm text-gray-500">{card.per}</p>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-600">
              {card.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 shrink-0 text-red-600" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0Z" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/contact" className="btn-primary mt-auto">Contact us</Link>
          </div>
        ))}
      </div>

      {/* Car hire */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="font-semibold text-gray-900 mb-1">Car Hire for Test Day</p>
        <p className="text-sm text-gray-500 mb-5">Roadworthy, fully insured vehicle. We arrive early, check paperwork, and support you before & after.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {CAR_HIRE_OPTIONS.map((opt) => (
            <div key={opt.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-2xl font-bold text-gray-900">{opt.price}</p>
              <p className="text-sm text-gray-600 mt-1">{opt.label}</p>
            </div>
          ))}
        </div>
        <Link href="/contact" className="btn-primary mt-5 w-full sm:w-auto">Book car hire</Link>
      </div>

      {/* EDT bundle */}
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm relative">
        <span className="absolute -top-3 left-6 rounded-full bg-red-600 px-3 py-0.5 text-xs font-semibold text-white">Best value</span>
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-semibold text-gray-900">EDT Bundle — 12 lessons</p>
            <p className="text-4xl font-bold text-gray-900 mt-3">€905</p>
            <p className="text-sm text-gray-500 mt-0.5">includes logbook</p>
            <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <svg className="h-3.5 w-3.5 shrink-0 text-red-600" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0Z" /></svg>
                Save vs paying individually
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-3.5 w-3.5 shrink-0 text-red-600" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0Z" /></svg>
                Split payments available
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-3.5 w-3.5 shrink-0 text-red-600" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0Z" /></svg>
                Logbook included
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-red-200 bg-white p-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900 mb-1">Split payment plan</p>
              <p>Pay <strong>€455</strong> on your <strong>1st</strong> lesson</p>
              <p>Pay <strong>€450</strong> on your <strong>7th</strong> lesson</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900 mb-1">6 Reduced EDT Lessons</p>
              <p>For experienced learners — <strong>€455</strong> including logbook</p>
            </div>
            <Link href="/contact" className="btn-primary block text-center">Get started with EDT</Link>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-400">Prices include VAT where applicable. Questions? Use the contact link above.</p>

      {/* FAQ */}
      <FAQ />

      {/* CTA */}
      <div className="rounded-2xl bg-gray-900 px-8 py-12 text-center text-white">
        <h2 className="text-2xl font-bold tracking-tight">Ready to book your lesson?</h2>
        <p className="mt-2 text-gray-400 text-sm">We get back to you the same day.</p>
        <Link href="/contact" className="btn-primary mt-6">Contact us</Link>
      </div>
    </section>
  );
}
