// components/HowItWorks.tsx

const STEPS = [
  {
    number: "01",
    title: "Pick your lesson type",
    description: "Choose from standard lessons, EDT packages, pre-test sessions, or car hire for your test.",
  },
  {
    number: "02",
    title: "Choose a time that suits",
    description: "See all available slots on a live calendar and book the one that fits your schedule.",
  },
  {
    number: "03",
    title: "Get instant confirmation",
    description: "Pay securely online and receive a confirmation by email — your lesson is locked in.",
  },
];

export default function HowItWorks() {
  return (
    <section className="space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-red-600 uppercase tracking-wider">How it works</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          A simple booking process
        </h2>
        <p className="text-base text-slate-600">
          Three steps from picking your lesson to driving with confidence.
        </p>
      </div>

      <div className="grid gap-12 md:grid-cols-3 md:gap-8 lg:gap-12 relative">
        {STEPS.map((step, i) => (
          <div key={step.number} className="relative space-y-4">
            {/* Large faded number */}
            <div className="flex items-baseline gap-3">
              <span className="text-6xl lg:text-7xl font-extrabold text-slate-100 leading-none select-none">
                {step.number}
              </span>
              <span className="h-px flex-1 bg-slate-200 mt-3" />
            </div>

            <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
            <p className="text-slate-600 leading-relaxed">{step.description}</p>

            {/* Connecting chevron (desktop only, between cols) */}
            {i < STEPS.length - 1 && (
              <svg
                className="hidden md:block absolute top-8 -right-4 lg:-right-6 h-4 w-4 text-slate-300"
                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
              >
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
