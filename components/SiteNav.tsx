"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoLink, Container } from "@/components/brand";
import { CONTACT, contactLinks } from "@/lib/config";

const LINKS = [
  { href: "/prices", label: "Prices" },
  { href: "/reviews", label: "Reviews" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * The one job of this header is that "Book a lesson" is never more than a
 * glance away, on any page, at any width. It is the only red thing up here,
 * and on mobile it stays in the bar rather than hiding behind the menu.
 */
export default function SiteNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the menu on navigation, and never leave it stuck open on resize.
  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur-sm">
      <Container>
        <div className="flex h-16 items-center justify-between gap-3">
          <LogoLink />

          <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`text-sm font-bold transition-colors ${
                  isActive(link.href)
                    ? "text-ink underline decoration-plate decoration-[3px] underline-offset-[6px]"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={contactLinks.tel}
              className="hidden text-sm font-bold text-ink-soft transition-colors hover:text-ink sm:inline lg:mr-1"
            >
              <span className="tabular">{CONTACT.phoneDisplay}</span>
            </a>

            <Link
              href="/book"
              className="btn btn-primary !min-h-11 whitespace-nowrap !px-3 !py-2.5 text-sm sm:!px-4"
            >
              {/* "Book" alone on the narrowest screens, so it never wraps. */}
              Book<span className="hidden xs:inline"> a lesson</span>
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="grid h-11 w-11 place-items-center border-2 border-ink bg-white md:hidden"
            >
              <svg
                viewBox="0 0 20 20"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="square"
                aria-hidden="true"
              >
                {menuOpen ? (
                  <path d="M4 4l12 12M16 4L4 16" />
                ) : (
                  <path d="M3 6h14M3 10h14M3 14h14" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </Container>

      {menuOpen && (
        <div id="mobile-menu" className="border-t-2 border-ink bg-paper md:hidden">
          <Container className="py-4">
            <nav aria-label="Mobile">
              <ul className="divide-y divide-rule">
                {LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className="flex min-h-12 items-center justify-between py-3 text-lg font-bold"
                    >
                      {link.label}
                      {isActive(link.href) && (
                        <span className="h-2 w-2 bg-plate" aria-hidden="true" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-4 grid gap-2">
              <a href={contactLinks.tel} className="btn btn-outline w-full">
                Call {CONTACT.phoneDisplay}
              </a>
              <a
                href={contactLinks.whatsapp()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-quiet w-full"
              >
                WhatsApp
              </a>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
