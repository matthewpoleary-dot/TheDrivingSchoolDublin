// components/HowItWorks.tsx

const STEPS = [
  {
    number: "1",
    title: "Pick your lesson type",
    description: "Choose from standard lessons, EDT packages, pre-test sessions, or car hire for your test.",
  },
  {
    number: "2",
    title: "Tell us your availability",
    description: "Contact us via WhatsApp, phone, or email with your preferred times and location.",
  },
  {
    number: "3",
    title: "We confirm by text/WhatsApp/email",
    description: "We'll get back to you as soon as possible to confirm your lesson time and pick-up location.",
  },
];

export default function HowItWorks() {
  return (
    <section className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight">How It Works</h2>
        <p className="text-gray-700">Simple, straightforward booking process</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.number} className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white text-xl font-extrabold">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

