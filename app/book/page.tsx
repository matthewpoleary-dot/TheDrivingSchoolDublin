import BookingWizard from "@/components/booking/BookingWizard";

export default function BookPage() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-red-100/60 blur-3xl"
      />
      <section className="relative mx-auto max-w-6xl pb-12 pt-2">
        <div className="mb-10 max-w-3xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-red-600">
            Book online
          </p>
          <h1 className="text-balance text-4xl font-black tracking-[-0.04em] text-gray-950 sm:text-5xl lg:text-6xl">
            Your next lesson, arranged in a few calm steps.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            Choose the right session, find a live time and secure the booking.
            Pickup is available across our South Dublin service area.
          </p>
        </div>

        <BookingWizard />
      </section>
    </div>
  );
}

