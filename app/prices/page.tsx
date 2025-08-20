// app/prices/page.tsx
import Link from "next/link";

type Service = {
  id: string;
  name: string;
  duration_minutes: number | null;
  price_cents: number;
  active?: boolean;
};

// Helper to format euro
function euros(cents: number) {
  return `€${(cents / 100).toFixed(0)}`;
}

// Try to find a service by fuzzy name (case-insensitive, simple includes)
function findByName(services: Service[], needle: string) {
  const n = needle.toLowerCase();
  return services.find((s) => s.name.toLowerCase().includes(n));
}

// Prefer “1 hour” standard lesson and exclude “60m” variant
function pickStandard(services: Service[]) {
  const stdHour = services.find(
    (s) =>
      s.name.toLowerCase().includes("standard") &&
      s.name.toLowerCase().includes("1 hour")
  );
  if (stdHour) return stdHour;

  // Fallback: any “standard lesson” that is not explicitly “60m”
  const std = services.find(
    (s) =>
      s.name.toLowerCase().includes("standard") &&
      !s.name.toLowerCase().includes("60m")
  );
  return std ?? services.find((s) => s.name.toLowerCase().includes("standard"));
}

export default async function PricesPage() {
  // Pull services from your API at runtime (server component)
  let services: Service[] = [];
  try {
    // Works in Vercel and locally because it’s a relative URL in the same app
    const res = await fetch(`${process.env.APP_ORIGIN ?? ""}/api/services`, {
      cache: "no-store",
    });
    services = (await res.json()) ?? [];
  } catch {
    services = [];
  }

  // Filter out “Motorway” or any unwanted extras
  services = services.filter(
    (s) => !s.name.toLowerCase().includes("motorway")
  );

  const standard = pickStandard(services);
  const pretest = findByName(services, "pre-test");
  const carHire = services.find((s) =>
    /car.*test|hire.*test/i.test(s.name)
  );

  // Contact for all enquiries; booking is no longer available online

  return (
    <section className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">
        Prices
      </h1>

      {/* Top three products */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Standard Lesson */}
        <div className="flex flex-col justify-between h-full border rounded-2xl p-6 bg-white shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">Standard Lesson</h3>
            <p className="text-sm text-gray-600">Manual or Automatic</p>

            <p className="mt-4 text-4xl font-extrabold text-red-600">
              {standard ? euros(standard.price_cents) : "€65"}
            </p>
            <p className="text-sm text-gray-500">per hour / lesson</p>

            <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li>One-to-one, structured coaching</li>
              <li>Pick-up in local area</li>
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

            <p className="mt-4 text-4xl font-extrabold text-red-600">
              {pretest ? euros(pretest.price_cents) : "€80"}
            </p>
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

        {/* Car Hire for Test */}
        <div className="flex flex-col justify-between h-full border rounded-2xl p-6 bg-white shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">Car Hire for Test</h3>
            <p className="text-sm text-gray-600">Car provided for test</p>

            <p className="mt-4 text-4xl font-extrabold text-red-600">
              {carHire ? euros(carHire.price_cents) : "€100"}
            </p>
            <p className="text-sm text-gray-500">on test day</p>

            <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li>Roadworthy, fully insured vehicle</li>
              <li>Meet at the test centre</li>
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
            <h3 className="text-lg font-semibold">
              EDT Bundle (12 lessons)
            </h3>
            <p className="text-sm text-gray-600">Best value</p>

            <p className="mt-4 text-4xl font-extrabold text-red-600">€705</p>
            <p className="text-sm text-gray-500">includes €5 logbook</p>

            <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li>Save vs paying individually</li>
              <li>Split payments:</li>
              <li className="ml-4">
                Pay <strong>€355</strong> on the <strong>first</strong> lesson
              </li>
              <li className="ml-4">
                Pay <strong>€350</strong> on the <strong>7th</strong> lesson
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
              Ask about a single EDT lesson
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-600">
        Prices include VAT where applicable. For questions, use the contact link in the header.
      </p>
    </section>
  );
}
