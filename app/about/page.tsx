// app/about/page.tsx
import Link from "next/link";
import PhotoSlot from "@/components/lton/PhotoSlot";
import { ArrowRight } from "@/components/lton/Icons";
import { photo } from "@/components/lton/photos";

// Fills itself once /public/photos/conor.jpg exists (see DESIGN.md).
const CONOR_PHOTO = photo("conor.jpg");

const CENTRES = [
  {
    name: "Dún Laoghaire",
    text: "Every route, every junction, every common slip-up: he knows the lot.",
  },
  {
    name: "Tallaght",
    text: "Tested out of Tallaght too. He knows the routes, the traffic patterns, and what the examiners are watching for.",
  },
  {
    name: "Churchtown",
    text: "He also worked at the old Churchtown test centre.",
  },
];

const HIGHLIGHTS = [
  "Patient, structured instruction",
  "Manual lessons in dual-control instructor car",
  "Specialist in EDT and pre-tests",
  "Flexible scheduling across South Dublin",
];

export default function About() {
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
  };

  return (
    <div className="l-page">
      <header className="l-intro">
        <p className="l-eyebrow">About</p>
        <h1 className="l-h1">Meet Conor.</h1>
        <p className="l-lede">
          Your RSA-approved ADI, and a former driving tester at <strong>Dún Laoghaire</strong>,{" "}
          <strong>Tallaght</strong> and the old <strong>Churchtown</strong> centre. He knows the
          routes inside out.
        </p>
      </header>

      {/* ── Bio ─────────────────────────────────────────────────────────── */}
      <section className="l-group" aria-labelledby="bio-title">
        <div className={CONOR_PHOTO ? "l-split" : "l-solo"}>
          {CONOR_PHOTO && (
            <PhotoSlot
              className="l-reveal l-photo--soft"
              src={CONOR_PHOTO}
              alt="Conor, RSA-approved driving instructor"
              wants="Portrait of Conor, /public/photos/conor.jpg"
              style={{ aspectRatio: "4 / 5" }}
            />
          )}

          <div>
            <h2 id="bio-title" className="l-h3" style={{ marginBottom: 22 }}>
              An ex-tester in the passenger seat beside you.
            </h2>
            <div className="l-prose">
              <p>
                Conor is an Approved Driving Instructor (ADI) and a former RSA driving tester.
                Having worked in test centres across <strong>Tallaght</strong>,{" "}
                <strong>Dún Laoghaire</strong> and the old <strong>Churchtown</strong> centre,
                he knows exactly what examiners look for on the day.
              </p>
              <p>
                He pairs professional standards with a calm, supportive teaching style. Every
                lesson builds safe driving and gets you ready to perform under test conditions.
              </p>
              <p>
                Whether you&apos;re completing your <strong>EDT programme</strong>, booking{" "}
                <strong>pre-test lessons</strong> or coming back for a refresher, each lesson is
                shaped around your goals and your confidence.
              </p>
            </div>

            <ul className="l-list" style={{ marginTop: 32 }}>
              {HIGHLIGHTS.map((h) => <li key={h}>{h}</li>)}
            </ul>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 32 }}>
              <Link href="/book" className="l-btn l-btn--red l-btn--lg">
                Book a lesson <ArrowRight />
              </Link>
              <Link href="/prices" className="l-btn l-btn--line l-btn--lg">View prices</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Test centre expertise ───────────────────────────────────────── */}
      <section className="l-group l-group--wide" aria-labelledby="centres-title">
        <div className="l-ledger">
          <div className="l-ledger__head">
            <h2 id="centres-title" className="l-h2">He used to conduct the test here.</h2>
          </div>
          <ul className="l-centres l-centres--ledger l-centres--notes">
            {CENTRES.map((c) => (
              <li key={c.name}>
                {c.name}
                <p>{c.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
