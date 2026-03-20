import Link from "next/link";

const PLANS = [
  {
    name: "Standard Lesson",
    price: "€80",
    per: "per hour",
    features: ["Manual (instructor's car)", "Automatic (your car)", "One-to-one coaching"],
    highlight: false,
  },
  {
    name: "EDT Bundle",
    price: "€905",
    per: "12 lessons",
    features: ["Best value package", "Split payment option", "Logbook included"],
    highlight: true,
  },
  {
    name: "Pre-Test Lesson",
    price: "€100",
    per: "per session",
    features: ["Test route familiarisation", "Last-minute tips", "Examiner insights"],
    highlight: false,
  },
];

export default function PricingPreview() {
  return (
    <section className="space-y-8">
      <div className="text-center space-y-2">
        <p className="section-label">Pricing</p>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Transparent pricing</h2>
        <p className="text-gray-500 text-sm">Clear, upfront costs — no hidden fees</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border p-6 shadow-sm flex flex-col gap-4 ${
              plan.highlight
                ? "border-red-200 bg-red-50"
                : "border-gray-100 bg-white"
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-3 py-0.5 text-xs font-semibold text-white">
                Best value
              </span>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
              <p className="mt-2 text-4xl font-bold text-gray-900">{plan.price}</p>
              <p className="text-sm text-gray-500">{plan.per}</p>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-600">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 shrink-0 text-red-600" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0Z" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link href="/prices" className="btn-outline">View all prices →</Link>
      </div>
    </section>
  );
}
