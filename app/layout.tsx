// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import { Inter, Instrument_Serif } from "next/font/google";
import MorphingNav from "@/components/MorphingNav";

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

        {/* ── Morphing nav ─────────────────────────────────────────────────── */}
        <MorphingNav />

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="mx-auto" style={{ maxWidth: 1200 }}>
          {children}
        </main>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer style={{ background: "#F6F3EE", color: "var(--ink)" }}>
          <div className="mx-auto" style={{ maxWidth: 1200, padding: "72px 22px 0" }}>

            {/* Brand + tagline */}
            <div style={{ marginBottom: 56 }}>
              <div className="text-[18px] font-semibold mb-3" style={{ letterSpacing: "-0.2px" }}>
                The <span style={{ color: "var(--red)" }}>Driving</span> School Dublin
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, maxWidth: 460 }}>
                RSA-approved ADI. Manual and automatic lessons across Dublin.
                EDT programmes, pre-test sessions, and car hire.
              </p>
            </div>

            {/* Link columns */}
            <div
              className="grid grid-cols-2 md:grid-cols-4"
              style={{ gap: 32, paddingBottom: 48 }}
            >
              {[
                {
                  label: "Lessons",
                  links: [
                    { label: "Prices", href: "/prices" },
                    { label: "Book a lesson", href: "/book" },
                    { label: "Reviews", href: "/#reviews" },
                  ],
                },
                {
                  label: "Company",
                  links: [
                    { label: "About", href: "/about" },
                    { label: "Contact", href: "/contact" },
                  ],
                },
                {
                  label: "Contact",
                  links: [
                    { label: "+353 86 0235 666", href: "tel:+353860235666" },
                    { label: "Email", href: "mailto:thedrivingschooldublin@gmail.com" },
                    { label: "WhatsApp", href: "https://wa.me/353860235666" },
                  ],
                },
                {
                  label: "Hours",
                  links: [{ label: "Mon to Sat, 8am to 6pm", href: "/contact" }],
                },
              ].map((col) => (
                <div key={col.label}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                      color: "var(--ink-3)",
                      marginBottom: 16,
                    }}
                  >
                    {col.label}
                  </p>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                    {col.links.map((l) => (
                      <li key={l.href + l.label}>
                        <Link
                          href={l.href}
                          style={{
                            fontSize: 13,
                            color: "var(--ink-2)",
                            textDecoration: "none",
                            transition: "color 0.15s",
                          }}
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Copyright bar */}
            <div
              className="flex flex-col md:flex-row md:items-center md:justify-between"
              style={{
                padding: "20px 0 28px",
                gap: 8,
                borderTop: "1px solid rgba(10,10,10,0.08)",
              }}
            >
              <p style={{ fontSize: 12, color: "var(--ink-3)" }}>
                © {new Date().getFullYear()} The Driving School Dublin. All rights reserved.
              </p>
              <p style={{ fontSize: 12, color: "var(--ink-3)" }}>
                RSA-approved Approved Driving Instructor · Dublin, Ireland
              </p>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
