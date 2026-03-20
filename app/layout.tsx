import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "The Driving School Dublin | Professional Driving Lessons | RSA-Approved ADI",
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
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white text-gray-900 antialiased">

        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
          <nav className="mx-auto max-w-5xl px-4 sm:px-6 flex h-16 items-center justify-between">
            <Link href="/" aria-label="Home" className="font-bold tracking-tight text-base">
              <span className="text-gray-900">The</span>{" "}
              <span className="text-red-600">Driving</span>{" "}
              <span className="text-gray-900">School Dublin</span>
            </Link>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6">
                <Link href="/prices" className="nav-link">Prices</Link>
                <Link href="/reviews" className="nav-link">Reviews</Link>
                <Link href="/about" className="nav-link">About</Link>
              </div>
              <Link href="/contact" className="btn-primary">Contact us</Link>
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-20 border-t border-gray-100 bg-gray-50">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
            <div className="grid gap-10 md:grid-cols-3 mb-10">
              <div>
                <p className="font-bold text-gray-900 mb-2">The Driving School Dublin</p>
                <p className="text-sm text-gray-500 leading-relaxed mb-3">
                  RSA-approved ADI providing professional driving lessons across Dublin.
                </p>
                <p className="text-sm text-gray-500">Mon–Sat &nbsp;·&nbsp; 8am–6pm</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">Quick links</p>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/prices" className="text-gray-500 hover:text-red-600 transition-colors">Prices</Link></li>
                  <li><Link href="/reviews" className="text-gray-500 hover:text-red-600 transition-colors">Reviews</Link></li>
                  <li><Link href="/about" className="text-gray-500 hover:text-red-600 transition-colors">About</Link></li>
                  <li><Link href="/contact" className="text-gray-500 hover:text-red-600 transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">Contact</p>
                <ul className="space-y-2 text-sm">
                  <li><a href="tel:+353860235666" className="text-gray-500 hover:text-red-600 transition-colors">+353 86 023 5666</a></li>
                  <li><a href="mailto:thedrivingschooldublin@gmail.com" className="text-gray-500 hover:text-red-600 transition-colors">thedrivingschooldublin@gmail.com</a></li>
                  <li>
                    <a
                      href="https://wa.me/353860235666?text=Hi!%20I'd%20like%20to%20arrange%20a%20driving%20lesson."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-red-600 transition-colors"
                    >
                      WhatsApp us
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
              <p>© {new Date().getFullYear()} The Driving School Dublin. All rights reserved.</p>
              <p>Made with <span className="text-red-500">♥</span> in Ireland</p>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
