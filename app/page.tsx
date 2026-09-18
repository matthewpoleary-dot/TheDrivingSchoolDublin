// app/page.tsx
import Link from "next/link";
import StickyCTA from "@/components/StickyCTA";
import ReviewCarousel from "@/components/ReviewCarousel";
import RotatingWord from "@/components/RotatingWord";
import PriceTiles from "@/components/lton/PriceTiles";
import FlipPlate from "@/components/lton/FlipPlate";
import { ArrowRight, Star } from "@/components/lton/Icons";
import { SERVICES, formatPrice } from "@/lib/pricing";

export const metadata = {
  title: "Driving Lessons Dublin | RSA-Approved ADI | The Driving School Dublin",
  description:
    "Professional driving lessons across Dublin. RSA-approved ADI, manual & automatic, EDT packages, pre-test sessions. Flexible scheduling. Book your lesson today.",
};

const GOOGLE_REVIEWS_URL = "https://share.google/Gz174ck7VeSpDSx5L";

const CENTRES = ["Dún Laoghaire", "Tallaght", "Churchtown"];

const STEPS = [
  {
    title: "Pick your lesson type",
    desc: "Standard hour, EDT bundle, pre-test, or car hire for test day.",
  },
  {
    title: "Pick a time that suits",
    desc: "See all available slots on a live calendar and book the one that fits.",
  },
  {
    title: "Pay and you're confirmed",
    desc: "Pay securely online and receive a confirmation by email. Usually back to you within a few hours.",
  },
];

function Stars({ size = 18 }: { size?: number }) {
  return (
    <span className="l-rating__stars" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={size} />)}
    </span>
  );
}

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
    <div className="l-page">
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="l-hero">
        <div className="l-hero__head">
          <div className="l-hero__plate" aria-hidden="true">
            <div className="l-plate"><span>L</span></div>
          </div>
          <h1 className="l-display l-h1">
            Taught by<br className="l-br-m" /> a former<br className="l-br-m" /><br className="l-br-d" />
            {" "}driving<br className="l-br-m" /> tester.
          </h1>
        </div>

        <div className="l-hero__side">
          <p className="l-lede l-hero__cred">
            <strong>Conor worked as an RSA driving tester</strong> at Dún Laoghaire, Tallaght
            and the old Churchtown centre. Now he&apos;s your instructor.
            <span className="l-hero__rotate">
              <span className="sr-only">Pass your test confidently, calmly, stress-free.</span>
              <span aria-hidden="true">
                Pass your test{" "}
                <RotatingWord words={["confidently.", "calmly.", "stress-free."]} className="l-rotator" intervalMs={2600} />
              </span>
            </span>
          </p>

          <a className="l-rating" href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
            <span className="l-rating__score l-num">5.0</span>
            <Stars />
            <span className="l-rating__count">
              54 Google reviews <span>Read them</span>
            </span>
          </a>

          <div className="l-hero__ctas">
            <Link href="/book" className="l-btn l-btn--red l-btn--lg">
              Book a lesson <ArrowRight />
            </Link>
            <Link href="/prices" className="l-btn l-btn--line l-btn--lg">
              View prices
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="l-section" aria-labelledby="pricing-title">
        <div className="l-section__head">
          <h2 id="pricing-title" className="l-display l-h2">What it costs.</h2>
          <p className="l-body" style={{ maxWidth: "30ch" }}>
            Every price upfront. Pay online when you book, no hidden fees.
          </p>
        </div>

        <PriceTiles />

        <p className="l-tiles__more">
          Also: refresher lesson {formatPrice(SERVICES.refresher.pricePence)}, 6 reduced EDT
          lessons {formatPrice(SERVICES["edt-6"].pricePence)}.{" "}
          <Link href="/prices" className="l-link">All prices</Link>
        </p>
      </section>

      {/* ── CREDENTIAL ────────────────────────────────────────────────────── */}
      <section className="l-band" aria-labelledby="cred-title">
        <div>
          <h2 id="cred-title" className="l-display l-h2">He used to conduct the test.</h2>
          <p>Now he prepares you for it.</p>
        </div>
        <div>
          <ul className="l-centres">
            {CENTRES.map((c) => (
              <li key={c}>
                {c} <span>Former tester</span>
              </li>
            ))}
          </ul>
          <p>
            Now an RSA-approved driving instructor. Manual lessons in his dual-control car,
            or automatic in yours.
          </p>
          <Link href="/about" className="l-link">More about Conor</Link>
        </div>
      </section>

      {/* ── PROCESS ───────────────────────────────────────────────────────── */}
      <section id="process" className="l-section" aria-labelledby="process-title">
        <div className="l-section__head">
          <h2 id="process-title" className="l-display l-h2">How booking works.</h2>
        </div>
        <ol className="l-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="l-step">
              <span className="l-step__n l-num" aria-hidden="true">{i + 1}</span>
              <div>
                <h3>{s.title}</h3>
                <p className="l-body">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── REVIEWS ───────────────────────────────────────────────────────── */}
      <section id="reviews" className="l-section" aria-labelledby="reviews-title">
        <div className="l-section__head">
          <h2 id="reviews-title" className="l-display l-h2">
            Rated 5.0 from 54 Google reviews.
          </h2>
          <Stars size={24} />
        </div>
        <ReviewCarousel />
      </section>

      {/* ── CLOSING CTA ───────────────────────────────────────────────────── */}
      <section className="l-close" aria-labelledby="close-title">
        <FlipPlate />
        <h2 id="close-title" className="l-display l-h2">Next plate: N.</h2>
        <p className="l-body">Pick a time on the live calendar and pay online.</p>
        <Link href="/book" className="l-btn l-btn--red l-btn--lg">
          Book a lesson <ArrowRight />
        </Link>
      </section>

      {/* Sticky mobile bottom bar */}
      <StickyCTA />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
