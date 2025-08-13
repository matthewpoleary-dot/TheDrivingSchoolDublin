// app/prices/page.tsx
import { supabase } from "@/lib/supabase";

const euros = (cents: number) =>
  (cents / 100).toLocaleString("en-IE", { style: "currency", currency: "EUR" });

export const metadata = {
  title: "DriveTime | Prices",
  description: "Lesson types and pricing.",
};

export default async function PricesPage() {
  // Fetch active services from Supabase
  const { data: services, error } = await supabase
    .from("services")
    .select("id,name,duration_minutes,price_cents,active")
    .eq("active", true)
    .order("price_cents", { ascending: true });

  if (error) {
    return (
      <section className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Prices</h1>
        <p className="mt-4 text-red-600">Couldn’t load prices. Please try again.</p>
      </section>
    );
  }

  return (
    <section className="max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Prices</h1>
        <p className="mt-2 text-gray-600">
          Transparent pricing for every lesson. Book online in seconds.
        </p>
      </header>

      {(!services || services.length === 0) ? (
        <p className="text-gray-600">No services available yet. Check back soon.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <article key={s.id} className="rounded-2xl border bg-white shadow-sm p-5 flex flex-col">
              <h2 className="text-lg font-semibold">{s.name}</h2>
              <p className="mt-1 text-sm text-gray-500">{s.duration_minutes} minutes</p>

              <div className="mt-4 text-3xl font-extrabold">{euros(s.price_cents)}</div>

              <ul className="mt-4 text-sm text-gray-600 space-y-1">
                <li>✓ Instructor-led, 1:1</li>
                <li>✓ Flexible weekday slots</li>
                <li>✓ Instant email confirmation</li>
              </ul>

              <a
                href={`/book`} // you can append ?serviceId=${s.id} later if you add preselect logic
                className="mt-6 inline-flex justify-center items-center rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 transition"
              >
                Book this
              </a>
            </article>
          ))}
        </div>
      )}

      <p className="mt-8 text-xs text-gray-500">
        Prices shown include all taxes. Cancellation policy applies.
      </p>
    </section>
  );
}
