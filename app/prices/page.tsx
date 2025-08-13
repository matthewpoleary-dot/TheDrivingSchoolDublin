// app/prices/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  active?: boolean;
};

function euro(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

export default function PricesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/services");
        const data: Service[] = await res.json();
        const list = Array.isArray(data) ? data : [];
        setServices(
          list
            .filter((s) => s.active !== false)
            .sort((a, b) => a.price_cents - b.price_cents)
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      {/* Heading */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Prices</h1>
        <p className="mt-2 text-sm text-gray-600">
          Clear, upfront pricing. Choose a lesson that suits and book in under a minute.
        </p>
      </header>

      {/* Grid of services */}
      {loading ? (
        <p className="text-gray-600">Loading prices…</p>
      ) : services.length === 0 ? (
        <p className="text-gray-600">No services available right now.</p>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <article
              key={s.id}
              className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col"
            >
              <h2 className="text-lg font-semibold text-gray-900">{s.name}</h2>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">
                  {euro(s.price_cents)}
                </span>
                <span className="text-sm text-gray-500">/ {s.duration_minutes} min</span>
              </div>

              <ul className="mt-4 text-sm text-gray-700 space-y-1">
                <li>• One-to-one session</li>
                <li>• Flexible weekday times</li>
                <li>• Email confirmation + calendar invite</li>
              </ul>

              <div className="mt-6">
                <Link href="/book" className="btn-primary w-full text-center">
                  Book this lesson
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Info strip */}
      <section className="mt-10 rounded-xl border bg-white p-4 shadow-sm text-sm text-gray-700">
        <p>
          Need multiple lessons? Book one first and we’ll arrange a bundle afterwards. Gift vouchers
          available on request.
        </p>
      </section>
    </div>
  );
}
