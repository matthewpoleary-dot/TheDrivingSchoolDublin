import type { Metadata } from "next";
import Link from "next/link";
import { Container, Plate, Chevrons, ArrowRight } from "@/components/brand";
import { contactLinks } from "@/lib/config";
import {
  getPublishedReviews,
  aggregateFromVerified,
  localBusinessJsonLd,
  type Review,
} from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "What pupils say about learning to drive in Dublin with Conor, an RSA-approved instructor and former RSA driving tester.",
  alternates: { canonical: "/reviews" },
};

export const revalidate = 300;

export default async function ReviewsPage() {
  const reviews = await getPublishedReviews(50);
  const aggregate = aggregateFromVerified(reviews);

  return (
    <>
      <section className="border-b-2 border-ink bg-paper">
        <Container className="py-10 sm:py-14">
          <div className="flex items-start gap-4">
            <Plate letter="5" size="lg" className="mt-1" />
            <div>
              <p className="eyebrow">Reviews</p>
              <h1 className="mt-2 text-[clamp(2rem,5.5vw,3.25rem)] font-extrabold leading-[0.96] tracking-[-0.035em]">
                What pupils say.
              </h1>
              {aggregate ? (
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
                  <span className="tabular font-bold text-ink">
                    {aggregate.ratingValue} out of 5
                  </span>{" "}
                  across {aggregate.reviewCount} verified{" "}
                  {aggregate.reviewCount === 1 ? "review" : "reviews"}.
                </p>
              ) : (
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
                  Every review here was written by a real pupil.
                </p>
              )}
            </div>
          </div>
        </Container>
        <Chevrons />
      </section>

      <Container className="py-12 sm:py-16">
        {reviews.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        <div className="panel mt-12 p-6 sm:p-8">
          <h2 className="text-xl font-extrabold tracking-[-0.02em]">
            Want to talk to a past pupil?
          </h2>
          <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-ink-soft">
            Ask and we will put you in touch with someone who has recently done what you are
            about to do. Reading reviews is one thing, hearing it from a person is another.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/book" className="btn btn-primary text-sm">
              Book a lesson
              <ArrowRight />
            </Link>
            <a
              href={contactLinks.whatsapp("Hi Conor, could I speak to a past pupil?")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-quiet text-sm"
            >
              Ask for a reference
            </a>
          </div>
        </div>
      </Container>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd({ aggregate, reviews })),
        }}
      />
    </>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="panel-quiet flex flex-col p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              viewBox="0 0 24 24"
              className={`h-4 w-4 ${i < review.rating ? "fill-plate" : "fill-rule"}`}
              aria-hidden="true"
            >
              <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          ))}
        </div>
        {review.isVerified && (
          <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-pass">
            Verified
          </span>
        )}
      </div>

      <blockquote className="mt-4 flex-1 text-[0.9375rem] leading-relaxed">
        {review.body}
      </blockquote>

      <figcaption className="mt-5 flex items-baseline justify-between gap-2 border-t border-rule pt-3 text-sm">
        <span className="font-bold">{review.authorName}</span>
        <time dateTime={review.reviewedAt} className="tabular text-xs text-ink-faint">
          {new Date(review.reviewedAt).toLocaleDateString("en-IE", {
            month: "short",
            year: "numeric",
          })}
        </time>
      </figcaption>
    </figure>
  );
}

function EmptyState() {
  return (
    <div className="panel-quiet p-8 text-center sm:p-12">
      <h2 className="text-xl font-extrabold tracking-[-0.02em]">Reviews are on their way</h2>
      <p className="mx-auto mt-3 max-w-lg text-[0.9375rem] leading-relaxed text-ink-soft">
        Conor&apos;s reviews are being moved across from Google so that everything shown here
        is traceable to a real, checkable source. We would rather show nothing than show
        something we cannot stand over.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/book" className="btn btn-primary text-sm">
          Book a lesson
          <ArrowRight />
        </Link>
        <a
          href={contactLinks.whatsapp("Hi Conor, could I speak to a past pupil?")}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-quiet text-sm"
        >
          Ask for a reference
        </a>
      </div>
    </div>
  );
}
