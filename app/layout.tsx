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

        {/* ── Two-row sticky nav ──────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-40 w-full"
          style={{
            background: "rgba(255,255,255,0.94)",
            backdropFilter: "saturate(180%) blur(14px)",
            WebkitBackdropFilter: "saturate(180%) blur(14px)",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          {/* Row 1: logo + CTA */}
          <nav
            className="mx-auto flex items-center justify-between"
            style={{
              maxWidth: 1200,
              padding: "16px 22px 14px",
            }}
          >
            <Link
              href="/"
              className="text-[15px] font-semibold tracking-[-0.2px]"
              style={{ color: "var(--ink)", textDecoration: "none" }}
              aria-label="The Driving School Dublin — Home"
            >
              The <span style={{ color: "var(--red)" }}>Driving</span> School Dublin
            </Link>
            <Link
              href="/book"
              className="text-[13px] font-medium"
              style={{ color: "var(--ink)", textDecoration: "none" }}
            >
              Book a lesson <span style={{ color: "var(--red)" }}>→</span>
            </Link>
          </nav>

          {/* Row 2: anchor links */}
          <div
            className="mx-auto flex justify-center"
            style={{
              maxWidth: 1200,
              gap: 28,
              padding: "0 22px 12px",
              display: "flex",
            }}
          >
            <Link href="/#pricing" className="nav-link">Prices</Link>
            <Link href="/#process" className="nav-link">Process</Link>
            <Link href="/#reviews" className="nav-link">Reviews</Link>
            <Link href="/about" className="nav-link">About</Link>
          </div>
        </header>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main className="mx-auto" style={{ maxWidth: 1200 }}>
          {children}
        </main>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer
          className="mx-auto text-center"
          style={{
            maxWidth: 1200,
            padding: "32px 22px 24px",
            borderTop: "1px solid var(--rule)",
          }}
        >
          <div
            className="text-[14px] font-semibold mb-2"
            style={{ letterSpacing: "-0.2px", color: "var(--ink)" }}
          >
            The <span style={{ color: "var(--red)" }}>Driving</span> School Dublin
          </div>
          <div className="text-[12px]" style={{ color: "var(--ink-3)" }}>
            thedrivingschooldublin.com · Dublin, Ireland
          </div>
          <div
            className="mt-4 flex justify-center gap-5 text-[13px]"
            style={{ color: "var(--ink-2)" }}
          >
            <Link href="/about" style={{ color: "var(--ink-2)", textDecoration: "none" }}>
              About
            </Link>
            <Link href="/contact" style={{ color: "var(--ink-2)", textDecoration: "none" }}>
              Contact
            </Link>
            <Link href="/book" style={{ color: "var(--ink-2)", textDecoration: "none" }}>
              Book a lesson
            </Link>
          </div>
        </footer>

      </body>
    </html>
  );
}
