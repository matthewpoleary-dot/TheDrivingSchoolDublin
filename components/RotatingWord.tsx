"use client";
// components/RotatingWord.tsx — cycles through a list of words with a fade transition
import { useEffect, useState } from "react";

type Props = {
  words: string[];
  intervalMs?: number;
  className?: string;
  style?: React.CSSProperties;
};

export default function RotatingWord({
  words,
  intervalMs = 3500,
  className = "",
  style,
}: Props) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (words.length < 2) return;
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % words.length);
        setFading(false);
      }, 280);
    }, intervalMs);
    return () => clearInterval(id);
  }, [words.length, intervalMs]);

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
