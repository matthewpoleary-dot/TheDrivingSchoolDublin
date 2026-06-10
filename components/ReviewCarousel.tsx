"use client";
// components/ReviewCarousel.tsx — rotating editorial pullquote
import { useState, useEffect } from "react";

const GOOGLE_REVIEWS_URL = "https://share.google/Gz174ck7VeSpDSx5L";

const REVIEWS = [
  {
    quote: (
      <>
        Conor knows the test{" "}
        <em style={{ fontStyle: "italic" }}>inside out</em> and gives you clear,
        practical guidance on exactly what examiners are looking for. Thanks to his
        expert teaching I passed first time.
      </>
    ),
    plainQuote:
      "Conor knows the test inside out and gives you clear, practical guidance on exactly what examiners are looking for. Thanks to his expert teaching I passed first time.",
    attribution: "Awais A. · Local Guide · January 2026",
  },
  {
    quote: (
      <>
        Conor is a very experienced and patient driving instructor that helped me go
        from <em style={{ fontStyle: "italic" }}>zero driving experience to fully licenced.</em>{" "}
        He gave me the confidence and tools to practise before the test.
      </>
    ),
    plainQuote:
      "Conor is a very experienced and patient driving instructor that helped me go from zero driving experience to fully licenced. He gave me the confidence and tools to practise before the test.",
    attribution: "David Downes · February 2026",
  },
  {
    quote: (
      <>
        The best driving instructor you could ask for. After trying a few instructors,
        Conor had me <em style={{ fontStyle: "italic" }}>ready for the test in a few short lessons.</em>{" "}
        I could not recommend him more highly.
      </>
    ),
    plainQuote:
      "The best driving instructor you could ask for. After trying a few instructors, Conor had me ready for the test in a few short lessons. I could not recommend him more highly.",
    attribution: "Robbie Glynn · July 2025",
  },
];

export default function ReviewCarousel() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % REVIEWS.length);
        setFading(false);
      }, 350);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const r = REVIEWS[idx];

  return (
    <div>
      <span
        aria-hidden="true"
        style={{
          fontFamily: "var(--font-instrument-serif), Georgia, serif",
          fontStyle: "italic",
          fontSize: 64,
          color: "var(--red)",
          lineHeight: 0.8,
          display: "block",
          marginBottom: 8,
        }}
      >
        &ldquo;
      </span>

      <p
        style={{
          fontFamily: "var(--font-instrument-serif), Georgia, serif",
          fontSize: 24,
          lineHeight: 1.3,
          letterSpacing: "-0.5px",
          color: "var(--ink)",
          marginBottom: 24,
          maxWidth: 640,
          opacity: fading ? 0 : 1,
          transition: "opacity 0.35s ease",
        }}
      >
        {r.quote}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 13,
          color: "var(--ink-2)",
          opacity: fading ? 0 : 1,
          transition: "opacity 0.35s ease",
        }}
      >
        <span style={{ display: "inline-block", width: 24, height: 1, background: "var(--ink)", flexShrink: 0 }} />
        {r.attribution}
      </div>

      {/* Dot indicators */}
      <div style={{ display: "flex", gap: 6, marginTop: 24 }}>
        {REVIEWS.map((_, i) => (
          <button
            key={i}
            onClick={() => { setFading(true); setTimeout(() => { setIdx(i); setFading(false); }, 350); }}
            style={{
              width: i === idx ? 20 : 6,
              height: 6,
              borderRadius: 100,
              background: i === idx ? "var(--red)" : "var(--rule-strong)",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "width 0.3s ease, background 0.3s ease",
            }}
            aria-label={`Review ${i + 1}`}
          />
        ))}
      </div>

      <div style={{ marginTop: 28 }}>
        <a
          href={GOOGLE_REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 13, color: "var(--ink-2)", textDecoration: "underline", textUnderlineOffset: 4 }}
        >
          View all 54 verified reviews on Google Maps →
        </a>
      </div>
    </div>
  );
}
