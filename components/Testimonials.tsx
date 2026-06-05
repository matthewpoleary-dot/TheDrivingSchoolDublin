// components/Testimonials.tsx
import Link from "next/link";
import { StarRow } from "@/components/icons/Star";

type Review = {
  name: string;
  date: string;
  rating: number;
  text: string;
};

const REVIEWS: Review[] = [
  { name: "Aisling M.", date: "2025-07-18", rating: 5, text: "Conor is brilliant — super calm and gave me clear, actionable feedback every lesson. Passed first time in Tallaght." },
  { name: "Dylan O.",  date: "2025-06-30", rating: 5, text: "Best instructor I've had. Pre-test session covered exactly what the examiner looked for on the day." },
  { name: "Aoife K.",  date: "2025-06-02", rating: 5, text: "Patient and professional. The EDT plan was structured and I felt my confidence build each week." },
];

function ReviewCard({ r }: { r: Review }) {
  return (
    <article className="card flex flex-col gap-5 h-full">
      <StarRow className="h-5 w-5" />
      <p className="text-slate-700 leading-relaxed">&ldquo;{r.text}&rdquo;</p>
      <div className="mt-auto pt-2 border-t border-slate-100">
        <p className="text-sm font-semibold text-slate-900">{r.name}</p>
        <time className="text-xs text-slate-500">
          {new Date(r.date).toLocaleDateString("en-IE", { month: "long", year: "numeric" })}
        </time>
      </div>
    </article>
  );
}

export default function Testimonials() {
  return (
    <section className="space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-red-600 uppercase tracking-wider">Testimonials</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Trusted by learners across Dublin
        </h2>
        <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
          <StarRow className="h-4 w-4" />
          <span><span className="font-bold text-slate-900">5.0</span> · 36 reviews · Verified on Google</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {REVIEWS.map((r, i) => (
          <ReviewCard r={r} key={i} />
        ))}
      </div>

      <div className="text-center">
        <Link href="/reviews" className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700">
          Read all reviews
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
