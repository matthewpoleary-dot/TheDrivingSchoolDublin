// app/prices/page.tsx
// Weekend prices have been moved off-page by design and are handled during
// the contact conversation — do not restore them thinking it's a bug.
import Link from "next/link";
import FAQ from "@/components/FAQ";
import { ArrowRight } from "@/components/lton/Icons";

type PriceRow = {
  title: string;
  description: string;
  price: string;
  unit: string;
  tag?: string;
  notes?: string[];
};

const LESSONS: PriceRow[] = [
  {
    title: "Standard Lesson",
    description: "One-to-one tuition in a fully-equipped dual-control car. Monday to Friday.",
    price: "€80",
    unit: "per hour",
    notes: ["Evening and weekend slots available on request, limited availability."],
  },
  {
    title: "Pre-Test Lesson",
    description: "Full pre-test preparation: mock test route, manoeuvres, and examiner feedback style. Monday to Friday.",
    price: "€100",
    unit: "per session",
    notes: ["Weekend sessions on request, subject to availability."],
  },
  {
    title: "Refresher Lessons",
    description: "For licensed drivers returning to the wheel after a break. Monday to Friday.",
    price: "€80",
    unit: "per hour",
    notes: ["Weekend slots on request."],
  },
];

const EDT: PriceRow[] = [
  {
    title: "EDT Bundle (12 lessons)",
    description: "Our most popular package for learners completing full EDT. Monday to Friday.",
    price: "€905",
    unit: "12 lessons",
    tag: "Most popular",
    notes: [
      "Works out at €75.42 per hour, cheaper than booking hourly.",
      "Split payments available (Mon to Fri): pay €455 on the first lesson and €450 on the 7th lesson.",
      "Weekend scheduling available on request.",
    ],
  },
  {
    title: "6 Reduced EDT Lessons",
    description: "Completes the reduced EDT syllabus over six structured hours. Monday to Friday.",
    price: "€455",
    unit: "6 lessons",
    notes: ["Weekend scheduling available on request."],
  },
];

const CAR_HIRE: PriceRow[] = [
  { title: "At the test centre", description: "Meet at the test centre.", price: "€150", unit: "from" },
  { title: "Local pickup & drop-off", description: "Picked up and dropped back home.", price: "€200", unit: "from" },
  { title: "Car hire + pre-test lesson", description: "A pre-test lesson, then the car for your test.", price: "€245", unit: "from" },
];

function Rows({ rows, cta = "Contact us" }: { rows: PriceRow[]; cta?: string }) {
  return (
    <ul className="l-rows">
      {rows.map((row) => (
        <li key={row.title} className="l-row l-reveal">
          <div>
            <h3 className="l-row__name">
              {row.title}
              {row.tag && <span className="l-tag">{row.tag}</span>}
            </h3>
            <p className="l-row__desc">{row.description}</p>
            {row.notes?.map((n) => <p key={n} className="l-row__note">{n}</p>)}
          </div>
          <div className="l-row__price">
            {row.unit === "from" ? (
              <>
                <span style={{ marginTop: 0, marginBottom: 6 }}>from</span>
                <strong className="l-num">{row.price}</strong>
              </>
            ) : (
              <>
                <strong className="l-num">{row.price}</strong>
                <span>{row.unit}</span>
              </>
            )}
          </div>
          <div className="l-row__cta">
            <Link href="/contact" className="l-btn l-btn--line l-row__book">
              {cta} <ArrowRight size={16} />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function PricesPage() {
  return (
    <div className="l-page">
      <header className="l-intro">
        <p className="l-eyebrow">Prices</p>
        <h1 className="l-h1">Clear prices, no hidden fees.</h1>
        <p className="l-lede">Every lesson and package, Monday to Friday. Get in touch to arrange yours.</p>
        <nav className="l-jump" aria-label="Jump to">
          <a href="#lessons">Lessons</a>
          <a href="#edt">EDT</a>
          <a href="#car-hire">Car hire</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>

      <section id="lessons" className="l-group" aria-labelledby="lessons-title" style={{ scrollMarginTop: 96 }}>
        <div className="l-group__head">
          <h2 id="lessons-title" className="l-h3">Lessons</h2>
        </div>
        <Rows rows={LESSONS} />
      </section>

      <section id="edt" className="l-group" aria-labelledby="edt-title" style={{ scrollMarginTop: 96 }}>
        <div className="l-group__head">
          <h2 id="edt-title" className="l-h3">Essential Driver Training</h2>
          <p className="l-body">
            Single EDT lessons are available too. <Link href="/contact" className="l-link">Contact us</Link> to arrange one.
          </p>
        </div>
        <Rows rows={EDT} />
      </section>

      <section id="car-hire" className="l-group" aria-labelledby="hire-title" style={{ scrollMarginTop: 96 }}>
        <div className="l-group__head">
          <h2 id="hire-title" className="l-h3">Car hire for your test</h2>
          <p className="l-body">
            Priced for Monday to Friday tests. Saturday test dates on request. Not available Sundays.
          </p>
        </div>
        <Rows rows={CAR_HIRE} />
        <ul className="l-list" style={{ marginTop: 20 }}>
          <li>Roadworthy, fully insured vehicle</li>
          <li>Arrive early, paperwork checked</li>
          <li>Instructor support before and after the test</li>
        </ul>
      </section>

      <p className="l-group l-body" style={{ paddingTop: 24, fontSize: 15 }}>
        Prices include VAT where applicable.
      </p>

      <div id="faq" className="l-group" style={{ scrollMarginTop: 96 }}>
        <FAQ />
      </div>

      <section className="l-close" aria-labelledby="close-title">
        <h2 id="close-title" className="l-h2">Ready to book your lesson?</h2>
        <p className="l-body">Contact us today and we&apos;ll get back to you the same day.</p>
        <Link href="/contact" className="l-btn l-btn--red l-btn--lg">
          Contact us <ArrowRight />
        </Link>
      </section>
    </div>
  );
}
