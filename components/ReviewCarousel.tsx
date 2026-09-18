"use client";
// components/ReviewCarousel.tsx — rotating review quote, pauses on hover, focus and reduced motion
import { useState, useEffect } from "react";
import { ArrowRight } from "@/components/lton/Icons";

const GOOGLE_REVIEWS_URL = "https://share.google/Gz174ck7VeSpDSx5L";

const REVIEWS = [
  {
    quote: (
      <>
        Conor knows the test <mark>inside out</mark> and gives you clear, practical
        guidance on exactly what examiners are looking for. Thanks to his expert
        teaching I passed first time.
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
        from <mark>zero driving experience to fully licenced.</mark> He gave me the
        confidence and tools to practise before the test.
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
        Conor had me <mark>ready for the test in a few short lessons.</mark> I could not
        recommend him more highly.
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
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % REVIEWS.length);
        setFading(false);
      }, 350);
    }, 5000);
    return () => clearInterval(timer);
  }, [paused]);

  const r = REVIEWS[idx];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <figure className="l-quote-wrap" data-fading={fading} style={{ margin: 0 }}>
        <blockquote className="l-quote">&ldquo;{r.quote}&rdquo;</blockquote>
        <figcaption className="l-cite">{r.attribution}</figcaption>
      </figure>

      <div className="l-carousel__controls">
        {REVIEWS.map((_, i) => (
          <button
            key={i}
            type="button"
            className="l-dot"
            aria-current={i === idx}
            onClick={() => { setFading(true); setTimeout(() => { setIdx(i); setFading(false); }, 350); }}
            aria-label={`Review ${i + 1}`}
          >
            <span />
          </button>
        ))}
      </div>

      <p style={{ marginTop: 20 }}>
        <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="l-link" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          Read all 54 reviews on Google <ArrowRight size={16} />
        </a>
      </p>
    </div>
  );
}
