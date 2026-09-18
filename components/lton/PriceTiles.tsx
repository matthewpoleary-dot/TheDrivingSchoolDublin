"use client";
// components/lton/PriceTiles.tsx — four plate tiles; each leads with its price and flips to its details
import { useState } from "react";
import Link from "next/link";
import { SERVICES, formatPrice } from "@/lib/pricing";
import { Plus } from "./Icons";

type Tile = {
  id: string;
  name: [string, string];
  price: string;
  from?: boolean;
  meta: string;
  desc: string;
  href: string;
  cta: string;
  red?: boolean;
};

const TILES: Tile[] = [
  {
    id: "standard",
    name: ["Standard", "lesson"],
    price: formatPrice(SERVICES.standard.pricePence),
    meta: "60 minutes",
    desc: "Manual in Conor's dual-control car, or he sits with you in your own automatic.",
    href: "/book?service=standard",
    cta: "Book this lesson",
  },
  {
    id: "pre-test",
    name: ["Pre-test", "lesson"],
    price: formatPrice(SERVICES["pre-test"].pricePence),
    meta: "Mock test route",
    desc: "Mock route, manoeuvres and examiner feedback, plus the exam questions and road signs.",
    href: "/book?service=pre-test",
    cta: "Book this lesson",
  },
  {
    id: "edt-bundle",
    name: ["EDT, all", "12 lessons"],
    price: formatPrice(SERVICES["edt-bundle"].pricePence),
    meta: `Or split, ${formatPrice(SERVICES["edt-split"].pricePence)} × 2`,
    desc: "The full 12-lesson EDT programme, logbook included. Book each session from your own link.",
    href: "/book?service=edt-bundle",
    cta: "Book the bundle",
    red: true,
  },
  {
    id: "car-hire",
    name: ["Car hire for", "your test"],
    price: formatPrice(SERVICES["car-hire-centre"].pricePence),
    from: true,
    meta: "Three options",
    desc: `At the test centre ${formatPrice(SERVICES["car-hire-centre"].pricePence)}, local pickup ${formatPrice(SERVICES["car-hire-local"].pricePence)}, or with a pre-test lesson ${formatPrice(SERVICES["car-hire-lesson"].pricePence)}.`,
    href: "/book",
    cta: "Choose an option",
  },
];

export default function PriceTiles() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <ul className="l-tiles" role="list">
      {TILES.map((t) => {
        const isOpen = open === t.id;
        return (
          <li key={t.id} className={`l-tile${t.red ? " l-tile--red" : ""}`} data-open={isOpen}>
            <button
              type="button"
              className="l-tile__toggle"
              aria-expanded={isOpen}
              aria-controls={`tile-${t.id}`}
              aria-label={`${isOpen ? "Hide" : "Show"} details for ${t.name.join(" ")}`}
              onClick={() => setOpen(isOpen ? null : t.id)}
            >
              <span><Plus /></span>
            </button>
            <div className="l-tile__inner">
              <div className="l-tile__face" aria-hidden={isOpen}>
                <h3 className="l-tile__name">{t.name[0]}<br />{t.name[1]}</h3>
                <div>
                  <p className="l-tile__price l-num">
                    {t.from && <small>from</small>}
                    {t.price}
                  </p>
                  <p className="l-tile__meta">{t.meta}</p>
                </div>
              </div>
              <div className="l-tile__face l-tile__face--back" id={`tile-${t.id}`} aria-hidden={!isOpen}>
                <p className="l-tile__desc">{t.desc}</p>
                <Link href={t.href} className="l-tile__book" tabIndex={isOpen ? 0 : -1}>
                  {t.cta}
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
