// app/reviews/page.tsx
import Link from "next/link";

type Review = {
  name: string;
  badge?: string;     // e.g. "Local Guide"
  date: string;       // yyyy-mm-dd
  rating: number;
  text: string;
};

const GOOGLE_REVIEWS_URL = "https://share.google/Gz174ck7VeSpDSx5L";

const REVIEWS: Review[] = [
  {
    name: "Awais Aitmad",
    badge: "Local Guide",
    date: "2026-01-05",
    rating: 5,
    text:
      "Conor is a fantastic driving instructor who made the whole process of learning and passing my test so much easier. He knows the test inside out and gives you clear, practical guidance on exactly what examiners are looking for, while also making sure you're learning the skills you'll actually need to be a safe, confident driver in everyday life. His patience and calm approach mean you never feel pressured — mistakes are just opportunities to learn, and he explains everything in a way that sticks. Each lesson was well-structured, packed with useful tips, and his mock tests were so accurate they made the real exam feel familiar. Thanks to his expert teaching I passed first time. If you're looking for someone who'll not only get you through the test but also teach you how to drive properly for the long run, Conor is the instructor you want.",
  },
  {
    name: "David Downes",
    date: "2026-02-10",
    rating: 5,
    text:
      "Conor is a very experienced & patient driving instructor that helped me go from zero driving experience to fully licenced. He was a massive help to me across the 12 lessons, gave me the confidence & tools to practice driving before the test. When the test date arrived he set me up for success with as well the knowledge of whats under the bonnet & required to know on the day. I highly recommend Conor.",
  },
  {
    name: "Robbie Glynn",
    date: "2025-07-10",
    rating: 5,
    text:
      "The best Driving Instructor you could ask for. After trying a few instructors out over a long period of time, I found The Driving School Dublin. Conor had me ready for the test in a few short lessons. A complete professional and made sure that when I went to sit the test I arrived confident and assured with each element. I could not recommend him more highly.",
  },
];

const SECTION_STYLE: React.CSSProperties = {
  padding: "64px 22px",
  borderTop: "1px solid var(--rule)",
};

export const metadata = {
  title: "Reviews | The Driving School Dublin",
  description:
    "Real Google reviews from Dublin learners who passed their test with Conor at The Driving School Dublin.",
};

// Star row using SVG, brand red
function Stars({ count }: { count: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 3 }} aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 20 20" fill="var(--red)" aria-hidden="true">
          <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.77l-5.2 2.74.99-5.79L1.58 7.62l5.82-.85L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "The Driving School Dublin",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: REVIEWS.length,
      bestRating: "5",
      worstRating: "1",
    },
    review: REVIEWS.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      reviewBody: r.text,
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: "5" },
      datePublished: r.date,
    })),
  };

  return (
    <>
      {/* Header */}
      <div style={{ padding: "64px 22px 48px" }}>
        <div className="section-label">
          <span className="num">—</span> Reviews
        </div>
        <h1
          style={{
            fontFamily: "var(--font-instrument-serif), Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(48px, 7vw, 88px)",
            lineHeight: 1.02,
            letterSpacing: "-2px",
            marginBottom: 18,
            color: "var(--ink)",
          }}
        >
          From <em style={{ fontStyle: "italic" }}>real learners.</em>
        </h1>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.55,
            letterSpacing: "-0.1px",
            color: "var(--ink-2)",
            maxWidth: 480,
            marginBottom: 12,
          }}
        >
          Verified Google reviews from Dublin learners who passed with Conor.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <Stars count={5} />
          <span style={{ fontSize: 14, color: "var(--ink-2)" }}>
            5.0 average · sourced from{" "}
            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--red)", textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              Google
            </a>
          </span>
        </div>
      </div>

      {/* Reviews */}
      <section style={SECTION_STYLE}>
        {REVIEWS.map((r, i) => (
          <article
            key={r.name}
            style={{
              padding: "40px 0",
              borderTop: i === 0 ? "1px solid var(--rule)" : "none",
              borderBottom: "1px solid var(--rule)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <Stars count={r.rating} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                }}
              >
                {new Date(r.date).toLocaleDateString("en-IE", { month: "long", year: "numeric" })}
              </span>
            </div>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.55,
                color: "var(--ink)",
                marginBottom: 20,
                maxWidth: 720,
              }}
            >
              &ldquo;{r.text}&rdquo;
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 14,
                color: "var(--ink-2)",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 24,
                  height: 1,
                  background: "var(--ink)",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 500, color: "var(--ink)" }}>{r.name}</span>
              {r.badge && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.6px",
                    textTransform: "uppercase",
                    color: "var(--red)",
                    border: "1px solid var(--red)",
                    borderRadius: 100,
                    padding: "3px 8px",
                    lineHeight: 1,
                  }}
                >
                  {r.badge}
                </span>
              )}
            </div>
          </article>
        ))}
      </section>

      {/* Closing CTA */}
      <section
        style={{
          borderTop: "1px solid var(--rule)",
          padding: "72px 22px 64px",
          textAlign: "center",
        }}
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
          Ready to <em style={{ fontStyle: "italic" }}>join them?</em>
        </h2>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            marginTop: 24,
            flexWrap: "wrap",
          }}
        >
          <Link href="/book" className="btn-primary">Book a lesson</Link>
          <Link href="/prices" className="btn-ghost">View prices</Link>
        </div>
        <p style={{ marginTop: 28, fontSize: 13, color: "var(--ink-3)" }}>
          See all reviews on{" "}
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--red)", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Google
          </a>
          .
        </p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
