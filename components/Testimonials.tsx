// components/Testimonials.tsx
import { StarRow } from "@/components/icons/Star";

type Review = {
  name: string;
  date: string;
  rating: number;
  text: string;
};

const REVIEWS: Review[] = [
  { name: "David Downes", date: "2025-07-18", rating: 5, text: "Conor is a very experienced & patient driving instructor that helped me go from zero driving experience to fully licenced. He was a massive help to me across the 12 lessons, gave me the confidence & tools to practice driving before the test." },
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
          <span><span className="font-bold text-slate-900">5.0 ★ rating</span> · 54 reviews · Verified on Google</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {REVIEWS.map((r, i) => (
          <ReviewCard r={r} key={i} />
        ))}
      </div>

      <div className="text-center">
        <a
          href="https://share.google/Gz174ck7VeSpDSx5L"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-slate-500 hover:text-slate-700 underline-offset-4 hover:underline"
        >
          Write a review / View all 54 verified reviews on Google Maps →
        </a>
      </div>
    </section>
  );
}
