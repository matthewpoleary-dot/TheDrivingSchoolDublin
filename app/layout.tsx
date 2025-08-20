// app/layout.tsx
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "TheDrivingSchoolDublin | Book a Lesson",
  description: "Book your driving lesson online.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        {/* Header */}
        <header className="border-b bg-white">
          <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-extrabold tracking-tight" aria-label="Home">
              <span className="text-gray-900">The</span>{" "}
              <span className="text-red-600">Driving</span>
              <span className="text-gray-900">School</span>
              <span className="text-gray-900">Dublin</span>
            </Link>

            <div className="space-x-5 text-sm font-medium">
              <Link href="/prices" className="nav-link">Prices</Link>
              <Link href="/contact" className="nav-link">Contact</Link>
            </div>
          </nav>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>

        {/* Footer */}
        <footer className="mt-16 border-t bg-gray-50">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-600 flex items-center justify-between">
            <p>© {new Date().getFullYear()} TheDrivingSchoolDublin. All rights reserved.</p>
            <p>Made with <span className="text-red-600">♥</span> in Ireland</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
