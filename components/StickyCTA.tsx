"use client";
// components/StickyCTA.tsx — sticky bottom action bar (mobile only)
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Chat, Mail } from "@/components/lton/Icons";

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
      <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="l-btn l-btn--line l-bar__icon">
        <Chat size={18} /><span>WhatsApp</span>
      </a>
      <Link href="/book" className="l-btn l-btn--red">
        Book now <ArrowRight size={16} />
      </Link>
      <Link href="/contact" className="l-btn l-btn--line l-bar__icon">
        <Mail size={18} /><span>Contact</span>
      </Link>
    </div>
  );
}
