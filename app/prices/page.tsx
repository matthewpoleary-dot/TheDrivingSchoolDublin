// app/prices/page.tsx
// Weekend prices are handled during the booking conversation by design.
import Link from "next/link";
import FAQ from "@/components/FAQ";
import Check from "@/components/icons/Check";

function BookBtn({ service, label = "Book now", primary = false }: { service: string; label?: string; primary?: boolean }) {
  return (
    <Link
      href={`/book?service=${service}`}
      className={`mt-6 w-full ${primary ? "btn-primary" : "btn-outline"}`}
    >
      {label}
    </Link>
  );
}

function PriceCard({
  title,
  price,
  unit,
  description,
  note,
  service,
  buttonLabel,
  featured = false,
  features,
}: {
  title: string;
  price: string;
  unit: string;
  description: string;
  note?: string;
  service: string;
  buttonLabel?: string;
  featured?: boolean;
  features?: string[];
}) {
  return (
    <div className={`relative flex flex-col rounded-2xl bg-white p-7 lg:p-8 shadow-sm transition-shadow hover:shadow-lg ${featured ? "ring-2 ring-red-600" : "ring-1 ring-slate-100"}`}>
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1 shadow-md">
          Most popular
        </span>
      )}
      <div className="flex-1">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <div className="mt-5 flex items-baseline gap-2">
          <span className="text-4xl lg:text-5xl font-extrabold text-slate-900">{price}</span>
          <span className="text-sm text-slate-500">{unit}</span>
        </div>
        <p className="mt-4 text-sm text-slate-700 leading-relaxed">{description}</p>
        {features && (
          <ul className="mt-5 space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{f}</span>
              </li>
            ))}
          </ul>
        )}
        {note && <p className="mt-4 text-xs text-slate-500 italic">{note}</p>}
      </div>
      <BookBtn service={service} label={buttonLabel} primary={featured} />
    </div>
  );
}

export default function PricesPage() {
  return (
    <section className="space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-red-600 uppercase tracking-wider">Pricing</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Transparent, no-surprises pricing
        </h1>
        <p className="text-lg text-slate-600">
          Clear hourly rates and package deals — pay securely online.
        </p>
      </div>

      {/* Standard + Pre-Test */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PriceCard
          title="Standard Lesson"
          price="€80"
          unit="/ hour · Mon–Fri"
          description="One-to-one tuition in a fully-equipped dual-control car."
          note="Evening & weekend slots available on request — limited availability."
          service="standard"
        />
        <PriceCard
          title="Pre-Test Lesson"
          price="€100"
          unit="/ session · Mon–Fri"
          description="Full pre-test preparation: mock test route, manoeuvres, and examiner feedback style."
          note="Weekend sessions on request — subject to availability."
          service="pre-test"
        />
      </div>

      {/* Car Hire — full width */}
      <div className="rounded-2xl bg-white p-7 lg:p-8 shadow-sm ring-1 ring-slate-100">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900">Car Hire for Test</h3>
          <p className="text-sm text-slate-500 mt-1">
            Priced for Monday–Friday tests. Saturday test dates on request. Not available Sundays.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { opt: "1", desc: "At the test centre", price: "from €150" },
            { opt: "2", desc: "Local pickup & drop-off", price: "from €200" },
            { opt: "3", desc: "Car hire + pre-test lesson", price: "from €245" },
          ].map(({ opt, desc, price }) => (
            <div key={opt} className="rounded-xl bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Option {opt}</p>
              <p className="text-sm text-slate-700 mb-4">{desc}</p>
              <p className="text-2xl font-extrabold text-slate-900">{price}</p>
            </div>
          ))}
        </div>
        <ul className="mt-6 grid sm:grid-cols-3 gap-3">
          {[
            "Roadworthy, fully insured vehicle",
            "Arrive early, paperwork checked",
            "Instructor support before & after test",
          ].map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <Check className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-700">{f}</span>
            </li>
          ))}
        </ul>
        <Link href="/book?service=car-hire" className="btn-outline mt-6 w-full sm:w-auto">
          Book car hire
        </Link>
      </div>

      {/* Refresher + 6 EDT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PriceCard
          title="Refresher Lessons"
          price="€80"
          unit="/ hour · Mon–Fri"
          description="For licensed drivers returning to the wheel after a break."
          note="Weekend slots on request."
          service="refresher"
        />
        <PriceCard
          title="6 Reduced EDT Lessons"
          price="€455"
          unit="6 lessons · Mon–Fri"
          description="Completes the reduced EDT syllabus over six structured hours."
          note="Weekend scheduling available on request."
          service="edt-6"
          buttonLabel="Buy 6-lesson package"
        />
      </div>

      {/* EDT Bundle — featured, full width */}
      <div className="relative rounded-3xl bg-gradient-to-br from-red-50/60 via-white to-slate-50 p-8 sm:p-12 shadow-md ring-2 ring-red-600">
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1 shadow-md">
          Most popular
        </span>
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 items-center">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">EDT Bundle · 12 lessons</h3>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-5xl font-extrabold text-slate-900">€905</span>
              <span className="text-base text-slate-500">€75.42 / hour</span>
            </div>
            <p className="mt-4 text-base text-slate-700">
              Our most popular package for learners completing full EDT — cheaper than booking hourly.
            </p>
            <ul className="mt-6 grid sm:grid-cols-2 gap-3">
              {[
                "Pay once — book at your own pace",
                "Personal booking link emailed instantly",
                "Up to 2 sessions bookable in advance",
                "Valid for 12 months",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{f}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500 italic">Weekend scheduling available on request.</p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/book?service=edt-bundle" className="btn-primary w-full text-base">
              Buy EDT bundle · €905
            </Link>
            <Link href="/book?service=edt-6" className="btn-outline w-full">
              Or just 6 lessons · €455
            </Link>
            <p className="text-center text-xs text-slate-500 mt-2">
              Secure payment via Stripe · Mon–Fri scheduling
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-500 text-center">
        Prices include VAT where applicable. Questions?{" "}
        <Link href="/contact" className="text-red-600 hover:text-red-700 underline-offset-4 hover:underline">
          Get in touch
        </Link>.
      </p>

      {/* FAQ */}
      <div className="pt-8">
        <FAQ />
      </div>

      {/* CTA */}
      <section className="relative rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-red-50/50" />
        <div className="relative px-6 py-14 sm:px-12 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Ready to book?</h2>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">
            Pick your lesson, choose a slot, pay securely online.
          </p>
          <div className="mt-6">
            <Link href="/book" className="btn-primary">
              Book a lesson
            </Link>
          </div>
        </div>
      </section>
    </section>
  );
}
