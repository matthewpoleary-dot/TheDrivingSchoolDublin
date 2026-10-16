// app/prices/page.tsx
import Link from "next/link";
import FAQ from "@/components/FAQ";
import { ArrowRight } from "@/components/lton/Icons";
import { SERVICES, formatPrice, type ServiceSlug } from "@/lib/pricing";

type PriceRow = {
  title: string;
  description: string;
  price: string;
  unit: string;
  service: ServiceSlug;
  tag?: string;
  note?: string;
};

const p = (slug: ServiceSlug) => formatPrice(SERVICES[slug].pricePence);

const PRIMARY: PriceRow[] = [
  {
    title: "Standard Lesson",
    description: "One-to-one tuition in a fully-equipped dual-control car. Mon to Fri.",
    price: p("standard"),
    unit: "per hour",
    service: "standard",
    note: "Evening and weekend slots on request, limited availability.",
  },
  {
    title: "Pre-Test Lesson",
    description: "Mock test route, manoeuvres, and examiner feedback. Mon to Fri.",
    price: p("pre-test"),
    unit: "per session",
    service: "pre-test",
    note: "Weekend sessions on request.",
  },
  {
    title: "Refresher Lessons",
    description: "For licensed drivers returning to the wheel after a break.",
    price: p("refresher"),
    unit: "per hour",
    service: "refresher",
  },
];

const EDT_OPTIONS: PriceRow[] = [
  {
    title: "6 Reduced EDT Lessons",
    description: "The reduced EDT package. Six structured hours covering the syllabus.",
    price: p("edt-6"),
    unit: "6 lessons",
    service: "edt-6",
  },
  {
    title: "EDT Bundle, 12 lessons",
    description: "Full EDT programme paid up front. Personal booking link emailed instantly. Valid 12 months.",
    price: p("edt-bundle"),
    unit: `${formatPrice(Math.round(SERVICES["edt-bundle"].pricePence / 12))} / hour`,
    service: "edt-bundle",
    tag: "Best value",
  },
  {
    title: "EDT Bundle, split payment",
    description: `Pay ${p("edt-split")} now for lessons 1 to 6. Pay ${p("edt-split")} again before lessons 7 to 12.`,
    price: `${p("edt-split")} × 2`,
    unit: `${formatPrice(SERVICES["edt-split"].pricePence * 2)} total`,
    service: "edt-split",
  },
];

const CAR_HIRE: PriceRow[] = [
  {
    title: "At the test centre",
    description: "Meet at the test centre. Roadworthy, fully insured car. Arrive early, paperwork checked.",
    price: p("car-hire-centre"),
    unit: "test day",
    service: "car-hire-centre",
  },
  {
    title: "Local pickup and drop-off",
    description: "We collect you and drop you back. Roadworthy, fully insured car. Mon to Fri tests.",
    price: p("car-hire-local"),
    unit: "test day",
    service: "car-hire-local",
  },
  {
    title: "Car hire plus pre-test lesson",
    description: "A pre-test lesson the morning of, then the car for your test. The best preparation.",
    price: p("car-hire-lesson"),
    unit: "test day",
    service: "car-hire-lesson",
  },
];

function Rows({ rows }: { rows: PriceRow[] }) {
  return (
    <ul className="l-rows">
      {rows.map((row) => (
        <li key={row.service} className="l-row">
          <div>
            <h3 className="l-row__name">
              {row.title}
              {row.tag && <span className="l-tag">{row.tag}</span>}
            </h3>
            <p className="l-row__desc">{row.description}</p>
            {row.note && <p className="l-row__note">{row.note}</p>}
          </div>
          <div className="l-row__price">
            <strong className="l-num">{row.price}</strong>
            <span>{row.unit}</span>
          </div>
          <div className="l-row__cta">
            <Link href={`/book?service=${row.service}`} className="l-btn l-btn--line l-row__book">
              Book this <ArrowRight size={16} />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

export const metadata = {
  title: "Prices | The Driving School Dublin",
  description:
    "Transparent pricing for driving lessons in Dublin. Standard lessons, EDT packages, pre-test sessions, and car hire.",
};

export default function PricesPage() {
  return (
    <div className="l-page">
      <header className="l-intro">
        <p className="l-eyebrow">Prices</p>
        <h1 className="l-h1">Every price, up front.</h1>
        <p className="l-lede">Clear hourly rates and package deals. Pick one and pay securely online.</p>
        <nav className="l-jump" aria-label="Jump to">
          <a href="#lessons">Lessons</a>
          <a href="#edt">EDT programmes</a>
          <a href="#car-hire">Car hire</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>

      <section id="lessons" className="l-group" aria-labelledby="lessons-title" style={{ scrollMarginTop: 96 }}>
        <div className="l-group__head">
          <h2 id="lessons-title" className="l-h3">Lessons</h2>
        </div>
        <Rows rows={PRIMARY} />
      </section>

      <section id="edt" className="l-group" aria-labelledby="edt-title" style={{ scrollMarginTop: 96 }}>
        <div className="l-group__head">
          <h2 id="edt-title" className="l-h3">Essential Driver Training</h2>
          <p className="l-body">
            The 12-lesson EDT programme is mandatory for new learner drivers in Ireland.
            We also offer the reduced 6-lesson option for eligible drivers.
          </p>
        </div>
        <Rows rows={EDT_OPTIONS} />
      </section>

      <section id="car-hire" className="l-group" aria-labelledby="hire-title" style={{ scrollMarginTop: 96 }}>
        <div className="l-group__head">
          <h2 id="hire-title" className="l-h3">Car hire for your test</h2>
          <p className="l-body">
            Roadworthy, fully insured car. Three options to suit you. Mon to Fri tests, Saturday on request.
          </p>
        </div>
        <Rows rows={CAR_HIRE} />
      </section>

      <div id="faq" className="l-group" style={{ scrollMarginTop: 96 }}>
        <FAQ />
      </div>

      <section className="l-close" aria-labelledby="close-title">
        <h2 id="close-title" className="l-h2">Ready to book?</h2>
        <p className="l-body">Pick your lesson, choose a slot, pay securely online.</p>
        <Link href="/book" className="l-btn l-btn--red l-btn--lg">
          Book a lesson <ArrowRight />
        </Link>
        <p className="l-body" style={{ marginTop: 6, fontSize: 15 }}>
          Prices include VAT where applicable. Questions?{" "}
          <Link href="/contact" className="l-link">Get in touch</Link>.
        </p>
      </section>
    </div>
  );
}
