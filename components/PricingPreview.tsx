// components/PricingPreview.tsx
import Link from "next/link";

export default function PricingPreview() {
  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight">Transparent Pricing</h2>
        <p className="text-gray-700">Clear, upfront costs with no hidden fees</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Standard Lesson</h3>
          <p className="mt-2 text-3xl font-extrabold text-red-600">€80</p>
          <p className="text-sm text-gray-500">per hour</p>
          <ul className="mt-4 space-y-1 text-sm text-gray-700">
            <li>• Manual (instructor&apos;s car)</li>
            <li>• Automatic (your car)</li>
            <li>• One-to-one coaching</li>
          </ul>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Pre-Test Lesson</h3>
          <p className="mt-2 text-3xl font-extrabold text-red-600">€100</p>
          <p className="text-sm text-gray-500">per session</p>
          <ul className="mt-4 space-y-1 text-sm text-gray-700">
            <li>• Test route familiarisation</li>
            <li>• Last-minute tips</li>
            <li>• Examiner insights</li>
          </ul>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">EDT Bundle</h3>
          <p className="mt-2 text-3xl font-extrabold text-red-600">€905</p>
          <p className="text-sm text-gray-500">12 lessons</p>
          <ul className="mt-4 space-y-1 text-sm text-gray-700">
            <li>• Best value package</li>
            <li>• Split payment option</li>
            <li>• Includes logbook</li>
          </ul>
        </div>
      </div>
      <div className="text-center">
        <Link href="/prices" className="btn-outline">
          View all prices →
        </Link>
      </div>
    </section>
  );
}

