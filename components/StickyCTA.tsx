"use client";
// components/StickyCTA.tsx — sticky bottom action bar (mobile only)
import { useState, useEffect } from "react";
import Link from "next/link";

const WHATSAPP_HREF =
  "https://wa.me/353860235666?text=" +
  encodeURIComponent("Hi! I'd like to arrange a driving lesson.");

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "saturate(180%) blur(12px)",
        WebkitBackdropFilter: "saturate(180%) blur(12px)",
        borderTop: "1px solid var(--rule)",
        padding: "12px 14px",
        paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
        display: "grid",
        gridTemplateColumns: "1fr 1.6fr 1fr",
        gap: 8,
      }}
    >
      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px 6px",
          borderRadius: 100,
          fontSize: 13,
          fontWeight: 500,
          textDecoration: "none",
          background: "white",
          color: "var(--ink)",
          border: "1px solid var(--rule-strong)",
        }}
      >
        WhatsApp
      </a>

      <Link
        href="/book"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px 6px",
          borderRadius: 100,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          background: "var(--red)",
          color: "white",
        }}
      >
        Book now
      </Link>

      <Link
        href="/contact"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px 6px",
          borderRadius: 100,
          fontSize: 13,
          fontWeight: 500,
          textDecoration: "none",
          background: "white",
          color: "var(--ink)",
          border: "1px solid var(--rule-strong)",
        }}
      >
        Contact
      </Link>
    </div>
  );
}
