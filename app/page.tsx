import Link from "next/link";
import type { Metadata } from "next";
import {
  Container,
  Section,
  Plate,
  Chevrons,
  TickList,
  Check,
  ArrowRight,
} from "@/components/brand";
import NextAvailable from "@/components/NextAvailable";
import {
  AREAS,
  CONTACT,
  INSTRUCTOR,
  LESSON_TYPES,
  TEST_CENTRES,
  contactLinks,
  formatPrice,
} from "@/lib/config";
import { getPublishedReviews, aggregateFromVerified, localBusinessJsonLd } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Driving Lessons Dublin | Taught by a Former RSA Tester",
  description:
    "Driving lessons across Dublin with Conor, an RSA-approved ADI and former RSA driving tester. EDT, pre-test preparation and car hire. Book online in under a minute.",
  alternates: { canonical: "/" },
};

export const revalidate = 300;

export default async function HomePage() {
  const reviews = await getPublishedReviews(6);
  const aggregate = aggregateFromVerified(reviews);

  return (
    <>
      <Hero />
      <Credibility aggregate={aggregate} />
      <HowItWorks />
      <Lessons />
      <WhyEx />
      <Reviews reviews={reviews} aggregate={aggregate} />
      <Areas />
      <FinalCta />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd({ aggregate, reviews })),
        }}
      />
    </>
  );
}

/* ========================================================================== */

function Hero() {
  return (
    <section className="border-b-2 border-ink bg-paper">
      <Container size="wide" className="py-12 sm:py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:items-start lg:gap-14">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <span className="inline-block h-2 w-2 bg-plate" aria-hidden="true" />
              Dublin &middot; RSA-approved ADI
            </p>

            {/* No hard line breaks: the balanced wrap keeps this readable from
                360px to 1600px without stranding a word on its own line. */}
            <h1 className="mt-5 text-[clamp(2.25rem,5.2vw,3.75rem)] font-extrabold leading-[0.94] tracking-[-0.035em] text-balance">
              Learn from the person who used to{" "}
              <span className="text-plate">mark the test.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
              {INSTRUCTOR.firstName} is an approved driving instructor and a{" "}
              <strong className="font-bold text-ink">former RSA driving tester</strong>. He
              spent years on the other side of the clipboard at {TEST_CENTRES.join(", ")}, so
              he knows exactly what loses people marks, and how to stop it happening to you.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book" className="btn btn-primary text-base">
                Book a lesson
                <ArrowRight />
              </Link>
              <Link href="/prices" className="btn btn-outline text-base">
                See prices
              </Link>
            </div>

            <dl className="mt-11 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
              {[
                ["Ex-RSA", "driving tester"],
                ["3", "test centres known"],
                ["EDT", "logged same day"],
                ["7 days", "a week"],
              ].map(([value, label]) => (
                <div key={label} className="border-t-2 border-ink pt-2.5">
                  <dt className="tabular text-2xl font-extrabold leading-none tracking-[-0.03em]">
                    {value}
                  </dt>
                  <dd className="mt-1 text-[0.8125rem] leading-snug text-ink-soft">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* The booking system, visible without scrolling. */}
          <NextAvailable />
        </div>
      </Container>
      <Chevrons />
    </section>
  );
}

/* ========================================================================== */

function Credibility({ aggregate }: { aggregate: { ratingValue: number; reviewCount: number } | null }) {
  return (
    <section className="border-b-2 border-ink bg-ink py-5 text-white">
      <Container>
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-bold">
          {[
            "RSA-approved ADI",
            "Former RSA driving tester",
            "Dual-control, fully insured",
            "Manual and automatic",
            aggregate ? `${aggregate.ratingValue} from ${aggregate.reviewCount} reviews` : null,
          ]
            .filter(Boolean)
            .map((item) => (
              <li key={item as string} className="flex items-center gap-2">
                <Check className="text-plate" />
                {item}
              </li>
            ))}
        </ul>
      </Container>
    </section>
  );
}

/* ========================================================================== */

function HowItWorks() {
  const steps = [
    {
      title: "Pick a lesson and a time",
      body: "Real availability, straight from Conor's calendar. Choose a slot that suits you, no phone tag.",
    },
    {
      title: "Pay a small deposit",
      body: `${formatPrice(2000)} holds the slot. The rest is paid to Conor on the day. Free cancellation up to 24 hours before.`,
    },
    {
      title: "He collects you",
      body: "Confirmation and a calendar invite arrive by email. Conor picks you up at your door at the agreed time.",
    },
  ];

  return (
    <Section number="1" eyebrow="How it works" title="Booked in under a minute.">
      <ol className="grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="panel-quiet p-6">
            <Plate letter={String(index + 1)} size="md" tone="ink" />
            <h3 className="mt-5 text-lg font-extrabold tracking-[-0.02em]">{step.title}</h3>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ========================================================================== */

function Lessons() {
  return (
    <Section
      number="2"
      eyebrow="Lessons"
      title="Whatever stage you are at."
      intro="Four lessons you can book online right now, and two we price over the phone because they need a conversation first."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {LESSON_TYPES.map((lesson) => (
          <article
            key={lesson.slug}
            className={`flex flex-col p-6 ${lesson.popular ? "panel" : "panel-quiet"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-extrabold tracking-[-0.02em]">{lesson.name}</h3>
              {lesson.popular && <span className="badge badge-plate">Most booked</span>}
            </div>

            <p className="mt-2 flex items-baseline gap-2">
              <span className="tabular text-2xl font-extrabold tracking-[-0.03em]">
                {lesson.priceCents > 0 ? formatPrice(lesson.priceCents) : "On request"}
              </span>
              {lesson.priceCents > 0 && (
                <span className="text-sm text-ink-soft">{lesson.priceUnit}</span>
              )}
            </p>

            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
              {lesson.summary}
            </p>

            <TickList items={lesson.includes} className="mt-5" />

            <div className="mt-6 pt-1">
              {lesson.bookable ? (
                <Link
                  href={`/book?service=${lesson.slug}`}
                  className="btn btn-ink w-full text-sm"
                >
                  Book this lesson
                  <ArrowRight />
                </Link>
              ) : (
                <>
                  <a
                    href={contactLinks.whatsapp(`Hi Conor, I'd like to ask about ${lesson.name}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline w-full text-sm"
                  >
                    Ask about this
                  </a>
                  <p className="mt-2.5 text-xs leading-relaxed text-ink-faint">
                    {lesson.enquiryReason}
                  </p>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ========================================================================== */

function WhyEx() {
  return (
    <section className="bg-ink py-16 text-white sm:py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">
              The difference
            </p>
            <h2 className="mt-3 text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
              Most instructors teach you to drive.
              <br />
              <span className="text-plate">Conor teaches you to pass.</span>
            </h2>
          </div>

          <div className="space-y-6">
            <p className="text-lg leading-relaxed text-white/80">
              Those are not the same skill. Plenty of good drivers fail their test, usually on
              the same small handful of things, marked the same small handful of ways.
            </p>
            <p className="leading-relaxed text-white/70">
              Having sat in the examiner&apos;s seat, Conor marks your mock test to the actual
              RSA sheet, fault by fault, then tells you precisely which of those faults would
              have ended your day, and how to drill it out before the real thing.
            </p>
            <Link href="/about" className="btn btn-primary text-sm">
              More about Conor
              <ArrowRight />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ========================================================================== */

function Reviews({
  reviews,
  aggregate,
}: {
  reviews: Awaited<ReturnType<typeof getPublishedReviews>>;
  aggregate: { ratingValue: number; reviewCount: number } | null;
}) {
  if (reviews.length === 0) {
    return (
      <Section
        number="3"
        eyebrow="Pupils"
        title="What people say."
        intro="Reviews are pulled straight from the database, so what you read here is what pupils actually wrote."
      >
        <div className="panel-quiet p-8 text-center">
          <p className="text-ink-soft">
            Reviews are being moved across from Google. In the meantime,{" "}
            <a href={contactLinks.whatsapp()} className="font-bold text-ink underline">
              ask us for references
            </a>{" "}
            and we will happily put you in touch with recent pupils.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section
      number="3"
      eyebrow="Pupils"
      title="What people say."
      intro={
        aggregate
          ? `${aggregate.ratingValue} out of 5 across ${aggregate.reviewCount} verified reviews.`
          : undefined
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {reviews.slice(0, 6).map((review) => (
          <figure key={review.id} className="panel-quiet flex flex-col p-6">
            <div className="flex gap-0.5" aria-label={`${review.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} filled={i < review.rating} />
              ))}
            </div>
            <blockquote className="mt-4 flex-1 text-[0.9375rem] leading-relaxed">
              {review.body}
            </blockquote>
            <figcaption className="mt-4 border-t border-rule pt-3 text-sm">
              <span className="font-bold">{review.authorName}</span>
              {review.isVerified && (
                <span className="ml-2 text-xs text-ink-faint">Verified</span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/reviews" className="btn btn-outline text-sm">
          Read all reviews
          <ArrowRight />
        </Link>
      </div>
    </Section>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${filled ? "fill-plate" : "fill-rule"}`}
      aria-hidden="true"
    >
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

/* ========================================================================== */

function Areas() {
  return (
    <Section
      number="4"
      eyebrow="Where"
      title="Pick-up across south Dublin."
      intro="Door-to-door collection in these areas. If you are just outside, ask anyway, it is usually fine."
    >
      <ul className="flex flex-wrap gap-2">
        {AREAS.map((area) => (
          <li
            key={area}
            className="border-2 border-rule bg-white px-4 py-2.5 text-sm font-bold"
          >
            {area}
          </li>
        ))}
      </ul>

      <div className="mt-8 panel-quiet p-6">
        <p className="eyebrow">Test centres covered</p>
        <p className="mt-2 text-lg font-bold">{TEST_CENTRES.join(" · ")}</p>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
          Conor worked in all three. Pre-test lessons run on the genuine routes, not
          approximations of them.
        </p>
      </div>
    </Section>
  );
}

/* ========================================================================== */

function FinalCta() {
  return (
    <section className="border-t-2 border-ink bg-plate py-16 text-white sm:py-20">
      <Container>
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[clamp(1.75rem,4.5vw,3rem)] font-extrabold leading-[0.98] tracking-[-0.03em]">
              Get it done.
            </h2>
            <p className="mt-3 max-w-md text-lg text-white/90">
              Pick a time that suits you and pay a {formatPrice(2000)} deposit. That is the
              whole booking.
            </p>
          </div>

          <div className="flex flex-none flex-wrap gap-3">
            <Link
              href="/book"
              className="btn bg-white text-ink shadow-[3px_3px_0_#141414] hover:translate-x-[-1px] hover:translate-y-[-1px] text-base"
            >
              Book a lesson
              <ArrowRight />
            </Link>
            <a
              href={contactLinks.tel}
              className="btn border-2 border-white bg-transparent text-white hover:bg-white hover:text-plate text-base"
            >
              {CONTACT.phoneDisplay}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
