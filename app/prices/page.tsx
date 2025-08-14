export const metadata = {
  title: "Prices | TheDrivingSchoolDublin",
  description: "Lesson prices, pre-test, car hire and EDT bundle.",
};

export default function PricesPage() {
  return (
    <section className="space-y-10">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Prices</h1>
        <p className="mt-2 text-gray-600">
          Straightforward pricing with no surprises. Book online in seconds.
        </p>
      </header>

      {/* Main grid of products */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Standard Lesson */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Standard Lesson</h3>
          <p className="mt-1 text-sm text-gray-600">Manual or Automatic</p>
          <div className="mt-4">
            <div className="text-3xl font-bold">€65</div>
            <div className="text-sm text-gray-500">per hour / lesson</div>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-gray-700">
            <li>• One-to-one, structured coaching</li>
            <li>• Pick-up in local area</li>
          </ul>
          <a
            href="/book"
            className="mt-6 inline-flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700"
          >
            Book this
          </a>
        </div>

        {/* Pre-Test Lesson */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Pre‑Test Lesson</h3>
          <p className="mt-1 text-sm text-gray-600">Test route familiarisation</p>
          <div className="mt-4">
            <div className="text-3xl font-bold">€80</div>
            <div className="text-sm text-gray-500">pre‑test session</div>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-gray-700">
            <li>• Focus on likely test items</li>
            <li>• Last‑minute refresher & tips</li>
          </ul>
          <a
            href="/book"
            className="mt-6 inline-flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700"
          >
            Book this
          </a>
        </div>

        {/* Car Hire for Test */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Car Hire for Test</h3>
          <p className="mt-1 text-sm text-gray-600">Car provided for test</p>
          <div className="mt-4">
            <div className="text-3xl font-bold">€100</div>
            <div className="text-sm text-gray-500">on test day</div>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-gray-700">
            <li>• Roadworthy, fully insured vehicle</li>
            <li>• Meet at the test centre</li>
          </ul>
          <a
            href="/book"
            className="mt-6 inline-flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700"
          >
            Book this
          </a>
        </div>

        {/* EDT Lessons (per-lesson) */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">EDT Lessons (12)</h3>
          <p className="mt-1 text-sm text-gray-600">Essential Driver Training</p>
          <div className="mt-4">
            <div className="text-3xl font-bold">€65</div>
            <div className="text-sm text-gray-500">per lesson</div>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-gray-700">
            <li>• 12 mandatory modules</li>
            <li>• Logbook: <span className="font-medium">€5</span></li>
          </ul>
          <a
            href="/book"
            className="mt-6 inline-flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700"
          >
            Book EDT lesson
          </a>
        </div>

        {/* EDT Bundle */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm sm:col-span-2">
          <h3 className="text-lg font-semibold">EDT Bundle (12 lessons)</h3>
          <p className="mt-1 text-sm text-gray-600">Best value</p>
          <div className="mt-4">
            <div className="text-3xl font-bold">€705</div>
            <div className="text-sm text-gray-500">includes €5 logbook</div>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-gray-700">
            <li>• Save vs paying individually</li>
            <li>• Split payments:
              <ul className="ml-5 list-disc">
                <li>Pay €355 on the <strong>first</strong> lesson</li>
                <li>Pay €350 on the <strong>7th</strong> lesson</li>
              </ul>
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/book"
              className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700"
            >
              Book bundle
            </a>
            <a
              href="/book"
              className="inline-flex rounded-lg border px-4 py-2 font-medium hover:bg-gray-50"
            >
              Book single EDT lesson
            </a>
          </div>
        </div>
      </div>

      {/* Small note */}
      <p className="text-xs text-gray-500">
        Prices include VAT where applicable. Cancellation policy applies. For questions, use the contact link in the header.
      </p>
    </section>
  );
}
