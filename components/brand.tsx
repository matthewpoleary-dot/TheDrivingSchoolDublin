/**
 * Brand primitives.
 *
 * The plate is the whole system: a red letter on a white square, tilted, the
 * way an L-plate sits taped to a windscreen. It marks the logo, section
 * numbers and status. Everything else is rules, weight and space.
 */

import Link from "next/link";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// The plate
// ---------------------------------------------------------------------------

export function Plate({
  letter,
  size = "md",
  tone = "plate",
  className = "",
}: {
  letter: string;
  size?: "sm" | "md" | "lg";
  tone?: "plate" | "ink";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`plate plate-${size} ${tone === "ink" ? "plate-ink" : ""} ${className}`}
    >
      {letter}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Wordmark
// ---------------------------------------------------------------------------

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline leading-none ${className}`}>
      <span className="font-extrabold tracking-[-0.03em]">
        The Driving Schoo
        <span className="text-plate">L</span>
      </span>
      <span className="ml-[0.3em] font-extrabold tracking-[-0.03em]">
        Dubli<span className="text-plate">N</span>
      </span>
    </span>
  );
}

export function LogoLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 ${className}`}
      aria-label="The Driving School Dublin, home"
    >
      {/* Must never wrap: a two-line signage lockup stops reading as a sign.
          Tracking and size step down on narrow screens instead. */}
      <span className="flex items-center whitespace-nowrap">
        <span className="bg-ink px-1.5 py-1.5 text-[0.5625rem] font-extrabold leading-none tracking-[0.1em] text-white sm:px-2 sm:text-[0.6875rem] sm:tracking-[0.14em]">
          THE DRIVING SCHOOL
        </span>
        <span className="bg-plate px-1.5 py-1.5 text-[0.5625rem] font-extrabold leading-none tracking-[0.1em] text-white sm:px-2 sm:text-[0.6875rem] sm:tracking-[0.14em]">
          DUBLIN
        </span>
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Layout scaffolding
// ---------------------------------------------------------------------------

export function Container({
  children,
  size = "default",
  className = "",
}: {
  children: ReactNode;
  size?: "default" | "narrow" | "wide";
  className?: string;
}) {
  const width =
    size === "narrow" ? "max-w-2xl" : size === "wide" ? "max-w-6xl" : "max-w-5xl";
  return <div className={`mx-auto w-full ${width} px-5 sm:px-6 ${className}`}>{children}</div>;
}

/**
 * A titled band of the page. The number is set as a plate, so the page reads
 * like a numbered route rather than a stack of identical cards.
 */
export function Section({
  number,
  eyebrow,
  title,
  intro,
  children,
  className = "",
  id,
}: {
  number?: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-14 sm:py-20 ${className}`}>
      <Container>
        <div className="rule-heavy pt-6">
          <div className="flex items-start gap-4">
            {number && <Plate letter={number} size="md" tone="ink" className="mt-1" />}
            <div className="min-w-0 flex-1">
              {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
              <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-[1.04] tracking-[-0.025em]">
                {title}
              </h2>
              {intro && (
                <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-soft">{intro}</p>
              )}
            </div>
          </div>
          <div className="mt-9">{children}</div>
        </div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function Chevrons({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`chevrons ${className}`} />;
}

export function Check({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 flex-none ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d="M4 10.5 8 14.5 16 5.5" />
    </svg>
  );
}

export function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 flex-none ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d="M3 10h13M11 5l5 5-5 5" />
    </svg>
  );
}

/** Bulleted list with plate-red ticks. */
export function TickList({
  items,
  className = "",
}: {
  items: readonly string[];
  className?: string;
}) {
  return (
    <ul className={`space-y-2.5 ${className}`}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-[0.9375rem] leading-relaxed">
          <Check className="mt-1 text-plate" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Big number with a caption, used for the credibility strip. */
export function Stat({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="border-t-2 border-ink pt-3">
      <p className="tabular text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-none tracking-[-0.03em]">
        {value}
      </p>
      <p className="mt-1.5 text-sm font-bold">{label}</p>
      {sub && <p className="mt-0.5 text-sm text-ink-soft">{sub}</p>}
    </div>
  );
}
