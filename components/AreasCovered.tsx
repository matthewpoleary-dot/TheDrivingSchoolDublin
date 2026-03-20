import Link from "next/link";

const AREAS = [
  "Dublin 2", "Dublin 4", "Dublin 6", "Dublin 6W",
  "Dublin 8", "Dublin 10", "Dublin 12", "Dublin 14",
  "Dublin 16", "Dublin 18",
];

export default function AreasCovered() {
  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <p className="section-label">Coverage</p>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Areas we cover</h2>
        <p className="text-gray-500 text-sm">Pick-up available across South Dublin</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {AREAS.map((area) => (
          <div
            key={area}
            className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 shadow-sm"
          >
            {area}
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-gray-500">
        Not sure if we cover your area?{" "}
        <Link href="/contact" className="text-red-600 hover:text-red-700 font-medium transition-colors">
          Contact us to check
        </Link>
      </p>
    </section>
  );
}
