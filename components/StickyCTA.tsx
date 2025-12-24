// components/StickyCTA.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const DISPLAY_PHONE = "+353 86 0235 666";
const TEL_HREF = "tel:+353860235666";
const WHATSAPP_HREF = "https://wa.me/353860235666?text=" + encodeURIComponent("Hi! I'd like to arrange a driving lesson.");

export default function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg md:hidden">
      <div className="max-w-5xl mx-auto px-4 py-3 flex gap-2">
        <a
          href={WHATSAPP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition"
        >
          WhatsApp
        </a>
        <a
          href={TEL_HREF}
          className="flex-1 inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black transition"
        >
          Call
        </a>
        <Link
          href="/book"
          className="flex-1 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition"
        >
          Request
        </Link>
      </div>
    </div>
  );
}

