import type { Metadata } from "next";
import Link from "next/link";
import { Container, Plate, Chevrons, TickList, ArrowRight } from "@/components/brand";
import { INSTRUCTOR, TEST_CENTRES, contactLinks } from "@/lib/config";

export const metadata: Metadata = {
  title: "About Conor",
  description:
    "Conor is an RSA-approved driving instructor and a former RSA driving tester, who worked in the Tallaght, Dun Laoghaire and Churchtown test centres.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="border-b-2 border-ink bg-paper">
        <Container className="py-10 sm:py-14">
          <div className="flex items-start gap-4">
            <Plate letter="N" size="lg" className="mt-1" />
            <div>
              <p className="eyebrow">The instructor</p>
              <h1 className="mt-2 text-[clamp(2rem,5.5vw,3.25rem)] font-extrabold leading-[0.96] tracking-[-0.035em]">
                He used to be
                <br />
                the examiner.
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
                {INSTRUCTOR.credential}.
              </p>
            </div>
          </div>
        </Container>
        <Chevrons />
      </section>

      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
          <div className="space-y-5 text-[1.0625rem] leading-relaxed">
            <p>
              Most driving instructors have never marked a test. Conor has marked hundreds of
              them. Before he began teaching, he worked as an RSA driving tester in the
              centres at {TEST_CENTRES.join(", ")}, sitting in the passenger seat with the
              marking sheet on his knee.
            </p>
            <p>
              That does something useful to how he teaches. He is not guessing at what
              examiners want, or passing on advice he picked up second-hand. He knows which
              faults get marked, which get let go, and which one small habit turns a good
              drive into a fail on the sheet.
            </p>
            <p>
              In practice it means the feedback is specific. Not &quot;watch your
              observations&quot;, but which junction, which mirror, at what point, and how
              many marks it just cost you. Pupils tend to find the first pre-test lesson a bit
              of a shock, and the second one enormously reassuring.
            </p>
            <p>
              The rest is unremarkable in the best way: he turns up on time, the car is clean
              and dual-controlled, and he is calm with people who are not. Nervous drivers,
              returning drivers, people on their fourth attempt. All routine.
            </p>

            <div className="rule-heavy pt-6">
              <h2 className="text-xl font-extrabold tracking-[-0.02em]">What that gets you</h2>
              <TickList
                className="mt-4"
                items={[
                  "Mock tests marked to the real RSA sheet, fault by fault",
                  "The actual test routes, not approximations of them",
                  "EDT logged to your RSA logbook on the day it is taught",
                  "Dual-control car, taxed, insured and roadworthy",
                  "Door-to-door pick-up across south Dublin",
                  "Patience with nervous and returning drivers",
                ]}
              />
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="panel p-6">
              <p className="eyebrow">Credentials</p>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                    Qualification
                  </dt>
                  <dd className="mt-0.5 font-bold">RSA-approved Driving Instructor</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                    Previous role
                  </dt>
                  <dd className="mt-0.5 font-bold">RSA driving tester</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                    Test centres
                  </dt>
                  <dd className="mt-0.5 font-bold">{TEST_CENTRES.join(", ")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                    Teaches
                  </dt>
                  <dd className="mt-0.5 font-bold">
                    EDT, pre-test, refresher, car hire for test
                  </dd>
                </div>
              </dl>

              <div className="mt-6 border-t-2 border-ink pt-5">
                <Link href="/book" className="btn btn-primary w-full text-sm">
                  Book a lesson
                  <ArrowRight />
                </Link>
                <a
                  href={contactLinks.whatsapp()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-quiet mt-2 w-full text-sm"
                >
                  Ask a question first
                </a>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
