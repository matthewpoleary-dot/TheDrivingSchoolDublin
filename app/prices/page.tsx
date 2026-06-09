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
  {
    title: "6 Reduced EDT Lessons",
    description: "Completes the reduced EDT syllabus over six structured hours.",
    price: "€455",
    unit: "6 lessons",
    service: "edt-6",
  },
  {
    title: "EDT Bundle, 12 lessons",
    description: "Full EDT programme. Personal booking link emailed instantly. Valid 12 months.",
    price: "€905",
    unit: "€75.42 / hour",
    service: "edt-bundle",
    tag: "Best value",
  },
];

const CAR_HIRE = [
  { opt: "i.",   desc: "At the test centre",            price: "€150" },
  { opt: "ii.",  desc: "Local pickup and drop-off",     price: "€200" },
  { opt: "iii.", desc: "Car hire plus pre-test lesson", price: "€245" },
];

const SECTION_STYLE = {
  padding: "64px 22px",
  borderTop: "1px solid var(--rule)",
} as React.CSSProperties;

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

      {/* ── PRICE ROWS ───────────────────────────────────────────────────── */}
      <section style={SECTION_STYLE}>
        {PRIMARY.map((p, i) => (
          <div
            key={p.service}
            style={{
              padding: "28px 0",
              borderTop: i === 0 ? "1px solid var(--rule)" : "none",
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
                  {p.title}
                </h3>
                {p.tag && (
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
                    {p.tag}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 380 }}>
                {p.description}
              </p>
              {p.note && (
                <p style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.55, marginTop: 6, maxWidth: 380, fontStyle: "italic" }}>
                  {p.note}
                </p>
              )}
              <Link
                href={`/book?service=${p.service}`}
                style={{
                  display: "inline-block",
                  marginTop: 14,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--red)",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--red)",
                  paddingBottom: 1,
                }}
              >
                Book {p.title.split(",")[0].toLowerCase()} →
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
                }}
              >
                {p.price}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>
                {p.unit}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── CAR HIRE ─────────────────────────────────────────────────────── */}
      <section style={SECTION_STYLE}>
        <div className="section-label">
          <span className="num">—</span> Test day
        </div>
        <h2
          style={{
            fontFamily: "var(--font-instrument-serif), Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(36px, 5vw, 56px)",
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
          Roadworthy, fully insured car. Mon to Fri tests. Saturday on request.
        </p>

        {CAR_HIRE.map((row, i) => (
          <div
            key={row.opt}
            style={{
              padding: "24px 0",
              borderTop: i === 0 ? "1px solid var(--rule)" : "none",
              borderBottom: "1px solid var(--rule)",
              display: "grid",
              gridTemplateColumns: "36px 1fr auto",
              gap: 18,
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-instrument-serif), Georgia, serif",
                fontStyle: "italic",
                fontSize: 20,
                color: "var(--red)",
              }}
            >
              {row.opt}
            </div>
            <div style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500 }}>
              {row.desc}
            </div>
            <div
              style={{
                fontFamily: "var(--font-instrument-serif), Georgia, serif",
                fontSize: 26,
                color: "var(--ink)",
                letterSpacing: "-0.8px",
              }}
            >
              {row.price}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 32 }}>
          <Link
            href="/book?service=car-hire"
            className="btn-primary"
            style={{ display: "inline-flex", padding: "14px 28px" }}
          >
            Book car hire →
          </Link>
        </div>
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
