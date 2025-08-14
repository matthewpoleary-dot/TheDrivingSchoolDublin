// app/prices/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

// Shape returned by /api/services
type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  active?: boolean;
};

// Helper to find a service ID by fuzzy name
function findServiceId(services: Service[], keys: string[]): string | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const svc = services.find((s) => {
    const n = norm(s.name);
    return keys.some((k) => n.includes(norm(k)));
  });
  return svc?.id;
}

// Builds a booking link. Falls back to /book if we don't find the service.
function bookingHref(serviceId?: string) {
  return serviceId ? `/book?serviceId=${encodeURIComponent(serviceId)}` : "/book";
}

export default function PricesPage() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/services", { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data)) setServices(data);
      } catch {
        // ignore; page still renders with plain /book links
      }
    })();
  }, []);

  // Resolve service IDs dynamically (so buttons deep-link to /book preselected)
  const standardId = useMemo(
    () => findServiceId(services, ["standard lesson", "60m", "standard"]),
    [services]
  );

  const pretestId = useMemo(
    () => findServiceId(services, ["pre-test", "pre test", "pretest"]),
    [services]
  );

  const carHireId = useMemo(
    () => findServiceId(services, ["car hire", "car for test"]),
    [services]
  );

  const edtBundleId = useMemo(
    () => findServiceId(services, ["edt bundle", "12 lessons", "edt (12)"]),
    [services]
  );

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-center text-black">
        Prices & Packages
      </h1>
      <p className="text-center text-gray-700 mt-2">
        Clear, simple pricing. Secure booking with instant email confirmation.
      </p>

      {/* Top row — 3 products */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        {/* Standard Lesson */}
        <article className="border border-black rounded-2xl bg-white shadow-sm p-6 flex flex-col">
          <h2 className="text-xl font-bold text-black">Standard Lesson</h2>
          <p className="text-sm text-gray-700">Manual or Automatic</p>

          <div className="mt-3">
            <div className="text-4xl font-extrabold text-red-600 leading-none">€65</div>
            <div className="text-sm text-gray-700">per hour / lesson</div>
          </div>

          <ul className="mt-4 list-disc list-inside text-gray-800 space-y-1">
            <li>One-to-one, structured coaching</li>
            <li>Pick-up in local area</li>
          </ul>

          <a
            href={bookingHref(standardId)}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-white font-semibold hover:bg-black transition"
          >
            Book this
          </a>
        </article>

        {/* Pre-Test Lesson */}
        <article className="border border-black rounded-2xl bg-white shadow-sm p-6 flex flex-col">
          <h2 className="text-xl font-bold text-black">Pre-Test Lesson</h2>
          <p className="text-sm text-gray-700">Test route familiarisation</p>

          <div className="mt-3">
            <div className="text-4xl font-extrabold text-red-600 leading-none">€80</div>
            <div className="text-sm text-gray-700">pre-test session</div>
          </div>

          <ul className="mt-4 list-disc list-inside text-gray-800 space-y-1">
            <li>Focus on likely test items</li>
            <li>Last-minute refresher & tips</li>
          </ul>

          <a
            href={bookingHref(pretestId)}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-white font-semibold hover:bg-black transition"
          >
            Book this
          </a>
        </article>

        {/* Car Hire for Test */}
        <article className="border border-black rounded-2xl bg-white shadow-sm p-6 flex flex-col">
          <h2 className="text-xl font-bold text-black">Car Hire for Test</h2>
          <p className="text-sm text-gray-700">Car provided for test</p>

          <div className="mt-3">
            <div className="text-4xl font-extrabold text-red-600 leading-none">€100</div>
            <div className="text-sm text-gray-700">on test day</div>
          </div>

          <ul className="mt-4 list-disc list-inside text-gray-800 space-y-1">
            <li>Roadworthy, fully insured vehicle</li>
            <li>Meet at the test centre</li>
          </ul>

          <a
            href={bookingHref(carHireId)}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-white font-semibold hover:bg-black transition"
          >
            Book this
          </a>
        </article>
      </div>

      {/* EDT Bundle */}
      <section className="mt-8 border border-black rounded-2xl bg-white shadow-sm p-6">
        <h2 className="text-xl font-bold text-black">EDT Bundle (12 lessons)</h2>
        <p className="text-sm text-gray-700">Best value</p>

        <div className="mt-3">
          <div className="text-4xl font-extrabold text-red-600 leading-none">€705</div>
          <div className="text-sm text-gray-700">includes €5 logbook</div>
        </div>

        <ul className="mt-4 list-disc list-inside text-gray-800 space-y-1">
          <li>Save vs paying individually</li>
          <li>
            Split payments:
            <ul className="list-disc list-inside ml-4">
              <li>
                Pay <strong>€355</strong> on the <strong>first</strong> lesson
              </li>
              <li>
                Pay <strong>€350</strong> on the <strong>7th</strong> lesson
              </li>
            </ul>
          </li>
        </ul>

        <div className="mt-6 flex gap-3 flex-wrap">
          <a
            href={bookingHref(edtBundleId)}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-white font-semibold hover:bg-black transition"
          >
            Book bundle
          </a>
          <a
            href={bookingHref(standardId)}
            className="inline-flex items-center justify-center rounded-lg border border-black px-5 py-2.5 text-black font-semibold hover:bg-black hover:text-white transition"
          >
            Book single EDT lesson
          </a>
        </div>
      </section>

      <p className="text-xs text-gray-600 mt-8">
        Prices include VAT where applicable. Cancellation policy applies. For questions, use the contact link in the header.
      </p>
    </main>
  );
}
