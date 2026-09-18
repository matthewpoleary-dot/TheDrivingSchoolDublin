"use client";
// components/lton/FlipPlate.tsx — an L plate that turns into an N plate when it scrolls into view
import { useEffect, useRef, useState } from "react";

export default function FlipPlate() {
  const ref = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFlipped(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFlipped(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="l-flip" data-flipped={flipped} aria-hidden="true">
      <div className="l-flip__card">
        <div className="l-flip__face">
          <div className="l-plate"><span>L</span></div>
        </div>
        <div className="l-flip__face l-flip__face--back">
          <div className="l-plate"><span>N</span></div>
        </div>
      </div>
    </div>
  );
}
