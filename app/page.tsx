import Link from "next/link";
import Image from "next/image";
import Testimonials from "@/components/Testimonials";
import AreasCovered from "@/components/AreasCovered";
import HowItWorks from "@/components/HowItWorks";
import PricingPreview from "@/components/PricingPreview";
import StickyCTA from "@/components/StickyCTA";

export const metadata = {
  title: "Driving Lessons Dublin | RSA-Approved ADI | The Driving School Dublin",
  description: "Professional driving lessons across Dublin. RSA-approved ADI, manual & automatic, EDT packages, pre-test sessions. Flexible scheduling. Book your lesson today.",
};

const BENEFITS = [
  "RSA-approved ADI · Manual & automatic",
  "Flexible weekday & evening slots",
  "EDT programmes · Pre-test specialists",
  "Tallaght & Dún Laoghaire test routes",
  "Local pick-up · Dual-control vehicles",
  "Refresher lessons for nervous drivers",
];

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-red-600" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0Z" />
    </svg>
  );
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "The Driving School Dublin",
  url: "https://thedrivingschooldublin.com",
  telephone: "+353860235666",
  email: "thedrivingschooldublin@gmail.com",
  address: { "@type": "PostalAddress", addressLocality: "Dublin", addressCountry: "IE" },
  areaServed: { "@type": "City", name: "Dublin" },
  priceRange: "€€",
  openingHours: "Mo-Sa 08:00-18:00",
};

export default function Home() {
  return (
    <>
      <div className="space-y-24">

        {/* ── Hero ── */}
        <section className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="section-label mb-4">RSA-Approved · Dublin</p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] text-gray-900">
              Professional{" "}
              <span className="text-red-600">driving lessons</span>{" "}
              in Dublin
            </h1>
            <p className="mt-5 text-lg text-gray-500 leading-relaxed max-w-lg">
              RSA-approved ADI with years of experience helping learners pass their test.
              Structured lessons, flexible scheduling, expert guidance.
            </p>

            <ul className="mt-8 space-y-3">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckIcon />
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">Contact us</Link>
              <Link href="/prices" className="btn-outline">View prices</Link>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 shadow-sm">
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-white flex items-center justify-center">
              <Image
                src="/Logo.jpg"
                alt="The Driving School Dublin"
                width={420}
                height={280}
                priority
                className="object-contain"
              />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { title: "RSA-approved ADI", sub: "Qualified & experienced" },
                { title: "Pre-test specialists", sub: "Tallaght · Dún Laoghaire" },
                { title: "Flexible slots", sub: "Mornings, evenings & weekdays" },
              ].map((k) => (
                <div key={k.title} className="rounded-xl bg-white border border-gray-100 p-3 text-center shadow-sm">
                  <p className="text-xs font-semibold text-gray-900 leading-snug">{k.title}</p>
                  <p className="mt-1 text-xs text-gray-500 leading-snug">{k.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <HowItWorks />

        {/* ── Pricing Preview ── */}
        <PricingPreview />

        {/* ── Testimonials ── */}
        <Testimonials />

        {/* ── Areas Covered ── */}
        <AreasCovered />

        {/* ── Final CTA ── */}
        <section className="rounded-2xl bg-gray-900 px-8 py-14 text-center text-white">
          <p className="section-label mb-3 text-red-400">Get started today</p>
          <h2 className="text-3xl font-bold tracking-tight">Ready to start your driving journey?</h2>
          <p className="mt-3 text-gray-400 max-w-md mx-auto">
            Contact us to arrange your first lesson. We get back to you the same day.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/contact" className="btn-primary">Contact us</Link>
            <a
              href="https://wa.me/353860235666?text=Hi!%20I'd%20like%20to%20arrange%20a%20driving%20lesson."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:border-white/50"
            >
              WhatsApp us
            </a>
            <a
              href="tel:+353860235666"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:border-white/50"
            >
              Call us
            </a>
          </div>
        </section>

      </div>

      <StickyCTA />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
