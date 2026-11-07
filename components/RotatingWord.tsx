"use client";
// components/RotatingWord.tsx — cycles through a list of words; each new word lifts in over the last, so the slot is never empty
import { useEffect, useState } from "react";

type Props = {
  words: string[];
  intervalMs?: number;
  className?: string;
  style?: React.CSSProperties;
  /** If true, cycle through every word exactly once and end on the starting word. Default: true */
  loopOnce?: boolean;
};

export default function RotatingWord({
  words,
  intervalMs = 3500,
  className = "",
  style,
  loopOnce = true,
}: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (words.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ticks = 0;
    const id = setInterval(() => {
      ticks += 1;
      setIdx((i) => (i + 1) % words.length);
      // After cycling through every word once we land back on index 0, then stop.
      if (loopOnce && ticks >= words.length) clearInterval(id);
    }, intervalMs);
    return () => clearInterval(id);
  }, [words.length, intervalMs, loopOnce]);

  return (
    <span
      key={idx}
      className={`rotating-word entering ${className}`}
      style={style}
      aria-live="polite"
    >
      {words[idx]}
    </span>
  );
}
