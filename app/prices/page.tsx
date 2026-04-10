// app/prices/page.tsx
import Link from "next/link";
import FAQ from "@/components/FAQ";

function DayPricing({
  mf,
  sat,
  sun,
  sublabel,
}: {
  mf: string;
  sat: string;
  sun: string;
  sublabel?: string;
}) {
  const isNA = (v: string) => v === "N/A";
  return (
    <div className="mt-4">
      <div className="grid grid-cols-3 divide-x rounded-xl border overflow-hidden text-sm text-center">
        <div className="py-3 px-2 bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">Mon–Fri</p>
          <p className="text-xl font-extrabold text-red-600">{mf}</p>
        </div>
        <div className="py-3 px-2 bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">Saturday</p>
          <p className={`text-xl font-extrabold ${isNA(sat) ? "text-gray-400" : "text-red-600"}`}>{sat}</p>
        </div>
        <div className="py-3 px-2 bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">Sunday</p>
          <p className={`text-xl font-extrabold ${isNA(sun) ? "text-gray-400" : "text-red-600"}`}>{sun}</p>
        </div>
      </div>
      {sublabel && <p className="mt-1 text-xs text-center text-gray-500">{sublabel}</p>}
    </div>
  );
}

export default function PricesPage() {
  return (
    <section className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Prices</h1>

      {/* Top three products */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Standard Lesson */}
        <div className="flex flex-col h-full border rounded-2xl p-6 bg-white shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">Standard Lesson</h3>
            <p className="text-sm text-gray-600">Manual (instructor&apos;s car) or Automatic (your car)</p>

            <DayPricing mf="€80" sat="€120" sun="€160" sublabel="per hour / lesson" />

            <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li>One-to-one, structured coaching</li>
              <li>Manual: dual-control instructor car</li>
              <li>Automatic: use your own car</li>
            </ul>
          </div>

          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 transition"
          >
            Contact us
          </Link>
        </div>

        {/* Pre-Test Lesson */}
        <div className="flex flex-col h-full border rounded-2xl p-6 bg-white shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">Pre-Test Lesson</h3>
            <p className="text-sm text-gray-600">Test route familiarisation</p>

            <DayPricing mf="€100" sat="€150" sun="€200" sublabel="per pre-test session" />

            <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li>Focus on likely test items</li>
              <li>Last-minute refresher &amp; tips</li>
            </ul>
          </div>

          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 transition"
          >
            Contact us
          </Link>
        </div>

        {/* Car Hire for Test */}
        <div className="flex flex-col h-full border rounded-2xl p-6 bg-white shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">Car Hire for Test</h3>
            <p className="text-sm text-gray-600">Choose the option that suits you</p>

            <div className="mt-4 space-y-3">
              {[
                { opt: "1", desc: "Meet at the test centre", mf: "€150", sat: "€225" },
                { opt: "2", desc: "Local pick-up & drop-off", mf: "€200", sat: "€300" },
                { opt: "3", desc: "Car hire + pre-test lesson", mf: "€245", sat: "€368" },
              ].map(({ opt, desc, mf, sat }) => (
                <div key={opt} className="rounded-xl border p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Option {opt}</p>
                  <p className="text-sm text-gray-700 mb-2">{desc}</p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Mon–Fri</p>
                      <p className="text-2xl font-extrabold text-red-600">{mf}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Saturday</p>
                      <p className="text-2xl font-extrabold text-red-600">{sat}</p>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-center text-gray-400">Not available on Sundays</p>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li>Roadworthy, fully insured vehicle</li>
              <li>Arrive early, paperwork checked</li>
              <li>Instructor support before &amp; after test</li>
            </ul>
          </div>

          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 transition"
          >
            Contact us
          </Link>
        </div>
      </div>

      {/* Refresher & 6 Reduced EDT row */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Refresher Lessons */}
        <div className="flex flex-col h-full border rounded-2xl p-6 bg-white shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">Refresher Lessons</h3>
            <p className="text-sm text-gray-600">Get back behind the wheel with confidence</p>

            <DayPricing mf="€80" sat="€120" sun="€160" sublabel="per hour / lesson" />

            <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li>Ideal for returning drivers</li>
              <li>Build confidence at your pace</li>
              <li>Tailored to your needs</li>
            </ul>
          </div>

          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 transition"
          >
            Contact us
          </Link>
        </div>

        {/* 6 Reduced EDT Lessons */}
        <div className="flex flex-col h-full border rounded-2xl p-6 bg-white shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">6 Reduced EDT Lessons</h3>
            <p className="text-sm text-gray-600">For experienced learners</p>

            <DayPricing mf="€455" sat="€683" sun="€910" sublabel="includes logbook" />

            <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li>6 structured EDT lessons</li>
              <li>Logbook included</li>
              <li>For those with prior experience</li>
            </ul>
          </div>

          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 transition"
          >
            Contact us
          </Link>
        </div>
      </div>

      {/* EDT Bundle row */}
      <div className="mt-8 grid grid-cols-1 gap-6">
        <div className="flex flex-col h-full border rounded-2xl p-6 bg-white shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">EDT Bundle (12 lessons)</h3>
            <p className="text-sm text-gray-600">Best value</p>

            <DayPricing mf="€905" sat="€1,358" sun="€1,810" sublabel="includes logbook" />

            <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li>Save vs paying individually</li>
              <li>Split payments (Mon–Fri):</li>
              <li className="ml-4">
                Pay <strong>€455</strong> on the <strong>first</strong> lesson
              </li>
              <li className="ml-4">
                Pay <strong>€450</strong> on the <strong>7th</strong> lesson
              </li>
            </ul>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 transition"
            >
              Contact us about bundle
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border px-5 py-3 font-medium hover:bg-gray-50 transition"
            >
              Contact us about single EDT lesson
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-600">
        Prices include VAT where applicable. For questions, use the contact link in the header.
      </p>

      {/* FAQ Section */}
      <div className="mt-16">
        <FAQ />
      </div>

      {/* CTA Section */}
      <div className="mt-12 rounded-2xl border bg-gradient-to-br from-red-50 to-gray-50 p-8 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight mb-4">Ready to book your lesson?</h2>
        <p className="text-gray-700 mb-6">
          Contact us today and we&apos;ll get back to you the same day.
        </p>
        <Link href="/contact" className="btn-primary">
          Contact us
        </Link>
      </div>
    </section>
  );
}
