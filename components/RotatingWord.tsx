"use client";
// components/RotatingWord.tsx — cycles through a list of words with a fade transition
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
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (words.length < 2) return;
    let ticks = 0;
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        ticks += 1;
        setIdx((i) => (i + 1) % words.length);
        setFading(false);
        // After cycling through every word once we land back on index 0 — stop.
        if (loopOnce && ticks >= words.length) clearInterval(id);
      }, 280);
    }, intervalMs);
    return () => clearInterval(id);
  }, [words.length, intervalMs, loopOnce]);

  return (
    <span
      className={`rotating-word ${fading ? "fading" : ""} ${className}`}
      style={style}
      aria-live="polite"
    >
      {words[idx]}
    </span>
  );
}
