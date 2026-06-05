// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata = {
  title: "The Driving School Dublin",
  description: "Professional driving lessons in Dublin. RSA-approved ADI, manual & automatic, EDT packages, pre-test sessions. Flexible scheduling. Book your lesson today.",
  openGraph: {
    title: "The Driving School Dublin | Professional Driving Lessons",
    description: "RSA-approved ADI providing professional driving lessons across Dublin. Manual & automatic, EDT packages, pre-test sessions.",
    url: "https://thedrivingschooldublin.com",
    siteName: "The Driving School Dublin",
    locale: "en_IE",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className={`${jakarta.className} min-h-screen bg-white text-slate-900 antialiased`}>
        {/* Header */}
        <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-100">
          <nav className="mx-auto max-w-6xl px-5 lg:px-8 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900"
              aria-label="The Driving School Dublin — Home"
            >
              The <span className="text-red-600">Driving</span> School Dublin
            </Link>

            <div className="flex items-center gap-6 sm:gap-8">
              <div className="hidden md:flex items-center gap-8">
                <Link href="/prices" className="nav-link">Prices</Link>
                <Link href="/reviews" className="nav-link">Reviews</Link>
                <Link href="/about" className="nav-link">About</Link>
                <Link href="/contact" className="nav-link">Contact</Link>
              </div>
              <Link
                href="/book"
                className="btn-primary text-sm px-4 py-2"
              >
                Book now
              </Link>
            </div>
          </nav>
        </header>

        {/* Main content */}
        <main className="mx-auto max-w-6xl px-5 lg:px-8 py-12 lg:py-16">{children}</main>

        {/* Footer */}
        <footer className="mt-24 border-t border-slate-100 bg-slate-50/50">
          <div className="mx-auto max-w-6xl px-5 lg:px-8 py-14">
            <div className="grid gap-10 md:grid-cols-3 mb-10">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-3">
                  The <span className="text-red-600">Driving</span> School Dublin
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  RSA-approved ADI providing professional driving lessons across Dublin.
                </p>
                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-700">Hours:</span> Mon–Sat, 8am–6pm
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                  Explore
                </h3>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/prices" className="text-slate-600 hover:text-red-600 transition-colors">Prices</Link></li>
                  <li><Link href="/reviews" className="text-slate-600 hover:text-red-600 transition-colors">Reviews</Link></li>
                  <li><Link href="/about" className="text-slate-600 hover:text-red-600 transition-colors">About</Link></li>
                  <li><Link href="/contact" className="text-slate-600 hover:text-red-600 transition-colors">Contact</Link></li>
                  <li><Link href="/book" className="text-slate-600 hover:text-red-600 transition-colors">Book a lesson</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                  Get in touch
                </h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a href="tel:+353860235666" className="text-slate-600 hover:text-red-600 transition-colors">+353 86 0235 666</a>
                  </li>
                  <li>
                    <a href="mailto:thedrivingschooldublin@gmail.com" className="text-slate-600 hover:text-red-600 transition-colors break-all">
                      thedrivingschooldublin@gmail.com
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://wa.me/353860235666?text=Hi!%20I'd%20like%20to%20arrange%20a%20driving%20lesson."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-red-600 transition-colors"
                    >
                      WhatsApp
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-200 text-sm text-slate-500 flex flex-col md:flex-row items-center justify-between gap-3">
              <p>© {new Date().getFullYear()} The Driving School Dublin. All rights reserved.</p>
              <p>RSA-approved Approved Driving Instructor · Dublin, Ireland</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
