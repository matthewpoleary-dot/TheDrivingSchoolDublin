import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import Link from "next/link";
import { SITE, CONTACT, OPENING_HOURS, contactLinks, AREAS } from "@/lib/config";
import { LogoLink, Container, Chevrons } from "@/components/brand";
import SiteNav from "@/components/SiteNav";

/**
 * One typeface doing all the work, the way a signage system does. Archivo is a
 * grotesque with real weight at 800, which matches the logo's letterforms.
 * `display: swap` so text is never invisible while it loads.
 */
const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `Driving Lessons Dublin | ${SITE.name}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Driving lessons in Dublin, taught by a former RSA tester",
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: SITE.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Driving lessons in Dublin | ${SITE.name}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#141414",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IE" className={archivo.variable}>
      <body className="flex min-h-dvh flex-col bg-paper text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-3 focus:font-bold focus:text-white"
        >
          Skip to content
        </a>

        <SiteNav />

        <main id="main" className="flex-1">
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-white">
      <Chevrons />
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <LogoLink />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
              Driving lessons across Dublin with{" "}
              <span className="text-white">a former RSA driving tester</span>. EDT, pre-test
              preparation and car hire for your test.
            </p>
            <p className="mt-5 text-sm text-white/70">{OPENING_HOURS.display}</p>
          </div>

          <nav aria-label="Footer">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">Pages</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                ["/book", "Book a lesson"],
                ["/prices", "Prices"],
                ["/reviews", "Reviews"],
                ["/about", "About Conor"],
                ["/contact", "Contact"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-white/75 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">
              Get in touch
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href={contactLinks.tel} className="tabular text-white/75 hover:text-white">
                  {CONTACT.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={contactLinks.whatsapp()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/75 hover:text-white"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={contactLinks.email} className="break-all text-white/75 hover:text-white">
                  {CONTACT.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-11 border-t border-white/15 pt-6">
          <p className="text-xs leading-relaxed text-white/45">
            Pick-up across {AREAS.slice(0, 4).join(", ")} and the rest of south Dublin.
          </p>
          <p className="mt-3 text-xs text-white/45">
            &copy; {new Date().getFullYear()} {SITE.name}. RSA-approved driving instruction.
          </p>
        </div>
      </Container>
    </footer>
  );
}
