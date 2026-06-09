// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import { Inter, Instrument_Serif } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata = {
  title: "The Driving School Dublin",
  description:
    "Professional driving lessons in Dublin. RSA-approved ADI, manual & automatic, EDT packages, pre-test sessions. Flexible scheduling. Book your lesson today.",
  openGraph: {
    title: "The Driving School Dublin | Professional Driving Lessons",
    description:
      "RSA-approved ADI providing professional driving lessons across Dublin. Manual & automatic, EDT packages, pre-test sessions.",
    url: "https://thedrivingschooldublin.com",
    siteName: "The Driving School Dublin",
    locale: "en_IE",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body className={`${inter.className} min-h-screen antialiased`}>

        {/* ── Pill nav ─────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 w-full px-4 py-3">
          <div
            className="nav-pill mx-auto flex items-center justify-between"
            style={{ maxWidth: 1160, padding: "10px 20px 10px 24px" }}
          >
            {/* Logo */}
            <Link
              href="/"
              className="text-[14px] md:text-[15px] font-semibold shrink-0"
              style={{ color: "var(--ink)", textDecoration: "none", letterSpacing: "-0.2px", position: "relative", zIndex: 1 }}
              aria-label="The Driving School Dublin, Home"
            >
              <span className="hidden md:inline">The </span>
              <span style={{ color: "var(--red)" }}>Driving</span> School<span className="hidden sm:inline"> Dublin</span>
            </Link>

            {/* Centre links — hidden on mobile */}
            <div
              className="hidden md:flex items-center"
              style={{ gap: 28, position: "relative", zIndex: 1 }}
            >
              <Link href="/prices" className="nav-link">Prices</Link>
              <Link href="/#process" className="nav-link">Process</Link>
              <Link href="/#reviews" className="nav-link">Reviews</Link>
              <Link href="/about" className="nav-link">About</Link>
            </div>

            {/* Right CTA */}
            <Link
              href="/book"
              className="btn-primary shrink-0"
              style={{ padding: "9px 18px", fontSize: 13, position: "relative", zIndex: 1 }}
            >
              Book a lesson →
            </Link>
          </div>
        </header>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="mx-auto" style={{ maxWidth: 1200 }}>
          {children}
        </main>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer style={{ background: "var(--ink)", color: "white" }}>
          <div
            className="mx-auto"
            style={{ maxWidth: 1200, padding: "56px 22px 0" }}
          >
            {/* Top row */}
            <div
              className="flex flex-col md:flex-row md:items-start md:justify-between"
              style={{ gap: 48, paddingBottom: 48, borderBottom: "1px solid rgba(255,255,255,0.1)" }}
            >
              {/* Brand + tagline */}
              <div style={{ maxWidth: 260 }}>
                <div
                  className="text-[15px] font-semibold mb-3"
                  style={{ letterSpacing: "-0.2px" }}
                >
                  The <span style={{ color: "var(--red)" }}>Driving</span> School Dublin
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                  RSA-approved ADI. Manual &amp; automatic lessons across Dublin.
                  EDT programmes, pre-test sessions, and car hire.
                </p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 12 }}>
                  Mon–Sat · 8am–6pm
                </p>
              </div>

              {/* Link columns */}
              <div className="flex gap-14 md:gap-20">
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.35)",
                      marginBottom: 16,
                    }}
                  >
                    Lessons
                  </p>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { label: "Prices", href: "/prices" },
                      { label: "Book a lesson", href: "/book" },
                      { label: "Reviews", href: "/#reviews" },
                    ].map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.35)",
                      marginBottom: 16,
                    }}
                  >
                    Company
                  </p>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { label: "About", href: "/about" },
                      { label: "Contact", href: "/contact" },
                    ].map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Copyright bar */}
            <div
              className="flex flex-col md:flex-row md:items-center md:justify-between"
              style={{ padding: "20px 0 24px", gap: 8 }}
            >
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
                © {new Date().getFullYear()} The Driving School Dublin. All rights reserved.
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
                RSA-approved Approved Driving Instructor · Dublin, Ireland
              </p>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
