import { Container, Plate } from "@/components/brand";
import { BOOKING_POLICY, TEST_CENTRES, formatPrice } from "@/lib/config";

/**
 * FAQ, rendered as native details/summary.
 *
 * No JavaScript, keyboard accessible for free, and the answers are still in
 * the HTML for search engines even while collapsed. The FAQPage schema is
 * emitted from the same array, so the two can never drift apart.
 */

const ITEMS = [
  {
    question: "Manual or automatic?",
    answer:
      "Lessons in Conor's car are manual, in a dual-control vehicle. Automatic lessons run in your own car, provided it is taxed, insured and roadworthy. If you are not sure which you want, book a standard lesson and talk it through on the day.",
  },
  {
    question: "What is EDT, and do I have to do it?",
    answer:
      "Essential Driver Training is twelve mandatory lessons every Irish learner driver must complete before sitting the test. You cannot skip it. Each lesson is logged to your RSA logbook on the day it is taught, and you can book them one at a time or as a full programme.",
  },
  {
    question: "How long is a lesson?",
    answer:
      "Standard, EDT and refresher lessons are 60 minutes. Pre-test lessons are 90 minutes, because a mock test plus a proper debrief does not fit into an hour.",
  },
  {
    question: "What makes a pre-test lesson different?",
    answer: `Conor is a former RSA driving tester. A pre-test lesson is a full mock test on the genuine routes out of ${TEST_CENTRES.join(", ")}, marked against the actual RSA marking sheet, followed by a debrief on precisely which faults would have failed you.`,
  },
  {
    question: "Do you do weekends?",
    answer:
      "Yes, subject to availability, and priced separately because weekend slots are limited. Ring or message rather than booking online and we will sort a time.",
  },
  {
    question: "Can I use your car for my test?",
    answer:
      "Yes. Car hire for the test starts at €150 at the test centre, €200 with local pick-up and drop-off, or €245 including a pre-test lesson beforehand. Test-day hire has to be matched to your test time, so it is arranged by phone.",
  },
  {
    question: "How much do I pay up front?",
    answer: `A ${formatPrice(BOOKING_POLICY.depositCents)} deposit by card holds your slot. The balance is paid to Conor on the day, cash or card. The deposit exists so slots are not held by people who never turn up.`,
  },
  {
    question: "What if I need to cancel?",
    answer: `Cancel from the link in your confirmation email any time up to ${BOOKING_POLICY.freeCancellationHours} hours before the lesson and the deposit is refunded automatically. Inside ${BOOKING_POLICY.freeCancellationHours} hours it is not refunded, because the slot can rarely be filled at that notice. If something genuinely went wrong, ring, he is reasonable.`,
  },
  {
    question: "Where do you pick up from?",
    answer:
      "Door-to-door across south Dublin: Dublin 2, 4, 6, 6W, 8, 10, 12, 14, 16 and 18. Just outside that? Ask anyway, it is usually fine.",
  },
  {
    question: "I am really nervous. Is that a problem?",
    answer:
      "No, and it is more common than you would think. Say so when you book, in the notes box, and the first lesson starts somewhere quiet at whatever pace you need.",
  },
] as const;

export default function FAQ() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <section className="border-t-2 border-ink bg-paper-dim py-14 sm:py-20">
      <Container>
        <div className="flex items-start gap-4">
          <Plate letter="?" size="md" tone="ink" className="mt-1" />
          <div>
            <p className="eyebrow">Questions</p>
            <h2 className="mt-2 text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
              The things people ask.
            </h2>
          </div>
        </div>

        <div className="mt-9 divide-y-2 divide-ink border-y-2 border-ink">
          {ITEMS.map((item) => (
            <details key={item.question} className="group">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-5 text-left font-bold [&::-webkit-details-marker]:hidden">
                <span className="text-[1.0625rem] leading-snug">{item.question}</span>
                <span
                  aria-hidden="true"
                  className="mt-1 flex h-6 w-6 flex-none items-center justify-center border-2 border-ink text-lg font-extrabold leading-none transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-6 pr-10 text-[0.9375rem] leading-relaxed text-ink-soft">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </Container>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
