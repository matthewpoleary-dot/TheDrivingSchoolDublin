"use client";
// components/MorphingNav.tsx — flat full-width bar at top, morphs to floating pill on scroll
import { useEffect, useState } from "react";
import Link from "next/link";

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
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        padding: scrolled ? "12px 16px" : "0",
        transition: "padding 0.28s ease",
      }}
    >
      <div
        className={`nav-shell mx-auto flex items-center justify-between ${
          scrolled ? "nav-pill" : "nav-flat"
        }`}
      >
        {/* Logo */}
        <Link
          href="/"
          className="text-[14px] md:text-[15px] font-semibold shrink-0"
          style={{
            color: "var(--ink)",
            textDecoration: "none",
            letterSpacing: "-0.2px",
            position: "relative",
            zIndex: 1,
          }}
          aria-label="The Driving School Dublin, Home"
        >
          The <span style={{ color: "var(--red)" }}>Driving</span> School
          <span className="hidden sm:inline"> Dublin</span>
        </Link>

        {/* Centre links — hidden on mobile */}
        <div
          className="hidden md:flex items-center"
          style={{ gap: 28, position: "relative", zIndex: 1 }}
        >
          <Link href="/prices" className="nav-link">Prices</Link>
          <Link href="/#process" className="nav-link">Process</Link>
          <Link href="/#reviews" className="nav-link">Reviews</Link>
          <Link href="/about" className="nav-link">About</Link>
        </div>

        {/* Right CTA */}
        <Link
          href="/book"
          className="btn-primary shrink-0"
          style={{
            padding: "9px 18px",
            fontSize: 13,
            position: "relative",
            zIndex: 1,
          }}
        >
          Book a lesson →
        </Link>
      </div>
    </header>
  );
}
