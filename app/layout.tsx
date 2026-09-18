// app/layout.tsx
import "./globals.css";
import "./lton.css";
import Link from "next/link";
import { Archivo } from "next/font/google";
import MorphingNav from "@/components/MorphingNav";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
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

const FOOTER_COLUMNS = [
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
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable}>
      <body className={`${archivo.className} min-h-screen antialiased`}>

        {/* ── Morphing nav ─────────────────────────────────────────────────── */}
        <MorphingNav />

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="mx-auto" style={{ maxWidth: 1200 }}>
          {children}
        </main>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="l-footer">
          <div className="l-footer__inner">
            <p className="l-footer__mark" aria-label="The Driving School Dublin">
              The<br />Driving<br />Schoo<b>L</b><br />Dubli<b>N</b>
            </p>
            <p className="l-footer__tag">
              RSA-approved ADI. Manual and automatic lessons across Dublin.
              EDT programmes, pre-test sessions, and car hire.
            </p>

            <div className="l-footer__cols">
              {FOOTER_COLUMNS.map((col) => (
                <div key={col.label}>
                  <p className="l-footer__label">{col.label}</p>
                  <ul>
                    {col.links.map((l) => (
                      <li key={l.href + l.label}>
                        <Link href={l.href}>{l.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="l-footer__base">
              <p>© {new Date().getFullYear()} The Driving School Dublin. All rights reserved.</p>
              <p>RSA-approved Approved Driving Instructor · Dublin, Ireland</p>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
