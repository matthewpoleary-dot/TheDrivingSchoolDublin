// app/prices/page.tsx
import Link from "next/link";
import FAQ from "@/components/FAQ";

export default function PricesPage() {
  return (
    <section className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Prices</h1>

      {/* Top three products */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Standard Lesson */}
        <div className="flex flex-col justify-between h-full border rounded-2xl p-6 bg-white shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">Standard Lesson</h3>
            <p className="text-sm text-gray-600">Manual (instructor&apos;s car) or Automatic (your car)</p>

            <p className="mt-4 text-4xl font-extrabold text-red-600">€80</p>
            <p className="text-sm text-gray-500">per hour / lesson</p>

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
        <div className="flex flex-col justify-between h-full border rounded-2xl p-6 bg-white shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">Pre-Test Lesson</h3>
            <p className="text-sm text-gray-600">Test route familiarisation</p>

            <p className="mt-4 text-4xl font-extrabold text-red-600">€100</p>
            <p className="text-sm text-gray-500">pre-test session</p>

            <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li>Focus on likely test items</li>
              <li>Last-minute refresher & tips</li>
            </ul>
          </div>

          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 transition"
          >
            Contact us
          </Link>
        </div>

        {/* Car Hire for Test (two options fixed) */}
        <div className="flex flex-col justify-between h-full border rounded-2xl p-6 bg-white shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">Car Hire for Test</h3>
            <p className="text-sm text-gray-600">Choose the option that suits you</p>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Option 1</p>
                <p className="mt-1 text-3xl font-extrabold text-red-600">€150</p>
                <p className="text-sm text-gray-700">Meet at the test centre</p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Option 2</p>
                <p className="mt-1 text-3xl font-extrabold text-red-600">€200</p>
                <p className="text-sm text-gray-700">Local pick-up &amp; drop-off</p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Option 3</p>
                <p className="mt-1 text-3xl font-extrabold text-red-600">€245</p>
                <p className="text-sm text-gray-700">Car hire + pre-test lesson</p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li>Roadworthy, fully insured vehicle</li>
              <li>Arrive early, paperwork checked</li>
              <li>Instructor support before & after test</li>
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
        <div className="flex flex-col justify-between h-full border rounded-2xl p-6 bg-white shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">Refresher Lessons</h3>
            <p className="text-sm text-gray-600">Get back behind the wheel with confidence</p>

            <p className="mt-4 text-4xl font-extrabold text-red-600">€80</p>
            <p className="text-sm text-gray-500">per hour / lesson</p>

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
        <div className="flex flex-col justify-between h-full border rounded-2xl p-6 bg-white shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">6 Reduced EDT Lessons</h3>
            <p className="text-sm text-gray-600">For experienced learners</p>

            <p className="mt-4 text-4xl font-extrabold text-red-600">€455</p>
            <p className="text-sm text-gray-500">includes logbook</p>

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

      {/* EDT / bundle row */}
      <div className="mt-8 grid grid-cols-1 gap-6">
        <div className="flex flex-col justify-between h-full border rounded-2xl p-6 bg-white shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">EDT Bundle (12 lessons)</h3>
            <p className="text-sm text-gray-600">Best value</p>

            <p className="mt-4 text-4xl font-extrabold text-red-600">€905</p>
            <p className="text-sm text-gray-500">includes logbook</p>

            <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li>Save vs paying individually</li>
              <li>Split payments:</li>
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

