// app/page.tsx
import Link from "next/link";
import StickyCTA from "@/components/StickyCTA";
import ReviewCarousel from "@/components/ReviewCarousel";
import RotatingWord from "@/components/RotatingWord";
import PriceTiles from "@/components/lton/PriceTiles";
import FlipPlate from "@/components/lton/FlipPlate";
import PhotoSlot from "@/components/lton/PhotoSlot";
import { ArrowRight, Star } from "@/components/lton/Icons";
import { SERVICES, formatPrice } from "@/lib/pricing";

export const metadata = {
  title: "Driving Lessons Dublin | RSA-Approved ADI | The Driving School Dublin",
  description:
    "Professional driving lessons across Dublin. RSA-approved ADI, manual & automatic, EDT packages, pre-test sessions. Flexible scheduling. Book your lesson today.",
};

const GOOGLE_REVIEWS_URL = "https://share.google/Gz174ck7VeSpDSx5L";

const CENTRES = ["Dún Laoghaire", "Tallaght", "Churchtown"];

const TRUST = [
  { title: "5.0 on Google", text: "From 54 reviews" },
  { title: "Former RSA tester", text: "Dún Laoghaire, Tallaght and Churchtown" },
  { title: "Manual or automatic", text: "Dual-control car, or your own automatic" },
  { title: "Mon to Sat, 8am to 6pm", text: "Lessons across Dublin" },
];

const STEPS = [
  {
    title: "Pick your lesson",
    desc: "Standard hour, EDT bundle, pre-test, or car hire for test day.",
  },
  {
    title: "Pick a time that suits",
    desc: "See every open slot on a live calendar and choose the one that fits.",
  },
  {
    title: "Pay and you're booked",
    desc: "Pay securely online and get a confirmation by email. Usually back to you within a few hours.",
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
      <section className="l-hero" aria-labelledby="hero-title">
        {/* Photo slot: a wide shot of Conor's car on a Dublin road (/public/photos/hero.jpg) */}
        <PhotoSlot
          className="l-hero__media"
          alt="Conor's dual-control car on a Dublin road"
          wants="Wide photo of the dual-control car on a Dublin road, /public/photos/hero.jpg"
        >
          <div className="l-hero__content">
            <p className="l-eyebrow l-eyebrow--on-ink">RSA-approved driving instructor · Dublin</p>
            <h1 id="hero-title" className="l-h1">
              Taught by a former<br className="l-br-d" /> driving tester.
            </h1>
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

            <div className="l-hero__ctas">
              <Link href="/book" className="l-btn l-btn--red l-btn--lg">
                Book a lesson <ArrowRight />
              </Link>
              <Link href="/prices" className="l-btn l-btn--ghost-ink l-btn--lg">
                View prices
              </Link>
            </div>

            <div className="l-hero__rating">
              <a className="l-rating" href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
                <span className="l-rating__score l-num">5.0</span>
                <Stars />
                <span className="l-rating__count">
                  54 Google reviews <span>Read them</span>
                </span>
              </a>
            </div>
          </div>
        </PhotoSlot>
      </section>

      {/* ── TRUST STRIP ───────────────────────────────────────────────────── */}
      <ul className="l-trust" aria-label="At a glance">
        {TRUST.map((t) => (
          <li key={t.title}>
            <strong>{t.title}</strong>
            <span>{t.text}</span>
          </li>
        ))}
      </ul>

      {/* ── LESSONS AND PRICES ────────────────────────────────────────────── */}
      <section id="pricing" className="l-section" aria-labelledby="pricing-title">
        <div className="l-section__head l-section__head--split">
          <div style={{ display: "grid", gap: 14 }}>
            <p className="l-eyebrow">Lessons and prices</p>
            <h2 id="pricing-title" className="l-h2">Choose your lesson.</h2>
          </div>
          <p className="l-body">
            Every price up front. Pick a lesson, choose a time on the live calendar and pay
            online. No hidden fees.
          </p>
        </div>

        <PriceTiles />

        <p className="l-offers__more">
          Also: refresher lesson {formatPrice(SERVICES.refresher.pricePence)}, 6 reduced EDT
          lessons {formatPrice(SERVICES["edt-6"].pricePence)}.{" "}
          <Link href="/prices" className="l-link">All prices</Link>
        </p>
      </section>

      {/* ── CREDENTIAL ────────────────────────────────────────────────────── */}
      <section className="l-section" aria-labelledby="cred-title">
        <div className="l-feature">
          {/* Photo slot: a portrait of Conor (/public/photos/conor.jpg) */}
          <PhotoSlot
            className="l-feature__media l-reveal"
            tone="mist"
            plate="N"
            alt="Conor, former RSA driving tester"
            wants="Portrait of Conor beside the car, /public/photos/conor.jpg"
          />
          <div className="l-feature__body">
            <p className="l-eyebrow">Why Conor</p>
            <h2 id="cred-title" className="l-h2">He used to conduct the test.</h2>
            <p className="l-lede">Now he prepares you for it.</p>
            <ul className="l-centres">
              {CENTRES.map((c) => (
                <li key={c}>
                  {c} <span>Former tester</span>
                </li>
              ))}
            </ul>
            <p className="l-body">
              Now an RSA-approved driving instructor. Manual lessons in his dual-control car,
              or automatic in yours.
            </p>
            <p><Link href="/about" className="l-link">More about Conor</Link></p>
          </div>
        </div>
      </section>

      {/* ── PROCESS ───────────────────────────────────────────────────────── */}
      <section id="process" className="l-section" aria-labelledby="process-title">
        <div className="l-section__head">
          <p className="l-eyebrow">How it works</p>
          <h2 id="process-title" className="l-h2">Booked in three steps.</h2>
        </div>
        <ol className="l-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="l-step l-reveal">
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
          <p className="l-eyebrow">Reviews</p>
          <h2 id="reviews-title" className="l-h2">Rated 5.0 from 54 Google reviews.</h2>
        </div>
        <div className="l-quote-panel l-reveal">
          <Stars size={22} />
          <div style={{ marginTop: 18 }}>
            <ReviewCarousel />
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ───────────────────────────────────────────────────── */}
      <section className="l-close" aria-labelledby="close-title">
        <FlipPlate />
        <h2 id="close-title" className="l-h2">Next plate: N.</h2>
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
