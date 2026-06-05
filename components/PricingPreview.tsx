// components/PricingPreview.tsx
import Link from "next/link";
import Check from "@/components/icons/Check";

type Plan = {
  name: string;
  service: string;
  price: string;
  unit: string;
  features: string[];
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Standard Lesson",
    service: "standard",
    price: "€80",
    unit: "per hour",
    features: ["Manual (instructor's car)", "Automatic (your car)", "One-to-one coaching"],
  },
  {
    name: "EDT Bundle",
    service: "edt-bundle",
    price: "€905",
    unit: "12 lessons · €75/hr",
    features: ["Best-value full EDT package", "Personal booking link", "Valid for 12 months"],
    featured: true,
  },
  {
    name: "Pre-Test Lesson",
    service: "pre-test",
    price: "€100",
    unit: "per session",
    features: ["Test route familiarisation", "Last-minute tips", "Examiner insights"],
  },
];

export default function PricingPreview() {
  return (
    <section className="space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-red-600 uppercase tracking-wider">Pricing</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Transparent, no-surprises pricing
        </h2>
        <p className="text-base text-slate-600">
          Clear hourly rates and package deals — pay securely online.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 md:gap-5 lg:gap-6 items-stretch">
        {PLANS.map((plan) => (
          <div
            key={plan.service}
            className={`relative flex flex-col rounded-2xl bg-white p-7 lg:p-8 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
              plan.featured ? "ring-2 ring-red-600 md:scale-105 md:-my-2" : "ring-1 ring-slate-100"
            }`}
          >
            {plan.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1 shadow-md">
                Most popular
              </span>
            )}

            <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-4xl lg:text-5xl font-extrabold text-slate-900">{plan.price}</span>
              <span className="text-sm text-slate-500">{plan.unit}</span>
            </div>

            <ul className="mt-6 space-y-3 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`/book?service=${plan.service}`}
              className={`mt-8 ${plan.featured ? "btn-primary" : "btn-outline"} w-full`}
            >
              Book {plan.featured ? "this package" : "now"}
            </Link>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link href="/prices" className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700">
          See all pricing options
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
