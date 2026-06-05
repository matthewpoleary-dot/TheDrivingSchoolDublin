// app/reviews/page.tsx
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
  { name: "Dylan O.", date: "2025-06-30", rating: 5, text: "Best instructor I've had. Pre-test session covered exactly what the examiner looked for on the day." },
  { name: "Aoife K.", date: "2025-06-02", rating: 5, text: "Patient and professional. The EDT plan was structured and I felt my confidence build each week." },
  { name: "Cian R.", date: "2025-05-20", rating: 5, text: "Knows the Churchtown and Dún Laoghaire routes inside out. Tips were spot on. Highly recommend." },
  { name: "Laura F.", date: "2025-05-01", rating: 5, text: "Booked a refresher before my test — invaluable. Clear coaching and zero waffle." },
  { name: "Mark S.", date: "2025-04-15", rating: 5, text: "Great communication and flexible scheduling. Lessons were focused and efficient." },
];

const PUBLIC_RATING_VALUE = 5.0;
const PUBLIC_REVIEW_COUNT = 36;

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

export default function ReviewsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "The Driving School Dublin",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: PUBLIC_RATING_VALUE.toFixed(1),
      reviewCount: PUBLIC_REVIEW_COUNT,
      bestRating: "5",
      worstRating: "1",
    },
    review: REVIEWS.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      reviewBody: r.text,
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: "5" },
      datePublished: r.date,
    })),
  };

  return (
    <section className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-red-600 uppercase tracking-wider">Reviews</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Trusted by Dublin learners
        </h1>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <StarRow className="h-6 w-6" />
          <span className="text-lg font-semibold text-slate-900">
            <span className="text-red-600">{PUBLIC_RATING_VALUE.toFixed(1)}</span> out of 5
            <span className="text-slate-500 font-normal"> · based on {PUBLIC_REVIEW_COUNT} reviews</span>
          </span>
        </div>
        <p className="text-base text-slate-600">
          Real feedback from learners across Dublin — Tallaght, Dún Laoghaire, and the old Churchtown routes.
        </p>
      </div>

      {/* Reviews grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {REVIEWS.map((r, i) => (
          <ReviewCard r={r} key={i} />
        ))}
      </div>

      {/* CTA */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/book" className="btn-primary">Book your lesson</Link>
        <Link href="/prices" className="btn-outline">See prices</Link>
      </div>

      <p className="text-center text-sm text-slate-500">
        All reviews are verified and sourced from{" "}
        <a
          className="text-red-600 hover:text-red-700 font-medium underline-offset-4 hover:underline"
          href="https://share.google/Gz174ck7VeSpDSx5L"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Reviews
        </a>.
      </p>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
