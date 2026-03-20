"use client";

import { useState, useEffect } from "react";

const WHATSAPP = "https://wa.me/353860235666?text=" + encodeURIComponent("Hi! I'd like to arrange a driving lesson.");
const TEL = "tel:+353860235666";

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-sm md:hidden">
      <div className="mx-auto max-w-5xl px-4 py-3 flex gap-2">
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
        >
          WhatsApp
        </a>
        <a
          href={TEL}
          className="flex-1 inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black transition-colors"
        >
          Call us
        </a>
      </div>
    </div>
  );
}
