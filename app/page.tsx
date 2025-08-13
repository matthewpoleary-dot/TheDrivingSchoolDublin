export default function Home() {
  return (
    <section className="grid gap-10 lg:grid-cols-2 items-center">
      {/* Hero copy */}
      <div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
          Book your <span className="text-indigo-600">driving lesson</span> in seconds
        </h1>
        <p className="mt-4 text-gray-600 leading-7">
          Choose a lesson type, pick a time that suits, and you’re set.
          Instant confirmation — no back-and-forth messages.
        </p>

        <div className="mt-8 flex gap-3">
          <a
            href="/book"
            className="inline-flex items-center rounded-lg border border-transparent bg-indigo-600 px-5 py-3 text-white font-medium hover:bg-indigo-700 transition"
          >
            Book now
          </a>
          <a
            href="/prices"
            className="inline-flex items-center rounded-lg border px-5 py-3 font-medium hover:bg-gray-50 transition"
          >
            See prices
          </a>
        </div>

        {/* Quick bullets */}
        <ul className="mt-8 space-y-2 text-sm text-gray-700">
          <li>✓ RSA-approved ADI • Manual & Automatic</li>
          <li>✓ Weekday availability • Flexible times</li>
          <li>✓ Email confirmation & calendar invite</li>
        </ul>
      </div>

      {/* Visual card */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 grid place-items-center">
          <div className="text-center">
            <div className="text-7xl">🚗</div>
            <p className="mt-2 text-sm text-gray-500">Friendly ADI • TheDrivingSchoolDublin</p>
          </div>
        </div>

        {/* Highlights */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="text-2xl">📅</div>
            <h3 className="mt-2 font-semibold">Live availability</h3>
            <p className="mt-1 text-sm text-gray-600">Pick exact times that suit you.</p>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-2xl">⏱️</div>
            <h3 className="mt-2 font-semibold">60–90 min lessons</h3>
            <p className="mt-1 text-sm text-gray-600">Structured, goal-focused sessions.</p>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-2xl">✅</div>
            <h3 className="mt-2 font-semibold">Instant confirm</h3>
            <p className="mt-1 text-sm text-gray-600">Get email confirmation immediately.</p>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="lg:col-span-2 rounded-xl border bg-white p-4 shadow-sm flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
        <span className="font-medium text-gray-800">EDT ready</span>
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
