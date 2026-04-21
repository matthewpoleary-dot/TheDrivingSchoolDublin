// app/prices/page.tsx
// Weekend prices have been moved off-page by design and are handled during
// the contact conversation — do not restore them thinking it's a bug.
import Link from "next/link";
import FAQ from "@/components/FAQ";

export default function PricesPage() {
  return (
    <section className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Prices</h1>

      {/* Standard + Pre-Test side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Standard Lesson */}
        <div className="flex flex-col border rounded-2xl p-6 bg-white shadow-sm">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Standard Lesson</h3>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-red-600">€80 / hour</p>
              <p className="text-sm text-gray-500 mt-1">Monday to Friday</p>
            </div>
            <p className="mt-3 text-sm text-gray-700">One-to-one tuition in a fully-equipped dual-control car.</p>
            <p className="mt-3 text-xs text-gray-500">Evening &amp; weekend slots available on request — limited availability.</p>
          </div>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 transition"
          >
            Contact us
          </Link>
        </div>

        {/* Pre-Test Lesson */}
        <div className="flex flex-col border rounded-2xl p-6 bg-white shadow-sm">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Pre-Test Lesson</h3>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-red-600">€100 per session</p>
              <p className="text-sm text-gray-500 mt-1">Monday to Friday</p>
            </div>
            <p className="mt-3 text-sm text-gray-700">Full pre-test preparation: mock test route, manoeuvres, and examiner feedback style.</p>
            <p className="mt-3 text-xs text-gray-500">Weekend sessions on request — subject to availability.</p>
          </div>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 transition"
          >
            Contact us
          </Link>
        </div>
      </div>

      {/* Car Hire for Test — full width */}
      <div className="mt-6 border rounded-2xl p-6 bg-white shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Car Hire for Test</h3>
          <p className="text-sm text-gray-500 mt-1">Priced for Monday–Friday tests. Saturday test dates on request. Not available Sundays.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { opt: "1", desc: "At the test centre", price: "from €150" },
            { opt: "2", desc: "Local pickup & drop-off", price: "from €200" },
            { opt: "3", desc: "Car hire + pre-test lesson", price: "from €245" },
          ].map(({ opt, desc, price }) => (
            <div key={opt} className="rounded-xl border p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Option {opt}</p>
              <p className="text-sm text-gray-700 mb-3">{desc}</p>
              <p className="text-2xl font-extrabold text-red-600">{price}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm text-gray-700 list-disc list-inside">
          <li>Roadworthy, fully insured vehicle</li>
          <li>Arrive early, paperwork checked</li>
          <li>Instructor support before &amp; after test</li>
        </ul>
        <Link
          href="/contact"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 transition w-full"
        >
          Contact us
        </Link>
      </div>

      {/* Refresher & 6 Reduced EDT row */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Refresher Lessons */}
        <div className="flex flex-col border rounded-2xl p-6 bg-white shadow-sm">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Refresher Lessons</h3>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-red-600">€80 / hour</p>
              <p className="text-sm text-gray-500 mt-1">Monday to Friday</p>
            </div>
            <p className="mt-3 text-sm text-gray-700">For licensed drivers returning to the wheel after a break.</p>
            <p className="mt-3 text-xs text-gray-500">Weekend slots on request.</p>
          </div>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 transition"
          >
            Contact us
          </Link>
        </div>

        {/* 6 Reduced EDT Lessons */}
        <div className="flex flex-col border rounded-2xl p-6 bg-white shadow-sm">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">6 Reduced EDT Lessons</h3>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-red-600">€455</p>
              <p className="text-sm text-gray-500 mt-1">Monday to Friday</p>
            </div>
            <p className="mt-3 text-sm text-gray-700">Completes the reduced EDT syllabus over six structured hours.</p>
            <p className="mt-3 text-xs text-gray-500">Weekend scheduling available on request.</p>
          </div>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 transition"
          >
            Contact us
          </Link>
        </div>
      </div>

      {/* EDT Bundle — full width */}
      <div className="mt-8">
        <div className="flex flex-col border rounded-2xl p-6 bg-white shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-semibold">EDT Bundle (12 lessons)</h3>
              <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Most popular</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-red-600">€905</p>
              <p className="text-sm text-gray-500 mt-1">Monday to Friday</p>
            </div>
            <p className="mt-3 text-sm text-gray-700">Our most popular package for learners completing full EDT.</p>
            <p className="mt-2 text-sm font-medium text-gray-700">Works out at €75.42 per hour — cheaper than booking hourly.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li>Split payments available (Mon–Fri):</li>
              <li className="ml-4">
                Pay <strong>€455</strong> on the <strong>first</strong> lesson
              </li>
              <li className="ml-4">
                Pay <strong>€450</strong> on the <strong>7th</strong> lesson
              </li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">Weekend scheduling available on request.</p>
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
