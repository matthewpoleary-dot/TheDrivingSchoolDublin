// app/about/page.tsx
import Link from "next/link";
import { ArrowRight } from "@/components/lton/Icons";

const CENTRES = [
  {
    name: "Dún Laoghaire",
    text: "Years as an examiner. Every route, every junction, every common slip-up: he knows the lot.",
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
        <h1 className="l-display l-h1">Meet Conor.</h1>
        <p className="l-lede">
          Your RSA-approved ADI and former driving tester at both <strong>Dún Laoghaire</strong> and{" "}
          <strong>Tallaght</strong>. He knows both routes inside out.
        </p>
      </header>

      {/* ── Test centre expertise: the one black field ─────────────────── */}
      <section className="l-band" aria-labelledby="centres-title">
        <div>
          <h2 id="centres-title" className="l-display l-h2">Test centre expertise.</h2>
          <p>He used to conduct the driving test at these centres.</p>
        </div>
        <ul className="l-centres" style={{ marginTop: 28 }}>
          {CENTRES.map((c) => (
            <li key={c.name} style={{ display: "block" }}>
              {c.name}
              <p style={{ marginTop: 10, fontSize: 16, fontWeight: 500, fontStretch: "100%", letterSpacing: 0, lineHeight: 1.5, color: "#D9D9D9" }}>
                {c.text}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Bio ─────────────────────────────────────────────────────────── */}
      <section className="l-group" aria-labelledby="bio-title" style={{ paddingTop: 56 }}>
        <div className="l-split">
          <div>
            <h2 id="bio-title" className="l-h3" style={{ marginBottom: 22 }}>
              An ex-tester in the driver&apos;s seat with you.
            </h2>
            <div className="l-prose">
              <p>
                Conor is a highly experienced Approved Driving Instructor (ADI) and former RSA
                driving tester. Having worked in test centres across <strong>Tallaght</strong>,{" "}
                <strong>Dún Laoghaire</strong>, and the old <strong>Churchtown</strong> centre,
                he brings deep insight into what examiners look for on the day.
              </p>
              <p>
                With years in the industry, Conor combines professional standards with a calm,
                supportive teaching style. His background as an ex-tester means every lesson is
                focused not just on safe driving, but on preparing you to succeed under exam
                conditions.
              </p>
              <p>
                Whether you&apos;re completing your <strong>EDT programme</strong>, booking{" "}
                <strong>pre-test lessons</strong>, or looking for refresher sessions, every lesson
                is tailored to your goals and confidence level.
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

          {/* Image slot: swap in a headshot at /public/conor.jpg when one exists */}
          <figure className="l-panel" style={{ margin: 0, aspectRatio: "4 / 5", display: "grid", placeItems: "center", padding: 40 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Logo.jpg"
              alt="The Driving School Dublin"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </figure>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
