// components/Testimonials.tsx
import Link from "next/link";

type Review = {
  name: string;
  date: string;
  rating: number;
  text: string;
};

const REVIEWS: Review[] = [
  { name: "Aisling M.", date: "2025-07-18", rating: 5, text: "Conor is brilliant — super calm and gave me clear, actionable feedback every lesson. Passed first time in Tallaght." },
  { name: "Dylan O.", date: "2025-06-30", rating: 5, text: "Best instructor I've had. Pre‑test session covered exactly what the examiner looked for on the day." },
  { name: "Aoife K.", date: "2025-06-02", rating: 5, text: "Patient and professional. The EDT plan was structured and I felt my confidence build each week." },
  { name: "Cian R.", date: "2025-05-20", rating: 5, text: "Knows the Churchtown and Dún Laoghaire routes inside out. Tips were spot on. Highly recommend." },
  { name: "Laura F.", date: "2025-05-01", rating: 5, text: "Booked a refresher before my test — invaluable. Clear coaching and zero waffle." },
];

function Stars({ rating = 5 }: { rating?: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex text-base" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={`h-5 w-5 ${i < full ? "fill-red-600" : "fill-gray-200"}`} aria-hidden="true">
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ r }: { r: Review }) {
  return (
    <article className="rounded-2xl border shadow-sm p-6 bg-white flex flex-col gap-3">
      <Stars rating={r.rating} />
      <p className="text-gray-800 leading-relaxed text-sm">{r.text}</p>
      <div className="mt-auto text-xs text-gray-600">
        <span className="font-medium">{r.name}</span>
        <span className="mx-2">•</span>
        <time>{new Date(r.date).toLocaleDateString("en-IE", { month: "short", year: "numeric" })}</time>
      </div>
    </article>
  );
}

export default function Testimonials() {
  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight">Trusted by learners across Dublin</h2>
        <p className="text-gray-700">Real feedback from students who passed their test</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REVIEWS.slice(0, 3).map((r, i) => (
          <ReviewCard r={r} key={i} />
        ))}
      </div>
      <div className="text-center">
        <Link href="/reviews" className="text-red-600 hover:text-red-700 underline font-medium">
          Read more reviews →
        </Link>
      </div>
    </section>
  );
}

