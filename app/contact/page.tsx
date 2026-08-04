import type { Metadata } from "next";
import Link from "next/link";
import { Container, Plate, Chevrons, ArrowRight } from "@/components/brand";
import ContactForm from "@/components/ContactForm";
import { AREAS, CONTACT, OPENING_HOURS, contactLinks } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Ring, WhatsApp or email The Driving School Dublin. Or book a lesson online in under a minute.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="border-b-2 border-ink bg-paper">
        <Container className="py-10 sm:py-14">
          <div className="flex items-start gap-4">
            <Plate letter="?" size="lg" className="mt-1" />
            <div>
              <p className="eyebrow">Contact</p>
              <h1 className="mt-2 text-[clamp(2rem,5.5vw,3.25rem)] font-extrabold leading-[0.96] tracking-[-0.035em]">
                Get in touch.
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
                Booking a normal lesson? The{" "}
                <Link href="/book" className="font-bold text-ink underline">
                  booking page
                </Link>{" "}
                is faster than any of this. For anything else, here is Conor.
              </p>
            </div>
          </div>
        </Container>
        <Chevrons />
      </section>

      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-start">
          <div>
            <div className="grid gap-3 sm:grid-cols-3">
              <a href={contactLinks.tel} className="panel-quiet block p-5 hover:border-ink">
                <p className="eyebrow">Phone</p>
                <p className="tabular mt-2 text-lg font-extrabold">{CONTACT.phoneDisplay}</p>
                <p className="mt-1 text-sm text-ink-soft">Fastest, during the day</p>
              </a>

              <a
                href={contactLinks.whatsapp()}
                target="_blank"
                rel="noopener noreferrer"
                className="panel-quiet block p-5 hover:border-ink"
              >
                <p className="eyebrow">WhatsApp</p>
                <p className="mt-2 text-lg font-extrabold">Message</p>
                <p className="mt-1 text-sm text-ink-soft">Best if he is teaching</p>
              </a>

              <a href={contactLinks.email} className="panel-quiet block p-5 hover:border-ink">
                <p className="eyebrow">Email</p>
                <p className="mt-2 text-lg font-extrabold">Write</p>
                <p className="mt-1 break-all text-sm text-ink-soft">{CONTACT.email}</p>
              </a>
            </div>

            <div className="rule-heavy mt-10 pt-6">
              <h2 className="text-xl font-extrabold tracking-[-0.02em]">
                Or send a message here
              </h2>
              <p className="mt-2 text-[0.9375rem] text-ink-soft">
                Conor answers the same day, most days.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="panel p-6">
              <p className="eyebrow">Ready to book?</p>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
                You do not need to message first. Pick a time and it is done.
              </p>
              <Link href="/book" className="btn btn-primary mt-5 w-full text-sm">
                Book a lesson
                <ArrowRight />
              </Link>
            </div>

            <div className="panel-quiet p-6">
              <p className="eyebrow">Hours</p>
              <p className="mt-2 text-[0.9375rem]">{OPENING_HOURS.display}</p>
            </div>

            <div className="panel-quiet p-6">
              <p className="eyebrow">Pick-up areas</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {AREAS.map((area) => (
                  <li
                    key={area}
                    className="border border-rule bg-paper px-2.5 py-1 text-xs font-bold"
                  >
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
