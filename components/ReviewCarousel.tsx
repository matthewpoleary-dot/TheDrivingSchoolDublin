"use client";
// components/ReviewCarousel.tsx — rotating review quote. Swipe or tap a dot to move; a visible
// pause button stops it (WCAG 2.2.2), and it also pauses on hover, focus and reduced motion.
import { useState, useEffect, useRef, useCallback } from "react";
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
  // Hover and focus pause for as long as they last; the button (or a swipe) stops it for good.
  const [hovered, setHovered] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const swipeX = useRef<number | null>(null);

  useEffect(() => {
    setCanPlay(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const goTo = useCallback((next: number) => {
    setFading(true);
    setTimeout(() => {
      setIdx((next + REVIEWS.length) % REVIEWS.length);
      setFading(false);
    }, 350);
  }, []);

  const playing = canPlay && !stopped && !hovered;

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => goTo(idx + 1), 5000);
    return () => clearInterval(timer);
  }, [playing, idx, goTo]);

  const r = REVIEWS[idx];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <figure
        className="l-quote-wrap"
        data-fading={fading}
        style={{ margin: 0, touchAction: "pan-y" }}
        onPointerDown={(e) => { if (e.pointerType !== "mouse") swipeX.current = e.clientX; }}
        onPointerUp={(e) => {
          if (swipeX.current === null) return;
          const dx = e.clientX - swipeX.current;
          swipeX.current = null;
          if (Math.abs(dx) < 40) return;
          setStopped(true);
          goTo(idx + (dx < 0 ? 1 : -1));
        }}
        onPointerCancel={() => { swipeX.current = null; }}
      >
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
            onClick={() => goTo(i)}
            aria-label={`Review ${i + 1}`}
          >
            <span />
          </button>
        ))}
        {canPlay && (
          <button
            type="button"
            className="l-carousel__pause"
            onClick={() => setStopped((v) => !v)}
          >
            {stopped ? "Play" : "Pause"}
          </button>
        )}
      </div>

      <p style={{ marginTop: 20 }}>
        <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="l-link" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          Read all 54 reviews on Google <ArrowRight size={16} />
        </a>
      </p>
    </div>
  );
}
