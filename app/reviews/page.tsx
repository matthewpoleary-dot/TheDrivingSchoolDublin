import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Review {
  name: string;
  date: string;
  rating: number;
  text: string;
}

// ── Fallback reviews (shown if Google API is not configured or fails) ──────────

const FALLBACK_REVIEWS: Review[] = [
  { name: "Aisling M.", date: "2025-07-18", rating: 5, text: "Conor is brilliant — super calm and gave me clear, actionable feedback every lesson. Passed first time in Tallaght." },
  { name: "Dylan O.", date: "2025-06-30", rating: 5, text: "Best instructor I've had. Pre‑test session covered exactly what the examiner looked for on the day." },
  { name: "Aoife K.", date: "2025-06-02", rating: 5, text: "Patient and professional. The EDT plan was structured and I felt my confidence build each week." },
  { name: "Cian R.", date: "2025-05-20", rating: 5, text: "Knows the Churchtown and Dún Laoghaire routes inside out. Tips were spot on. Highly recommend." },
  { name: "Laura F.", date: "2025-05-01", rating: 5, text: "Booked a refresher before my test — invaluable. Clear coaching and zero waffle." },
  { name: "Mark S.", date: "2025-04-15", rating: 5, text: "Great communication and flexible scheduling. Lessons were focused and efficient." },
];

const GOOGLE_REVIEWS_URL = "https://share.google/Gz174ck7VeSpDSx5L";
const FALLBACK_RATING = 5.0;
const FALLBACK_COUNT = 36;

// ── Google Places API fetch (server-side, cached 1 hour) ─────────────────────

interface GoogleResult {
  rating: number;
  totalRatings: number;
  reviews: Review[];
}

async function fetchGoogleReviews(): Promise<GoogleResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return null;

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=rating,userRatingCount,reviews&languageCode=en`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "rating,userRatingCount,reviews",
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;

    const data = await res.json();
    return {
      rating: data.rating ?? FALLBACK_RATING,
      totalRatings: data.userRatingCount ?? FALLBACK_COUNT,
      reviews: (data.reviews ?? []).map((r: Record<string, unknown>) => ({
        name: (r.authorAttribution as Record<string, string>)?.displayName ?? "Google Reviewer",
        rating: (r.rating as number) ?? 5,
        text: ((r.text as Record<string, string>)?.text ?? (r.originalText as Record<string, string>)?.text ?? ""),
        date: (r.publishTime as string) ?? new Date().toISOString(),
      })),
    };
  } catch {
    return null;
  }
}

// ── UI components ─────────────────────────────────────────────────────────────

function Stars({ rating, large = false }: { rating: number; large?: boolean }) {
  const full = Math.round(rating);
  const dim = large ? "h-7 w-7" : "h-4 w-4";
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={`${dim} ${i < full ? "fill-red-500" : "fill-gray-200"}`} aria-hidden="true">
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-label="Google">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335"/>
    </svg>
  );
}

function ReviewCard({ review, fromGoogle }: { review: Review; fromGoogle: boolean }) {
  const dateStr = new Date(review.date).toLocaleDateString("en-IE", { month: "short", year: "numeric" });
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <Stars rating={review.rating} />
      <p className="flex-1 text-sm leading-relaxed text-gray-700">{review.text}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-gray-500">
          <span className="font-medium text-gray-800">{review.name}</span>
          <span className="mx-1.5">·</span>
          <time>{dateStr}</time>
        </div>
        {fromGoogle && <GoogleLogo />}
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const metadata = {
  title: "Reviews | The Driving School Dublin",
  description: "Read what learners say about driving lessons with The Driving School Dublin. Real Google reviews from students across Dublin.",
};

export default async function ReviewsPage() {
  const google = await fetchGoogleReviews();
  const isLive = !!google && google.reviews.length > 0;

  const reviews = isLive ? google.reviews : FALLBACK_REVIEWS;
  const rating = isLive ? google.rating : FALLBACK_RATING;
  const totalRatings = isLive ? google.totalRatings : FALLBACK_COUNT;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "The Driving School Dublin",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: rating.toFixed(1),
      reviewCount: totalRatings,
      bestRating: "5",
      worstRating: "1",
    },
  };

  return (
    <section className="space-y-14">

      {/* Header */}
      <div className="text-center space-y-5">
        <p className="section-label">What learners say</p>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Reviews</h1>

        {/* Score card */}
        <div className="inline-flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-12 py-8 shadow-sm">
          <Stars rating={rating} large />
          <p className="text-5xl font-bold text-gray-900">
            {rating.toFixed(1)}
            <span className="text-xl font-normal text-gray-400"> / 5</span>
          </p>
          <p className="text-sm text-gray-500">Based on {totalRatings} Google reviews</p>
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:shadow-md transition-shadow"
          >
            <GoogleLogo />
            View on Google
          </a>
        </div>

        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          Real feedback from learners across Dublin — Tallaght, Dún Laoghaire, and beyond.
          {isLive && " Updated live from Google."}
        </p>
      </div>

      {/* Reviews grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r, i) => (
          <ReviewCard key={i} review={r} fromGoogle={isLive} />
        ))}
      </div>

      {/* See all on Google */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
        <p className="font-semibold text-gray-900 mb-1">See all {totalRatings} reviews on Google</p>
        <p className="text-sm text-gray-500 mb-5">
          {isLive
            ? "Showing the most recent reviews. Read the full list on our Google Business profile."
            : "All reviews are sourced from our Google Business profile."}
        </p>
        <a
          href={GOOGLE_REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Open Google Reviews
        </a>
      </div>

      {/* CTA */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/contact" className="btn-primary">Book a lesson</Link>
        <Link href="/prices" className="btn-outline">See prices</Link>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
