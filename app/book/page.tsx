import { Suspense } from "react";
import type { Metadata } from "next";
import { Container, Plate, Chevrons } from "@/components/brand";
import BookingFlow from "@/components/BookingFlow";
import { BOOKING_POLICY, formatPrice } from "@/lib/config";

export const metadata: Metadata = {
  title: "Book a Driving Lesson",
  description:
    "Pick a time that suits you and book a driving lesson in Dublin online. Real availability, small deposit, free cancellation up to 24 hours before.",
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return (
    <>
      <section className="border-b-2 border-ink bg-paper">
        <Container className="py-10 sm:py-14">
          <div className="flex items-start gap-4">
            <Plate letter="L" size="lg" className="mt-1" />
            <div>
              <p className="eyebrow">Booking</p>
              <h1 className="mt-2 text-[clamp(2rem,5.5vw,3.25rem)] font-extrabold leading-[0.96] tracking-[-0.035em]">
                Pick a time.
                <br />
                That is the whole thing.
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
                Times below come straight from Conor&apos;s calendar, so anything you can see
                is genuinely free. A {formatPrice(BOOKING_POLICY.depositCents)} deposit holds
                it, and the balance is paid on the day.
              </p>
            </div>
          </div>
        </Container>
        <Chevrons />
      </section>

      <Container className="py-12 sm:py-16">
        <Suspense fallback={<BookingSkeleton />}>
          <BookingFlow />
        </Suspense>
      </Container>
    </>
  );
}

function BookingSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-8">
        <div className="skeleton h-8 w-56" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-40" />
      </div>
      <div className="skeleton h-96" />
      <span className="sr-only">Loading the booking form</span>
    </div>
  );
}
