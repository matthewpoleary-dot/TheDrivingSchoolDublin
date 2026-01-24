// app/page.tsx
import Link from "next/link";
import Image from "next/image";
import Testimonials from "@/components/Testimonials";
import AreasCovered from "@/components/AreasCovered";
import HowItWorks from "@/components/HowItWorks";
import PricingPreview from "@/components/PricingPreview";
import StickyCTA from "@/components/StickyCTA";

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="currentColor">
      <path d="M20.285 6.707a1 1 0 0 1 0 1.414l-9.9 9.9a1 1 0 0 1-1.414 0l-5.257-5.257a1 1 0 1 1 1.414-1.414l4.55 4.55 9.193-9.193a1 1 0 0 1 1.414 0Z" />
    </svg>
  );
}

function LogoVisual() {
  return (
    <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-red-50 to-gray-50 grid place-items-center">
      <Image
        src="/Logo.jpg"
        alt="The Driving School Dublin Logo"
        width={400}
        height={400}
        priority
        className="rounded-lg"
      />
    </div>
  );
}

export const metadata = {
  title: "Driving Lessons Dublin | RSA-Approved ADI | The Driving School Dublin",
  description: "Professional driving lessons across Dublin. RSA-approved ADI, manual & automatic, EDT packages, pre-test sessions. Flexible scheduling. Book your lesson today.",
};

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
    areaServed: {
      "@type": "City",
      name: "Dublin",
    },
    priceRange: "€€",
    openingHours: "Mo-Sa 08:00-18:00",
  };

  return (
    <>
      <section className="space-y-16">
        {/* Hero Section */}
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Professional <span className="text-red-600">driving lessons</span> in Dublin
            </h1>
            <p className="mt-4 text-lg text-gray-700 leading-7">
              RSA-approved ADI with years of experience helping learners pass their test. 
              Structured lessons, flexible scheduling, and expert guidance for manual and automatic drivers.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">
                Contact us
              </Link>
              <Link href="/prices" className="btn-outline">
                View prices
              </Link>
            </div>

            {/* Benefit bullets */}
            <ul className="mt-8 space-y-2 text-sm text-gray-800">
              <li className="flex items-center gap-2">
                <IconCheck />
                <span>RSA-approved ADI • Manual (instructor&apos;s car) & Automatic (your car)</span>
              </li>
              <li className="flex items-center gap-2">
                <IconCheck />
                <span>Flexible weekday & evening slots</span>
              </li>
              <li className="flex items-center gap-2">
                <IconCheck />
                <span>EDT programmes • Pre-test specialists</span>
              </li>
              <li className="flex items-center gap-2">
                <IconCheck />
                <span>Dublin test routes: Tallaght, Dún Laoghaire</span>
              </li>
              <li className="flex items-center gap-2">
                <IconCheck />
                <span>Local pick-up • Dual-control vehicles</span>
              </li>
              <li className="flex items-center gap-2">
                <IconCheck />
                <span>Refresher lessons for nervous or returning drivers</span>
              </li>
            </ul>
          </div>

          <div className="card">
            <LogoVisual />
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="kpi">
                <span className="icon-bubble"><IconCheck /></span>
                <h3 className="kpi-title">RSA‑approved ADI</h3>
                <p className="kpi-sub">Qualified, experienced instructors.</p>
              </div>
              <div className="kpi">
                <span className="icon-bubble"><IconCheck /></span>
                <h3 className="kpi-title">Pre‑test specialists</h3>
                <p className="kpi-sub">Tallaght & Dún Laoghaire routes.</p>
              </div>
              <div className="kpi">
                <span className="icon-bubble"><IconCheck /></span>
                <h3 className="kpi-title">Flexible scheduling</h3>
                <p className="kpi-sub">Weekday & evening lessons available.</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <HowItWorks />

        {/* Pricing Preview */}
        <PricingPreview />

        {/* Testimonials */}
        <Testimonials />

        {/* Areas Covered */}
        <AreasCovered />

        {/* Final CTA Banner */}
        <div className="rounded-2xl border bg-gradient-to-br from-red-50 to-gray-50 p-8 md:p-12 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight mb-4">
            Ready to start your driving journey?
          </h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Contact us today to arrange your first lesson.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/contact" className="btn-primary">
              Contact us
            </Link>
            <a
              href="https://wa.me/353860235666?text=Hi!%20I'd%20like%20to%20arrange%20a%20driving%20lesson."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              WhatsApp us
            </a>
            <a href="tel:+353860235666" className="btn-outline">
              Call us
            </a>
          </div>
        </div>
      </section>

      {/* Sticky Mobile CTA */}
      <StickyCTA />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
