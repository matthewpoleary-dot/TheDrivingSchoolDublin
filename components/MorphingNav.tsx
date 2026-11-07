"use client";
// components/MorphingNav.tsx — flat full-width bar at top, morphs into a floating plate on scroll
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@/components/lton/Icons";

const SCROLL_THRESHOLD = 8;

export default function MorphingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > SCROLL_THRESHOLD);
        frame = 0;
      });
    };
    // Initialize correctly on mount (in case we land mid-page)
    setScrolled(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header className="l-nav" data-scrolled={scrolled}>
      <nav className="l-nav__shell" aria-label="Main">
        <Link href="/" className="l-wordmark" aria-label="The Driving School Dublin, Home">
          The Driving Schoo<b>L</b>
          <br />
          Dubli<b>N</b>
        </Link>

        <div className="l-nav__links">
          <Link href="/prices" className="l-nav__link">Prices</Link>
          <Link href="/#lessons" className="l-nav__link">Lessons</Link>
          <Link href="/reviews" className="l-nav__link">Reviews</Link>
          <Link href="/about" className="l-nav__link">About</Link>
        </div>

        <Link href="/contact" className="l-btn l-btn--red">
          Contact us <ArrowRight size={16} />
        </Link>
      </nav>
    </header>
  );
}
