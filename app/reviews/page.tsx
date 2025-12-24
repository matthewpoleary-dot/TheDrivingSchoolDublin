// app/reviews/page.tsx
import Link from "next/link";

type Review = {
  name: string;
  date: string; // ISO or readable
  rating: number; // 1..5
  text: string;
};

const REVIEWS: Review[] = [
  { name: "Aisling M.", date: "2025-07-18", rating: 5, text: "Conor is brilliant — super calm and gave me clear, actionable feedback every lesson. Passed first time in Tallaght." },
  { name: "Dylan O.", date: "2025-06-30", rating: 5, text: "Best instructor I’ve had. Pre‑test session covered exactly what the examiner looked for on the day." },
  { name: "Aoife K.", date: "2025-06-02", rating: 5, text: "Patient and professional. The EDT plan was structured and I felt my confidence build each week." },
  { name: "Cian R.", date: "2025-05-20", rating: 5, text: "Knows the Churchtown and Dún Laoghaire routes inside out. Tips were spot on. Highly recommend." },
  { name: "Laura F.", date: "2025-05-01", rating: 5, text: "Booked a refresher before my test — invaluable. Clear coaching and zero waffle." },
  { name: "Mark S.", date: "2025-04-15", rating: 5, text: "Great communication and flexible scheduling. Lessons were focused and efficient." },
  // Add more if you want; the header below uses the fixed reviewCount = 36
];

// Fixed public rating stats (as requested)
const PUBLIC_RATING_VALUE = 5.0;
const PUBLIC_REVIEW_COUNT = 36;

function Stars({ rating = 5, size = "text-xl" }: { rating?: number; size?: string }) {
  const full = Math.round(rating);
  return (
    <div className={`flex ${size}`} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={`h-6 w-6 ${i < full ? "fill-red-600" : "fill-gray-200"}`} aria-hidden="true">
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ r }: { r: Review }) {
  return (
    <article className="rounded-2xl border shadow-sm p-6 bg-white flex flex-col gap-3">
      <Stars rating={r.rating} size="text-base" />
      <p className="text-gray-800 leading-relaxed">{r.text}</p>
      <div className="mt-2 text-sm text-gray-600">
        <span className="font-medium">{r.name}</span>
        <span className="mx-2">•</span>
        <time>{new Date(r.date).toLocaleDateString()}</time>
      </div>
    </article>
  );
}

export default function ReviewsPage() {
  // SEO structured data
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
    <section className="mx-auto max-w-6xl space-y-10">
      {/* Header / score */}
      <div className="space-y-3 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Reviews</h1>
        <div className="flex items-center justify-center gap-3">
          <Stars rating={PUBLIC_RATING_VALUE} />
          <div className="text-lg font-semibold text-gray-900">
            <span className="text-red-600">{PUBLIC_RATING_VALUE.toFixed(1)}</span> out of 5
            <span className="text-gray-500"> — based on {PUBLIC_REVIEW_COUNT} reviews</span>
          </div>
        </div>
        <p className="text-gray-700 max-w-2xl mx-auto">
          Real feedback from learners across Dublin — Tallaght, Dún Laoghaire, and the old Churchtown routes.
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {REVIEWS.map((r, i) => (
          <ReviewCard r={r} key={i} />
        ))}
      </div>

      {/* CTA row */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/contact" className="btn-primary">Contact us</Link>
        <Link href="/prices" className="btn-outline">See prices</Link>
      </div>

      {/* Read more on Google */}
      <div className="text-center text-sm text-gray-700">
        Want to see more?{" "}
        <a
          className="underline text-red-600 hover:text-red-700"
          href="https://www.google.com/search?q=The+Driving+School+Dublin&sca_esv=1c2c48b035966a68&hl=en&gl=ie&sxsrf=AE3TifNKMRoJ_SOb70NBw_s9qS8-FgTTWA%3A1755705683953&ei=U_GlaOf5OcqjhbIPorC8kQw&ved=0ahUKEwin7_ys4ZmPAxXKUUEAHSIYL8IQ4dUDCBA&uact=5&oq=The+Driving+School+Dublin&gs_lp=Egxnd3Mtd2l6LXNlcnAiGVRoZSBEcml2aW5nIFNjaG9vbCBEdWJsaW4yCxAAGIAEGJECGIoFMgUQABiABDIFEAAYgAQyBhAAGBYYHjICECYyCxAAGIAEGIYDGIoFMgsQABiABBiGAxiKBTILEAAYgAQYhgMYigUyCxAAGIAEGIYDGIoFMgUQABjvBUiwC1CdB1idB3ABeAGQAQCYAVygAVyqAQExuAEDyAEA-AEBmAICoAJqwgIKEAAYsAMY1gQYR5gDAIgGAZAGCJIHAzEuMaAH9weyBwMwLjG4B2XCBwMyLTLIBws&sclient=gws-wiz-serp#vhid=/g/11vhbycqzm&vssid=lcl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read more on Google Reviews
        </a>
        .
      </div>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
