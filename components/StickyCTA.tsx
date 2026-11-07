"use client";
// components/StickyCTA.tsx: sticky bottom action bar (mobile only): WhatsApp, Contact us, Call
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Chat } from "@/components/lton/Icons";

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
    <div className="l-bar bar-enter" style={{ willChange: "transform" }}>
      <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="l-btn l-btn--line">
        <Chat size={16} /> WhatsApp
      </a>
      <Link href="/contact" className="l-btn l-btn--red">
        Contact us <ArrowRight size={16} />
      </Link>
      <a href="tel:+353860235666" className="l-btn l-btn--line">
        Call
      </a>
    </div>
  );
}
