// app/about/page.tsx
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
    <>
      <div style={{ padding: "64px 22px" }}>

        {/* Eyebrow + heading */}
        <div className="section-label">
          <span className="num">—</span> About
        </div>
        <h1
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
          Meet <em style={{ fontStyle: "italic" }}>Conor.</em>
        </h1>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.55,
            letterSpacing: "-0.1px",
            color: "var(--ink-2)",
            maxWidth: 480,
            marginBottom: 56,
          }}
        >
          Your RSA-approved ADI and former driving tester. Years of experience helping
          Dublin learners pass with confidence.
        </p>

        {/* Hairline rule */}
        <div style={{ borderTop: "1px solid var(--rule)", marginBottom: 48 }} />

        {/* Bio + image */}
        <div
          className="md:grid md:gap-14"
          style={{ gridTemplateColumns: "1.1fr 1fr" } as React.CSSProperties}
        >
          <div style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontFamily: "var(--font-instrument-serif), Georgia, serif",
                fontWeight: 400,
                fontSize: 28,
                lineHeight: 1.15,
                letterSpacing: "-0.5px",
                marginBottom: 20,
                color: "var(--ink)",
              }}
            >
              An ex-tester in the driver&apos;s seat with you
            </h2>

            <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink-2)", marginBottom: 16 }}>
              Conor is a highly experienced Approved Driving Instructor (ADI) and former RSA
              driving tester. Having worked in test centres across{" "}
              <strong style={{ color: "var(--ink)", fontWeight: 600 }}>Tallaght</strong>,{" "}
              <strong style={{ color: "var(--ink)", fontWeight: 600 }}>Dún Laoghaire</strong>, and
              the old{" "}
              <strong style={{ color: "var(--ink)", fontWeight: 600 }}>Churchtown</strong> centre,
              he brings deep insight into what examiners look for on the day.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink-2)", marginBottom: 16 }}>
              With years in the industry, Conor combines professional standards with a calm,
              supportive teaching style. His background as an ex-tester means every lesson is
              focused not just on safe driving, but on preparing you to succeed under exam
              conditions.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink-2)", marginBottom: 32 }}>
              Whether you&apos;re completing your{" "}
              <strong style={{ color: "var(--ink)", fontWeight: 600 }}>EDT programme</strong>,
              booking{" "}
              <strong style={{ color: "var(--ink)", fontWeight: 600 }}>pre-test lessons</strong>,
              or looking for refresher sessions, every lesson is tailored to your goals and
              confidence level.
            </p>

            {/* Highlights — hairline-separated list */}
            <div style={{ borderTop: "1px solid var(--rule)" }}>
              {[
                "Patient, structured instruction",
                "Manual lessons in dual-control instructor car",
                "Specialist in EDT and pre-tests",
                "Flexible scheduling across South Dublin",
              ].map((h) => (
                <div
                  key={h}
                  style={{
                    padding: "14px 0",
                    borderBottom: "1px solid var(--rule)",
                    fontSize: 15,
                    color: "var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ color: "var(--red)", fontSize: 13, flexShrink: 0 }}>—</span>
                  {h}
                </div>
              ))}
            </div>
          </div>

          {/* Image — drop a professional headshot at /public/conor.jpg */}
          <div
            style={{
              borderRadius: 8,
              overflow: "hidden",
              aspectRatio: "4 / 5",
              background: "var(--tint)",
              border: "1px solid var(--rule)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Logo.jpg"
              alt="The Driving School Dublin"
              style={{ width: "100%", height: "100%", objectFit: "contain", opacity: 0.85 }}
            />
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
