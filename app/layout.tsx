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
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight">
              <span className="text-black">The</span>
              <span className="text-indigo-600">DrivingSchoolDublin</span>
            </Link>
            <div className="space-x-4 text-sm">
              <Link href="/book" className="text-gray-700 hover:text-black">Book</Link>
              <Link href="/prices" className="text-gray-700 hover:text-black">Prices</Link>
              <a href="#contact" className="text-gray-700 hover:text-black">Contact</a>
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>

        <footer className="mt-16 border-t bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-600 flex items-center justify-between">
            <p>© {new Date().getFullYear()} TheDrivingSchoolDublin. All rights reserved.</p>
            <p>Made with ❤️ in Ireland</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
