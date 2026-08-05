import type { Metadata } from "next";
import Link from "next/link";
import { Container, Plate, Chevrons, TickList, ArrowRight } from "@/components/brand";
import FAQ from "@/components/FAQ";
import { BOOKING_POLICY, LESSON_TYPES, contactLinks, formatPrice } from "@/lib/config";

export const metadata: Metadata = {
  title: "Prices",
  description:
    "Driving lesson prices in Dublin. Standard lessons from EUR 80, pre-test sessions EUR 100, EDT and car hire for your test. No hidden charges.",
  alternates: { canonical: "/prices" },
};

/**
 * Weekend rates are deliberately not published. They are agreed in
 * conversation because availability varies. This is a decision, not an
 * oversight, and it was already the case on the previous site.
 */
export default function PricesPage() {
  return (
    <>
      <section className="border-b-2 border-ink bg-paper">
        <Container className="py-10 sm:py-14">
          <div className="flex items-start gap-4">
            <Plate letter="L" size="lg" className="mt-1" />
            <div>
              <p className="eyebrow">Prices</p>
              <h1 className="mt-2 text-[clamp(2rem,5.5vw,3.25rem)] font-extrabold leading-[0.96] tracking-[-0.035em]">
                What it costs.
                <br />
                All of it.
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
                Monday to Friday rates. Evening and weekend slots exist but vary, so we agree
                those on the phone rather than pretend a single number covers them.
              </p>
            </div>
          </div>
        </Container>
        <Chevrons />
      </section>

      <Container className="py-12 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {LESSON_TYPES.map((lesson) => (
            <article
              key={lesson.slug}
              className={`flex flex-col p-6 ${lesson.popular ? "panel" : "panel-quiet"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-extrabold tracking-[-0.02em]">{lesson.name}</h2>
                {lesson.popular && <span className="badge badge-plate">Most booked</span>}
              </div>

              <p className="mt-3 flex items-baseline gap-2">
                <span
                  data-price
                  className="text-[2.25rem] font-extrabold leading-none tracking-[-0.035em]"
                >
                  {lesson.priceCents > 0 ? formatPrice(lesson.priceCents) : "On request"}
                </span>
                {lesson.priceCents > 0 && (
                  <span className="text-sm text-ink-soft">{lesson.priceUnit}</span>
                )}
              </p>

              <p className="mt-1 text-sm text-ink-faint">
                {lesson.durationMinutes} minutes &middot; Monday to Friday
              </p>

              <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-soft">
                {lesson.summary}
              </p>

              <TickList items={lesson.includes} className="mt-5 flex-1" />

              <div className="mt-6">
                {lesson.bookable ? (
                  <Link
                    href={`/book?service=${lesson.slug}`}
                    className="btn btn-ink w-full text-sm"
                  >
                    Choose a time
                    <ArrowRight />
                  </Link>
                ) : (
                  <>
                    <a
                      href={contactLinks.whatsapp(
                        `Hi Conor, I'd like to ask about ${lesson.name}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline w-full text-sm"
                    >
                      Get a price
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

        <div className="panel mt-10 p-6 sm:p-8">
          <h2 className="text-xl font-extrabold tracking-[-0.02em]">
            Car hire for your test, in detail
          </h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
            Priced by what you need on the day. All three include a roadworthy, fully insured
            dual-control car, and Conor there before and after.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { option: "1", label: "At the test centre", price: "from €150" },
              { option: "2", label: "Local pick-up and drop-off", price: "from €200" },
              { option: "3", label: "With a pre-test lesson", price: "from €245" },
            ].map((tier) => (
              <div key={tier.option} className="border-2 border-rule p-5">
                <Plate letter={tier.option} size="sm" tone="ink" />
                <p className="mt-3 text-sm text-ink-soft">{tier.label}</p>
                <p data-price className="mt-2 text-2xl font-extrabold tracking-[-0.03em]">
                  {tier.price}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-sm text-ink-faint">
            Monday to Friday test dates. Saturday on request. Not available Sundays.
          </p>

          <a
            href={contactLinks.whatsapp("Hi Conor, I need car hire for my test.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary mt-6 text-sm"
          >
            Arrange car hire
            <ArrowRight />
          </a>
        </div>

        <div className="panel-quiet mt-6 p-6">
          <h2 className="font-extrabold">How paying works</h2>
          <ul className="mt-3 space-y-2 text-[0.9375rem] leading-relaxed text-ink-soft">
            <li>
              <strong className="text-ink">
                Choose a {formatPrice(BOOKING_POLICY.depositCents)} deposit or pay in full
              </strong>{" "}
              online to hold your slot, by card through Stripe.
            </li>
            <li>
              <strong className="text-ink">The balance</strong> to Conor on the day, cash or
              card, whichever suits.
            </li>
            <li>
              <strong className="text-ink">
                Free cancellation up to {BOOKING_POLICY.freeCancellationHours} hours before
              </strong>
              , with the amount paid refunded automatically.
            </li>
          </ul>
        </div>
      </Container>

      <FAQ />
    </>
  );
}
