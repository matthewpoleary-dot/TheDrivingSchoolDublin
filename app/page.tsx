// app/page.tsx
import Link from "next/link";
import Testimonials from "@/components/Testimonials";
import AreasCovered from "@/components/AreasCovered";
import HowItWorks from "@/components/HowItWorks";
import PricingPreview from "@/components/PricingPreview";
import StickyCTA from "@/components/StickyCTA";
import Check from "@/components/icons/Check";
import { StarRow } from "@/components/icons/Star";

export const metadata = {
  title: "Driving Lessons Dublin | RSA-Approved ADI | The Driving School Dublin",
  description: "Professional driving lessons across Dublin. RSA-approved ADI, manual & automatic, EDT packages, pre-test sessions. Flexible scheduling. Book your lesson today.",
};

const BENEFITS = [
  "RSA-approved ADI · Manual & automatic options",
  "Flexible weekday & evening slots",
  "EDT programmes · Pre-test specialists",
  "Dublin test routes: Tallaght & Dún Laoghaire",
  "Local pick-up · Dual-control vehicles",
  "Refresher lessons for nervous or returning drivers",
];

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "The Driving School Dublin",
    url: "https://thedrivingschooldublin.com",
    telephone: "+353860235666",
    email: "thedrivingschooldublin@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dublin",
      addressCountry: "IE",
    },
    areaServed: { "@type": "City", name: "Dublin" },
    priceRange: "€€",
    openingHours: "Mo-Sa 08:00-18:00",
  };

  return (
    <>
      <div className="space-y-24 lg:space-y-32">
        {/* ─── HERO ─────────────────────────────────────────────────────── */}
        <section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 items-center">
          {/* Left column */}
          <div className="space-y-7">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
              Professional <span className="text-red-600">driving lessons</span> in&nbsp;Dublin
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
              RSA-approved instructor with years of experience helping learners pass their test.
              Structured lessons, flexible scheduling, and expert guidance for manual and automatic drivers.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/book" className="btn-primary">
                Book your lesson
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link href="/prices" className="btn-outline">
                View prices
              </Link>
            </div>

            {/* Benefit bullets */}
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3 pt-4">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 leading-snug">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right column — hero image */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="aspect-[4/5] w-full rounded-3xl overflow-hidden shadow-xl ring-1 ring-slate-200/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80"
                alt="Driving school car with roof L-plates on a bright Dublin street"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating trust card */}
            <div className="absolute -bottom-5 -left-2 sm:left-6 bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 px-5 py-4 max-w-[260px]">
              <StarRow className="h-4 w-4" />
              <p className="mt-2 text-sm font-bold text-slate-900">5.0 · 54 reviews</p>
              <p className="text-xs text-slate-500">Trusted by Dublin learners</p>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─────────────────────────────────────────────── */}
        <HowItWorks />

        {/* ─── PRICING PREVIEW ──────────────────────────────────────────── */}
        <PricingPreview />

        {/* ─── TESTIMONIALS ─────────────────────────────────────────────── */}
        <Testimonials />

        {/* ─── AREAS COVERED ────────────────────────────────────────────── */}
        <AreasCovered />

        {/* ─── BOTTOM CTA ───────────────────────────────────────────────── */}
        <section className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-red-50/50" />
          <div className="relative px-6 py-16 sm:px-12 sm:py-20 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Ready to start your driving journey?
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Dublin&apos;s friendly solo instructor — quick reply, lessons that actually move you forward.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link href="/book" className="btn-primary">
                Book a lesson
              </Link>
              <a
                href="https://wa.me/353860235666?text=Hi!%20I'd%20like%20to%20arrange%20a%20driving%20lesson."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                </svg>
                WhatsApp
              </a>
              <a href="tel:+353860235666" className="btn-outline">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Call +353 86 0235 666
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky mobile CTA */}
      <StickyCTA />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
