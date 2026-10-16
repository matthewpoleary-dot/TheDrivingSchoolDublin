// app/reviews/page.tsx
import Link from "next/link";
import { ArrowRight, Star } from "@/components/lton/Icons";
import FlipPlate from "@/components/lton/FlipPlate";

type Review = {
  name: string;
  badge?: string;     // e.g. "Local Guide"
  date: string;       // yyyy-mm-dd
  rating: number;
  text: string;
};

const GOOGLE_REVIEWS_URL = "https://share.google/Gz174ck7VeSpDSx5L";

const REVIEWS: Review[] = [
  {
    name: "Awais Aitmad",
    badge: "Local Guide",
    date: "2026-01-05",
    rating: 5,
    text:
      "Conor is a fantastic driving instructor who made the whole process of learning and passing my test so much easier. He knows the test inside out and gives you clear, practical guidance on exactly what examiners are looking for, while also making sure you're learning the skills you'll actually need to be a safe, confident driver in everyday life. His patience and calm approach mean you never feel pressured: mistakes are just opportunities to learn, and he explains everything in a way that sticks. Each lesson was well-structured, packed with useful tips, and his mock tests were so accurate they made the real exam feel familiar. Thanks to his expert teaching I passed first time. If you're looking for someone who'll not only get you through the test but also teach you how to drive properly for the long run, Conor is the instructor you want.",
  },
  {
    name: "David Downes",
    date: "2026-02-10",
    rating: 5,
    text:
      "Conor is a very experienced & patient driving instructor that helped me go from zero driving experience to fully licenced. He was a massive help to me across the 12 lessons, gave me the confidence & tools to practice driving before the test. When the test date arrived he set me up for success with as well the knowledge of whats under the bonnet & required to know on the day. I highly recommend Conor.",
  },
  {
    name: "Robbie Glynn",
    date: "2025-07-10",
    rating: 5,
    text:
      "The best Driving Instructor you could ask for. After trying a few instructors out over a long period of time, I found The Driving School Dublin. Conor had me ready for the test in a few short lessons. A complete professional and made sure that when I went to sit the test I arrived confident and assured with each element. I could not recommend him more highly.",
  },
];

export const metadata = {
  title: "Reviews | The Driving School Dublin",
  description:
    "Real Google reviews from Dublin learners who passed their test with Conor at The Driving School Dublin.",
};

function Stars({ count, size = 16 }: { count: number; size?: number }) {
  return (
    <span className="l-rating__stars" role="img" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => <Star key={i} size={size} />)}
    </span>
  );
}

export default function ReviewsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "The Driving School Dublin",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: REVIEWS.length,
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
    <div className="l-page">
      <header className="l-intro">
        <p className="l-eyebrow">Reviews</p>
        <h1 className="l-h1">From real learners.</h1>
        <p className="l-lede">Verified Google reviews from Dublin learners who passed with Conor.</p>
        <a className="l-rating-line" href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
          <span className="l-rating-line__score l-num">5.0</span>
          <Stars count={5} />
          <span>average, sourced from Google</span>
        </a>
      </header>

      <section className="l-group l-reviews" aria-label="Reviews">
        {REVIEWS.map((r) => (
          <article key={r.name} className="l-review l-reveal">
            <div className="l-review__meta">
              <Stars count={r.rating} />
              <span>
                {new Date(r.date).toLocaleDateString("en-IE", { month: "long", year: "numeric" })}
              </span>
            </div>
            <p className="l-review__text">&ldquo;{r.text}&rdquo;</p>
            <p className="l-review__who">
              {r.name}
              {r.badge && <span className="l-tag">{r.badge}</span>}
            </p>
          </article>
        ))}
      </section>

      <section className="l-close" aria-labelledby="close-title">
        <FlipPlate />
        <h2 id="close-title" className="l-h2">Ready to join them?</h2>
        <div className="l-close__ctas">
          <Link href="/book" className="l-btn l-btn--red l-btn--lg">
            Book a lesson <ArrowRight />
          </Link>
          <Link href="/prices" className="l-btn l-btn--line l-btn--lg">View prices</Link>
        </div>
        <p className="l-body" style={{ marginTop: 10, fontSize: 15 }}>
          See all reviews on{" "}
          <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="l-link">Google</a>.
        </p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
