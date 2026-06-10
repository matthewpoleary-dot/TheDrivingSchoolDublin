// app/prices/page.tsx
import Link from "next/link";
import FAQ from "@/components/FAQ";

type PriceRow = {
  title: string;
  description: string;
  price: string;
  unit: string;
  service: string;
  tag?: string;
  note?: string;
};

const PRIMARY: PriceRow[] = [
  {
    title: "Standard Lesson",
    description: "One-to-one tuition in a fully-equipped dual-control car. Mon to Fri.",
    price: "€80",
    unit: "per hour",
    service: "standard",
    note: "Evening and weekend slots on request, limited availability.",
  },
  {
    title: "Pre-Test Lesson",
    description: "Mock test route, manoeuvres, and examiner feedback. Mon to Fri.",
    price: "€100",
    unit: "per session",
    service: "pre-test",
    note: "Weekend sessions on request.",
  },
  {
    title: "Refresher Lessons",
    description: "For licensed drivers returning to the wheel after a break.",
    price: "€80",
    unit: "per hour",
    service: "refresher",
  },
];

const EDT_OPTIONS: PriceRow[] = [
  {
    title: "6 Reduced EDT Lessons",
    description: "The reduced EDT package. Six structured hours covering the syllabus.",
    price: "€455",
    unit: "6 lessons",
    service: "edt-6",
  },
  {
    title: "EDT Bundle, 12 lessons",
    description: "Full EDT programme paid up front. Personal booking link emailed instantly. Valid 12 months.",
    price: "€905",
    unit: "€75.42 / hour",
    service: "edt-bundle",
    tag: "Best value",
  },
  {
    title: "EDT Bundle, split payment",
    description: "Pay €475 now for lessons 1 to 6. Pay €475 again before lessons 7 to 12.",
    price: "€475 × 2",
    unit: "€950 total",
    service: "edt-split",
  },
];

const CAR_HIRE: PriceRow[] = [
  {
    title: "At the test centre",
    description: "Meet at the test centre. Roadworthy, fully insured car. Arrive early, paperwork checked.",
    price: "€150",
    unit: "test day",
    service: "car-hire-centre",
  },
  {
    title: "Local pickup and drop-off",
    description: "We collect you and drop you back. Roadworthy, fully insured car. Mon to Fri tests.",
    price: "€200",
    unit: "test day",
    service: "car-hire-local",
  },
  {
    title: "Car hire plus pre-test lesson",
    description: "A pre-test lesson the morning of, then the car for your test. The best preparation.",
    price: "€245",
    unit: "test day",
    service: "car-hire-lesson",
  },
];

const SECTION_STYLE = {
  padding: "64px 22px",
  borderTop: "1px solid var(--rule)",
} as React.CSSProperties;

function PriceRowComponent({ row, first }: { row: PriceRow; first: boolean }) {
  return (
    <div
      style={{
        padding: "28px 0",
        borderTop: first ? "1px solid var(--rule)" : "none",
        borderBottom: "1px solid var(--rule)",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 24,
        alignItems: "start",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
          <h3 style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.2px", color: "var(--ink)" }}>
            {row.title}
          </h3>
          {row.tag && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--red)",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                padding: "3px 7px",
                border: "1px solid var(--red)",
                borderRadius: 100,
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {row.tag}
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 460 }}>
          {row.description}
        </p>
        {row.note && (
          <p style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.55, marginTop: 6, maxWidth: 460, fontStyle: "italic" }}>
            {row.note}
          </p>
        )}
        <Link
          href={`/book?service=${row.service}`}
          className="btn-primary"
          style={{ display: "inline-flex", marginTop: 16, padding: "10px 18px", fontSize: 13 }}
        >
          Book this →
        </Link>
      </div>
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontFamily: "var(--font-instrument-serif), Georgia, serif",
            fontSize: 38,
            lineHeight: 1,
            letterSpacing: "-1.5px",
            color: "var(--ink)",
            whiteSpace: "nowrap",
          }}
        >
          {row.price}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6, whiteSpace: "nowrap" }}>
          {row.unit}
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Prices | The Driving School Dublin",
  description:
    "Transparent pricing for driving lessons in Dublin. Standard lessons, EDT packages, pre-test sessions, and car hire.",
};

export default function PricesPage() {
  return (
    <>
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div style={{ padding: "64px 22px 48px" }}>
        <div className="section-label">
          <span className="num">—</span> Pricing
        </div>
        <h1
          style={{
            fontFamily: "var(--font-instrument-serif), Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(48px, 7vw, 88px)",
            lineHeight: 1.02,
            letterSpacing: "-2px",
            marginBottom: 18,
            color: "var(--ink)",
          }}
        >
          Transparent <em style={{ fontStyle: "italic" }}>pricing.</em>
        </h1>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.55,
            letterSpacing: "-0.1px",
            color: "var(--ink-2)",
            maxWidth: 460,
          }}
        >
          Clear hourly rates and package deals. Pay securely online.
        </p>
      </div>

      {/* ── LESSONS ──────────────────────────────────────────────────────── */}
      <section style={SECTION_STYLE}>
        <div className="section-label">
          <span className="num">01</span> Lessons
        </div>
        {PRIMARY.map((p, i) => (
          <PriceRowComponent key={p.service} row={p} first={i === 0} />
        ))}
      </section>

      {/* ── EDT ──────────────────────────────────────────────────────────── */}
      <section style={SECTION_STYLE}>
        <div className="section-label">
          <span className="num">02</span> EDT Programmes
        </div>
        <h2
          style={{
            fontFamily: "var(--font-instrument-serif), Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(32px, 4vw, 48px)",
            lineHeight: 1.05,
            letterSpacing: "-1px",
            marginBottom: 14,
            color: "var(--ink)",
          }}
        >
          Essential Driver <em style={{ fontStyle: "italic" }}>Training.</em>
        </h2>
        <p
          style={{
            fontSize: 16,
            letterSpacing: "-0.1px",
            color: "var(--ink-2)",
            maxWidth: 520,
            marginBottom: 36,
          }}
        >
          The 12-lesson EDT programme is mandatory for new learner drivers in Ireland.
          We also offer the reduced 6-lesson option for eligible drivers.
        </p>

        {EDT_OPTIONS.map((p, i) => (
          <PriceRowComponent key={p.service} row={p} first={i === 0} />
        ))}
      </section>

      {/* ── CAR HIRE ─────────────────────────────────────────────────────── */}
      <section style={SECTION_STYLE}>
        <div className="section-label">
          <span className="num">03</span> Test day
        </div>
        <h2
          style={{
            fontFamily: "var(--font-instrument-serif), Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(32px, 4vw, 48px)",
            lineHeight: 1.05,
            letterSpacing: "-1px",
            marginBottom: 14,
            color: "var(--ink)",
          }}
        >
          Car hire for your <em style={{ fontStyle: "italic" }}>test.</em>
        </h2>
        <p
          style={{
            fontSize: 16,
            letterSpacing: "-0.1px",
            color: "var(--ink-2)",
            maxWidth: 460,
            marginBottom: 36,
          }}
        >
          Roadworthy, fully insured car. Three options to suit you. Mon to Fri tests, Saturday on request.
        </p>

        {CAR_HIRE.map((p, i) => (
          <PriceRowComponent key={p.service} row={p} first={i === 0} />
        ))}
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section style={SECTION_STYLE}>
        <FAQ />
      </section>

      {/* ── CLOSING CTA ──────────────────────────────────────────────────── */}
      <section
        style={{
          borderTop: "1px solid var(--rule)",
          padding: "72px 22px 64px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-instrument-serif), Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(36px, 4vw, 56px)",
            lineHeight: 1.05,
            letterSpacing: "-1px",
            marginBottom: 16,
            color: "var(--ink)",
          }}
        >
          Ready to <em style={{ fontStyle: "italic" }}>book?</em>
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--ink-2)",
            marginBottom: 28,
            maxWidth: 400,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Pick your lesson, choose a slot, pay securely online.
        </p>
        <Link
          href="/book"
          className="btn-primary"
          style={{ display: "inline-flex", padding: "14px 32px" }}
        >
          Book a lesson
        </Link>
        <p style={{ marginTop: 20, fontSize: 13, color: "var(--ink-3)" }}>
          Prices include VAT where applicable. Questions?{" "}
          <Link href="/contact" style={{ color: "var(--red)", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Get in touch
          </Link>
          .
        </p>
      </section>
    </>
  );
}
