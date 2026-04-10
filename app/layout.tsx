// app/layout.tsx
import "./globals.css";
import Link from "next/link";

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
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <header className="border-b bg-white">
          <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-extrabold tracking-tight"
              aria-label="Home"
            >
              <span className="text-gray-900">The</span>{" "}
              <span className="text-red-600">Driving</span>{" "}
              <span className="text-gray-900">School</span>{" "}
              <span className="text-gray-900">Dublin</span>
            </Link>

            <div className="flex items-center gap-5">
              <div className="space-x-5 text-sm font-medium hidden md:flex">
                <Link href="/prices" className="nav-link">Prices</Link>
                <Link href="/reviews" className="nav-link">Reviews</Link>
                <Link href="/about" className="nav-link">About</Link>
              </div>
              <Link href="/contact" className="btn-primary text-sm">
                Contact us
              </Link>
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>

        <footer className="mt-16 border-t bg-gray-50">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <div className="grid gap-8 md:grid-cols-3 mb-8">
              <div>
                <h3 className="font-extrabold text-gray-900 mb-3">The Driving School Dublin</h3>
                <p className="text-sm text-gray-600 mb-3">
                  RSA-approved ADI providing professional driving lessons across Dublin.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Hours:</strong> Mon–Sat, 8am–6pm
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/prices" className="text-gray-600 hover:text-red-600">Prices</Link></li>
                  <li><Link href="/reviews" className="text-gray-600 hover:text-red-600">Reviews</Link></li>
                  <li><Link href="/about" className="text-gray-600 hover:text-red-600">About</Link></li>
                  <li><Link href="/contact" className="text-gray-600 hover:text-red-600">Contact</Link></li> */
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Contact</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    <a href="tel:+353860235666" className="hover:text-red-600">+353 86 0235 666</a>
                  </li>
                  <li>
                    <a href="mailto:thedrivingschooldublin@gmail.com" className="hover:text-red-600">
                      thedrivingschooldublin@gmail.com
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://wa.me/353860235666?text=Hi!%20I'd%20like%20to%20arrange%20a%20driving%20lesson."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-red-600"
                    >
                      WhatsApp us
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t pt-6 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-4">
              <p>© {new Date().getFullYear()} The Driving School Dublin. All rights reserved.</p>
              <p>
                Made with <span className="text-red-600">♥</span> in Ireland
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
