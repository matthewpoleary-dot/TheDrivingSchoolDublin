"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "tdsd-brand-intro-seen";

/**
 * A short, one-time brand reveal for a visitor's current browser session.
 *
 * It is intentionally cosmetic: the page is already rendered underneath it,
 * there is no network-dependent spinner, and reduced-motion visitors never
 * see it. This gives the opening a little ceremony without making anyone wait
 * for content that is already available.
 */
export default function BrandIntro() {
  const [phase, setPhase] = useState<"enter" | "exit" | "gone">("enter");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = window.sessionStorage.getItem(SEEN_KEY) === "1";

    if (reducedMotion || seen) {
      setPhase("gone");
      return;
    }

    window.sessionStorage.setItem(SEEN_KEY, "1");
    const leave = window.setTimeout(() => setPhase("exit"), 850);
    const remove = window.setTimeout(() => setPhase("gone"), 1250);

    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(remove);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div className={`brand-intro brand-intro-${phase}`} aria-hidden="true">
      <p className="brand-intro-kicker">Dublin · RSA-approved tuition</p>
      <div className="brand-intro-lockup">
        <span className="brand-intro-ink">The Driving School</span>
        <span className="brand-intro-red">Dublin</span>
      </div>
      <div className="brand-intro-route">
        <span />
        <i>L</i>
        <span />
        <i>N</i>
        <span />
      </div>
    </div>
  );
}
