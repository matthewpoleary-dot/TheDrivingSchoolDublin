// components/Testimonials.tsx
import { StarRow } from "@/components/icons/Star";

const GOOGLE_REVIEWS_URL = "https://share.google/Gz174ck7VeSpDSx5L";

type Review = {
  name: string;
  date: string;
  rating: number;
  text: string;
  url: string;
};

// Real reviews from Google. All cards link out to the live Google reviews page.
const REVIEWS: Review[] = [
  {
    name: "David Downes",
    date: "2025-02-15",
    rating: 5,
    text: "Conor is a very experienced & patient driving instructor that helped me go from zero driving experience to fully licenced. He was a massive help to me across the 12 lessons, gave me the confidence & tools to practice driving before the test.",
    url: GOOGLE_REVIEWS_URL,
  },
  {
    name: "Awais Aitmad",
    date: "2026-01-05",
    rating: 5,
    text: "Conor is a fantastic driving instructor who made the whole process of learning and passing my test so much easier. He knows the test inside out and gives you clear, practical guidance on exactly what examiners are looking for.",
    url: GOOGLE_REVIEWS_URL,
  },
  {
    name: "Johanna Tighe",
    date: "2025-12-05",
    rating: 5,
    text: "I can't recommend Conor enough! He's an amazing driving instructor who made every lesson enjoyable, calm, and confidence-boosting. From the very first lesson, he was patient, clear, and encouraging — always explaining things in a way that made sense.",
    url: GOOGLE_REVIEWS_URL,
  },
];

function ReviewCard({ r }: { r: Review }) {
  return (
    <a
      href={r.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card flex flex-col gap-5 h-full hover:-translate-y-0.5 transition"
    >
      <div className="flex items-center justify-between">
        <StarRow className="h-5 w-5" />
        {/* Google "G" mark */}
        <svg className="h-5 w-5" viewBox="0 0 48 48" aria-label="Google">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
      </div>
      <p className="text-slate-700 leading-relaxed">&ldquo;{r.text}&rdquo;</p>
      <div className="mt-auto pt-2 border-t border-slate-100">
        <p className="text-sm font-semibold text-slate-900">{r.name}</p>
        <time className="text-xs text-slate-500">
          {new Date(r.date).toLocaleDateString("en-IE", { month: "long", year: "numeric" })}
        </time>
      </div>
    </a>
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
          href={GOOGLE_REVIEWS_URL}
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
