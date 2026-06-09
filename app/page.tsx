// app/page.tsx
import Link from "next/link";
import StickyCTA from "@/components/StickyCTA";
import ReviewCarousel from "@/components/ReviewCarousel";

export const metadata = {
  title: "Driving Lessons Dublin | RSA-Approved ADI | The Driving School Dublin",
  description:
    "Professional driving lessons across Dublin. RSA-approved ADI, manual & automatic, EDT packages, pre-test sessions. Flexible scheduling. Book your lesson today.",
};

const SECTION_STYLE = {
  padding: "64px 22px",
  borderTop: "1px solid var(--rule)",
} as React.CSSProperties;


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
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div
        className="grid md:grid-cols-[1fr_auto] md:items-center md:gap-16"
        style={{ padding: "72px 22px 88px" }}
      >
        {/* Left: text */}
        <div>
          <h1
            style={{
              fontFamily: "var(--font-instrument-serif), Georgia, serif",
              fontWeight: 400,
              fontSize: "clamp(56px, 8vw, 96px)",
              lineHeight: 1.02,
              letterSpacing: "-1.5px",
              marginBottom: 28,
              color: "var(--ink)",
            }}
          >
            Pass your test.<br />
            <em style={{ fontStyle: "italic" }}>First time.</em>
          </h1>

          <p
            style={{
              fontSize: 17,
              lineHeight: 1.55,
              letterSpacing: "-0.1px",
              color: "var(--ink-2)",
              maxWidth: 360,
              marginBottom: 36,
            }}
          >
            Manual lessons in my car. Automatic in yours. Across Dublin.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/book" className="btn-primary">Book a lesson</Link>
            <Link href="/prices" className="btn-ghost">View prices</Link>
          </div>
        </div>

        {/* Right: logo — desktop only */}
        <div className="hidden md:block" style={{ width: 260, flexShrink: 0 }}>
          <div
            style={{
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid var(--rule)",
              background: "white",
              padding: 24,
              aspectRatio: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Logo.jpg"
              alt="The Driving School Dublin"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        </div>
      </div>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section
        id="pricing"
        style={{ ...SECTION_STYLE }}
        className="md:py-24"
      >
        <div className="section-label">
          <span className="num">01</span> Pricing
        </div>
        <h2
          style={{
            fontFamily: "var(--font-instrument-serif), Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(40px, 5vw, 64px)",
            lineHeight: 1.05,
            letterSpacing: "-1px",
            marginBottom: 14,
            color: "var(--ink)",
          }}
        >
          Clear costs,<br />no{" "}
          <em style={{ fontStyle: "italic" }}>surprises.</em>
        </h2>
        <p
          style={{
            fontSize: 16,
            letterSpacing: "-0.1px",
            color: "var(--ink-2)",
            maxWidth: 340,
            marginBottom: 44,
          }}
        >
          Every price upfront. No hidden fees, no awkward conversations.
        </p>

        {/* Price row: Standard Lesson */}
        <div
          style={{
            padding: "24px 0",
            borderTop: "1px solid var(--rule)",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
              <h3 style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.2px" }}>
                Standard Lesson
              </h3>
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 230 }}>
              Manual in my dual-control car, or I&apos;ll sit with you in your own automatic.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "var(--font-instrument-serif), Georgia, serif",
                fontSize: 34,
                lineHeight: 1,
                letterSpacing: "-1px",
                color: "var(--ink)",
              }}
            >
              €80
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>per hour</div>
          </div>
        </div>

        {/* Price row: Pre-Test Lesson */}
        <div
          style={{
            padding: "24px 0",
            borderTop: "1px solid var(--rule)",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
              <h3 style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.2px" }}>
                Pre-Test Lesson
              </h3>
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 230 }}>
              An hour on the actual test route, going through the manoeuvres you&apos;ll be asked to do.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "var(--font-instrument-serif), Georgia, serif",
                fontSize: 34,
                lineHeight: 1,
                letterSpacing: "-1px",
                color: "var(--ink)",
              }}
            >
              €100
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>per session</div>
          </div>
        </div>

        {/* Price row: EDT Bundle */}
        <div
          style={{
            padding: "24px 0",
            borderTop: "1px solid var(--rule)",
            borderBottom: "1px solid var(--rule)",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
              <h3 style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.2px" }}>
                EDT Bundle
              </h3>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--red)",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  padding: "3px 7px",
                  border: "1px solid var(--red)",
                  borderRadius: 100,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                Best value
              </span>
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 230 }}>
              Full 12-lesson EDT programme. Includes logbook. Split payment available.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "var(--font-instrument-serif), Georgia, serif",
                fontSize: 34,
                lineHeight: 1,
                letterSpacing: "-1px",
                color: "var(--ink)",
              }}
            >
              €905
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>12 lessons</div>
          </div>
        </div>

        {/* Pricing CTA */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 16 }}>
            Ready to book a lesson?
          </p>
          <Link
            href="/book"
            className="btn-primary"
            style={{ display: "inline-flex", padding: "14px 28px" }}
          >
            Book now →
          </Link>
        </div>
      </section>

      {/* ── PROCESS ───────────────────────────────────────────────────────── */}
      <section id="process" style={SECTION_STYLE} className="md:py-24">
        <div className="section-label">
          <span className="num">02</span> Process
        </div>
        <h2
          style={{
            fontFamily: "var(--font-instrument-serif), Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(40px, 5vw, 64px)",
            lineHeight: 1.05,
            letterSpacing: "-1px",
            marginBottom: 14,
            color: "var(--ink)",
          }}
        >
          How it <em style={{ fontStyle: "italic" }}>works.</em>
        </h2>
        <p
          style={{
            fontSize: 16,
            letterSpacing: "-0.1px",
            color: "var(--ink-2)",
            maxWidth: 340,
            marginBottom: 44,
          }}
        >
          From your first message to your first lesson.
        </p>

        {/* Step i */}
        <div
          style={{
            padding: "28px 0",
            borderTop: "1px solid var(--rule)",
            display: "grid",
            gridTemplateColumns: "36px 1fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-instrument-serif), Georgia, serif",
              fontStyle: "italic",
              fontSize: 22,
              color: "var(--red)",
              paddingTop: 2,
            }}
          >
            i.
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 6, letterSpacing: "-0.2px" }}>
              Pick your lesson type
            </h3>
            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6 }}>
              Standard hour, EDT bundle, pre-test, or car hire for test day.
            </p>
          </div>
        </div>

        {/* Step ii */}
        <div
          style={{
            padding: "28px 0",
            borderTop: "1px solid var(--rule)",
            display: "grid",
            gridTemplateColumns: "36px 1fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-instrument-serif), Georgia, serif",
              fontStyle: "italic",
              fontSize: 22,
              color: "var(--red)",
              paddingTop: 2,
            }}
          >
            ii.
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 6, letterSpacing: "-0.2px" }}>
              Pick a time that suits
            </h3>
            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6 }}>
              See all available slots on a live calendar and book the one that fits.
            </p>
          </div>
        </div>

        {/* Step iii */}
        <div
          style={{
            padding: "28px 0",
            borderTop: "1px solid var(--rule)",
            borderBottom: "1px solid var(--rule)",
            display: "grid",
            gridTemplateColumns: "36px 1fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-instrument-serif), Georgia, serif",
              fontStyle: "italic",
              fontSize: 22,
              color: "var(--red)",
              paddingTop: 2,
            }}
          >
            iii.
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 6, letterSpacing: "-0.2px" }}>
              Pay and you&apos;re confirmed
            </h3>
            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6 }}>
              Pay securely online and receive a confirmation by email. Usually back to you within a few hours.
            </p>
          </div>
        </div>
      </section>

      {/* ── REVIEWS ───────────────────────────────────────────────────────── */}
      <section id="reviews" style={SECTION_STYLE} className="md:py-24">
        <div className="section-label">
          <span className="num">03</span> From our students
        </div>

        <ReviewCarousel />
      </section>

      {/* ── CLOSING CTA ───────────────────────────────────────────────────── */}
      <section
        style={{
          borderTop: "1px solid var(--rule)",
          padding: "72px 22px 64px",
          textAlign: "center",
        }}
        className="md:py-24"
      >
        <h2
          style={{
            fontFamily: "var(--font-instrument-serif), Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(36px, 4vw, 56px)",
            lineHeight: 1.05,
            letterSpacing: "-1px",
            marginBottom: 16,
            color: "var(--ink)",
          }}
        >
          Ready to <em style={{ fontStyle: "italic" }}>book?</em>
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--ink-2)",
            marginBottom: 28,
            maxWidth: 400,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Get in touch — we&apos;ll have you on the road in days, not weeks.
        </p>
        <Link
          href="/book"
          className="btn-primary"
          style={{ display: "inline-flex", padding: "14px 32px" }}
        >
          Book a lesson
        </Link>
      </section>

      {/* Sticky mobile bottom bar */}
      <StickyCTA />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
