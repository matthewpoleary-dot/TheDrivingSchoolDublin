// components/AreasCovered.tsx
import Link from "next/link";

const AREAS = [
  "Dublin 2", "Dublin 4", "Dublin 6", "Dublin 6W", "Dublin 8",
  "Dublin 10", "Dublin 12", "Dublin 14", "Dublin 16", "Dublin 18",
  "Tallaght", "Dún Laoghaire", "Churchtown",
];

export default function AreasCovered() {
  return (
    <section className="space-y-8">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-red-600 uppercase tracking-wider">Coverage</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Serving learners across Dublin
        </h2>
        <p className="text-base text-slate-600">
          Pick-up available throughout south &amp; central Dublin.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
        {AREAS.map((area) => (
          <span key={area} className="tag">
            {area}
          </span>
        ))}
      </div>

      <p className="text-center text-sm text-slate-500">
        Not listed?{" "}
        <Link href="/contact" className="text-red-600 hover:text-red-700 font-medium underline-offset-4 hover:underline">
          Contact us
        </Link>
        {" "}— we cover most of greater Dublin.
      </p>
    </section>
  );
}
