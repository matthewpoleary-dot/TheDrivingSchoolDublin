// app/page.tsx
import Link from "next/link";
import StickyCTA from "@/components/StickyCTA";
import ReviewCarousel from "@/components/ReviewCarousel";
import RotatingWord from "@/components/RotatingWord";
import FlipPlate from "@/components/lton/FlipPlate";
import PhotoSlot from "@/components/lton/PhotoSlot";
import { ArrowRight, Star, Chat } from "@/components/lton/Icons";

export const metadata = {
  title: "Driving Lessons Dublin | RSA-Approved ADI | The Driving School Dublin",
  description:
    "Professional driving lessons across Dublin. RSA-approved ADI, manual & automatic, EDT packages, pre-test sessions. Flexible scheduling. Book your lesson today.",
};

const GOOGLE_REVIEWS_URL = "https://share.google/Gz174ck7VeSpDSx5L";
const WHATSAPP_HREF =
  "https://wa.me/353860235666?text=" + encodeURIComponent("Hi! I'd like to arrange a driving lesson.");
const TEL_HREF = "tel:+353860235666";

const TRUST = [
  { title: "5.0 on Google", text: "From 54 reviews" },
  { title: "Former RSA tester", text: "Tallaght, Dún Laoghaire and Churchtown" },
  { title: "Manual or automatic", text: "Dual-control car, or your own automatic" },
  { title: "Mon to Sat, 8am to 6pm", text: "Weekday and evening slots" },
];

const TEACHES = [
  {
    title: "How faults are marked",
    text: "How examiners apply the marking guidelines, so nothing on the day comes as a surprise.",
  },
  {
    title: "The mistakes that fail people",
    text: "The common faults behind most failed tests, spotted early and fixed long before your test.",
  },
  {
    title: "Test-day procedure",
    text: "The routine, the vehicle checks and what the examiner expects, practised until it feels normal.",
  },
];

type Offer = {
  name: string;
  meta: string;
  tag?: string;
  desc: string;
  price: string;
  from?: boolean;
  unit: string;
  key?: boolean;
};

const OFFERS: Offer[] = [
  {
    name: "Driving lessons",
    meta: "60 minutes",
    desc: "One-to-one lessons for beginners, learner permit holders and drivers who want more confidence. Manual in the dual-control car, or automatic in your own.",
    price: "€80",
    unit: "per hour",
  },
  {
    name: "EDT, all 12 lessons",
    meta: "Split payment available",
    tag: "Most popular",
    desc: "The full 12-lesson EDT programme, structured lesson by lesson. Or split it: €455 at your first lesson and €450 at your seventh.",
    price: "€905",
    unit: "12 lessons",
    key: true,
  },
  {
    name: "Pre-test lessons",
    meta: "Mock test route",
    desc: "Test routes, observation, junctions, roundabouts, manoeuvres and the mistakes that cost marks on the day.",
    price: "€100",
    unit: "per session",
  },
  {
    name: "Car hire for your test",
    meta: "Three options",
    desc: "At the test centre from €150, local pickup and drop-off from €200, or with a pre-test lesson from €245.",
    price: "€150",
    from: true,
    unit: "test day",
  },
];

const STEPS = [
  {
    title: "Pick your lesson",
    desc: "Driving lessons, EDT, pre-test, a refresher, or car hire for test day.",
  },
  {
    title: "Get in touch",
    desc: "Call, WhatsApp or email with the times that suit you and your pick-up area.",
  },
  {
    title: "Conor confirms",
    desc: "He gets back to you to confirm your lesson time and where he'll pick you up.",
  },
];

const AREAS = ["Dublin 2", "Dublin 4", "Dublin 6", "Dublin 6W", "Dublin 8", "Dublin 10", "Dublin 12", "Dublin 14", "Dublin 16", "Dublin 18"];

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
          <div className="l-hero__grid">
            <div className="l-hero__content">
              <p className="l-eyebrow l-eyebrow--on-ink">RSA-approved driving instructor · Dublin</p>
              <h1 id="hero-title" className="l-h1">
                Learn to drive with a former<br className="l-br-d" /> RSA driver tester.
              </h1>
              <p className="l-lede l-hero__cred">
                <strong>Conor worked as a driver tester</strong> at Tallaght, Dún Laoghaire and
                the old Churchtown centre, and has years of experience helping learners pass.
                <span className="l-hero__rotate">
                  <span className="sr-only">Pass your test confidently, calmly, stress-free.</span>
                  <span aria-hidden="true">
                    Pass your test{" "}
                    <RotatingWord words={["confidently.", "calmly.", "stress-free."]} className="l-rotator" intervalMs={2600} />
                  </span>
                </span>
              </p>

              <div className="l-hero__ctas">
                <Link href="/contact" className="l-btn l-btn--red l-btn--lg">
                  Contact us <ArrowRight />
                </Link>
                <Link href="/prices" className="l-btn l-btn--ghost-ink l-btn--lg">
                  View prices
                </Link>
                <a className="l-rating" href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
                  <span className="l-rating__score l-num">5.0</span>
                  <Stars />
                  <span className="l-rating__count">
                    54 Google reviews <span>Read them</span>
                  </span>
                </a>
              </div>
            </div>

            {/* Get in touch: the contact site's counterpart to the booking site's live card */}
            <aside className="l-herocard" aria-labelledby="herocard-title">
              <div className="l-herocard__head">
                <span className="l-herocard__plate" aria-hidden="true"><span>L</span></span>
                <div>
                  <p id="herocard-title" className="l-herocard__title">Arrange your first lesson</p>
                  <p className="l-herocard__meta">Mon to Sat, 8am to 6pm</p>
                </div>
              </div>
              <ul className="l-herocard__list">
                <li>
                  <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="l-herocard__row">
                    <span>WhatsApp</span>
                    <small>Usually within minutes</small>
                  </a>
                </li>
                <li>
                  <a href={TEL_HREF} className="l-herocard__row">
                    <span>Call</span>
                    <small>086 023 5666</small>
                  </a>
                </li>
                <li>
                  <Link href="/contact" className="l-herocard__row">
                    <span>Email or form</span>
                    <small>Same day reply</small>
                  </Link>
                </li>
              </ul>
              <div className="l-herocard__foot">
                <p className="l-herocard__price">From <strong className="l-num">€80</strong> per hour</p>
                <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="l-btn l-btn--ink l-btn--sm">
                  <Chat size={14} /> Message
                </a>
              </div>
            </aside>
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

      {/* ── WHAT AN EX-TESTER TEACHES YOU ─────────────────────────────────── */}
      <section className="l-section" aria-labelledby="cred-title">
        <div className="l-feature">
          {/* Photo slot: a portrait of Conor (/public/photos/conor.jpg) */}
          <PhotoSlot
            className="l-feature__media l-reveal"
            tone="mist"
            plate="N"
            alt="Conor, former RSA driver tester"
            wants="Portrait of Conor beside the car, /public/photos/conor.jpg"
          />
          <div className="l-feature__body">
            <p className="l-eyebrow">Why learn with Conor</p>
            <h2 id="cred-title" className="l-h2">He knows how the test is marked.</h2>
            <p className="l-lede">
              Conor was an RSA driver tester before he became an instructor. His lessons
              teach you to drive well, and to drive the way examiners want to see.
            </p>
            <ul className="l-points">
              {TEACHES.map((t) => (
                <li key={t.title}>
                  <strong>{t.title}</strong>
                  <span>{t.text}</span>
                </li>
              ))}
            </ul>
            <p><Link href="/about" className="l-link">More about Conor</Link></p>
          </div>
        </div>
      </section>

      {/* ── LESSONS AND PRICES ────────────────────────────────────────────── */}
      <section id="lessons" className="l-section" aria-labelledby="lessons-title" style={{ scrollMarginTop: 96 }}>
        <div className="l-section__head l-section__head--split">
          <div style={{ display: "grid", gap: 14 }}>
            <p className="l-eyebrow">Lessons and prices</p>
            <h2 id="lessons-title" className="l-h2">Choose your lesson.</h2>
          </div>
          <p className="l-body">
            Clear prices with no hidden fees. Get in touch with the lesson you want and the
            times that suit you.
          </p>
        </div>

        <ul className="l-offers" role="list">
          {OFFERS.map((o) => (
            <li key={o.name} className={`l-offer l-reveal${o.key ? " l-offer--key" : ""}`}>
              <div className="l-offer__top">
                <span className="l-offer__meta">{o.meta}</span>
                {o.tag && <span className="l-tag">{o.tag}</span>}
              </div>
              <h3 className="l-offer__name">{o.name}</h3>
              <p className="l-offer__desc">{o.desc}</p>
              <p className="l-offer__price">
                {o.from && <small>from</small>}
                <strong className="l-num">{o.price}</strong>
                <small>{o.unit}</small>
              </p>
              <Link href="/contact" className={`l-btn ${o.key ? "l-btn--red" : "l-btn--ink"}`}>
                Contact us <ArrowRight size={16} />
              </Link>
            </li>
          ))}
        </ul>

        <p className="l-offers__more">
          Also: refresher lessons €80 per hour, 6 reduced EDT lessons €455.{" "}
          <Link href="/prices" className="l-link">All prices</Link>
        </p>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="process" className="l-section" aria-labelledby="process-title">
        <div className="l-section__head">
          <p className="l-eyebrow">How it works</p>
          <h2 id="process-title" className="l-h2">Three simple steps.</h2>
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

      {/* ── AREAS ─────────────────────────────────────────────────────────── */}
      <section id="areas" className="l-section" aria-labelledby="areas-title">
        <div className="l-section__head l-section__head--split">
          <div style={{ display: "grid", gap: 14 }}>
            <p className="l-eyebrow">Areas</p>
            <h2 id="areas-title" className="l-h2">Pick-up across Dublin.</h2>
          </div>
          <p className="l-body">
            Not sure we cover your area? <Link href="/contact" className="l-link">Get in touch</Link> and ask.
          </p>
        </div>
        <ul className="l-areas" role="list">
          {AREAS.map((a) => <li key={a}>{a}</li>)}
        </ul>
      </section>

      {/* ── CLOSING CTA ───────────────────────────────────────────────────── */}
      <section className="l-close" aria-labelledby="close-title">
        <FlipPlate />
        <h2 id="close-title" className="l-h2">Ready to pass your driving test?</h2>
        <p className="l-body">Get in touch to arrange your first lesson.</p>
        <div className="l-close__ctas">
          <Link href="/contact" className="l-btn l-btn--red l-btn--lg">
            Contact us <ArrowRight />
          </Link>
          <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="l-btn l-btn--ghost-ink l-btn--lg">
            WhatsApp
          </a>
          <a href={TEL_HREF} className="l-btn l-btn--ghost-ink l-btn--lg">
            Call 086 023 5666
          </a>
        </div>
      </section>

      <StickyCTA />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
