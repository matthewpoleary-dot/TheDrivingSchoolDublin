// components/lton/PriceTiles.tsx — "Choose your lesson": a price list, one row per lesson with
// its price up front. Each whole row goes straight into the booking flow. Prices come from lib/pricing.
import Link from "next/link";
import { SERVICES, formatPrice } from "@/lib/pricing";
import { ArrowRight } from "./Icons";

type Card = {
  id: string;
  name: string;
  price: string;
  from?: boolean;
  unit: string;
  meta: string;
  tag?: string;
  desc: string;
  href: string;
  cta: string;
  key?: boolean;
};

const CARDS: Card[] = [
  {
    id: "standard",
    name: "Standard lesson",
    price: formatPrice(SERVICES.standard.pricePence),
    unit: "per lesson",
    meta: "60 minutes",
    desc: "One-to-one, manual in Conor's dual-control car, or automatic in your own.",
    href: "/book?service=standard",
    cta: "Book a lesson",
  },
  {
    id: "pre-test",
    name: "Pre-test lesson",
    price: formatPrice(SERVICES["pre-test"].pricePence),
    unit: "per session",
    meta: "Mock test route",
    desc: "Mock route, manoeuvres and examiner feedback, plus the exam questions and road signs.",
    href: "/book?service=pre-test",
    cta: "Book a pre-test",
  },
  {
    id: "edt-bundle",
    name: "EDT, all 12 lessons",
    price: formatPrice(SERVICES["edt-bundle"].pricePence),
    unit: "paid once",
    meta: `Or ${formatPrice(SERVICES["edt-split"].pricePence)} × 2`,
    tag: "Best value",
    desc: "The full 12-lesson EDT programme. Book each session when it suits, from your own link.",
    href: "/book?service=edt-bundle",
    cta: "Book the bundle",
    key: true,
  },
  {
    id: "car-hire",
    name: "Car hire for your test",
    price: formatPrice(SERVICES["car-hire-centre"].pricePence),
    from: true,
    unit: "test day",
    meta: "Three options",
    desc: `At the test centre ${formatPrice(SERVICES["car-hire-centre"].pricePence)}, local pickup ${formatPrice(SERVICES["car-hire-local"].pricePence)}, or with a pre-test lesson ${formatPrice(SERVICES["car-hire-lesson"].pricePence)}.`,
    href: "/book",
    cta: "Choose an option",
  },
];

export default function PriceTiles() {
  return (
    <ul className="l-pricelist" role="list">
      {CARDS.map((c) => (
        <li key={c.id} className={`l-reveal${c.key ? " l-pricelist__key" : ""}`}>
          <Link href={c.href} className="l-price">
            <div className="l-price__what">
              <span className="l-price__meta">
                {c.meta}
                {c.tag && <span className="l-tag">{c.tag}</span>}
              </span>
              <h3 className="l-price__name">{c.name}</h3>
            </div>
            <p className="l-price__desc">{c.desc}</p>
            <p className="l-price__cost">
              {c.from && <small>from </small>}
              <strong className="l-num">{c.price}</strong>
              <small>{c.unit}</small>
            </p>
            <span className="l-price__cta">
              {c.cta} <ArrowRight size={16} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
