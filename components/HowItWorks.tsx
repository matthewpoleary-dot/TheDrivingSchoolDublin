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
    title: "We confirm by text or WhatsApp",
    description: "We get back to you the same day to confirm your lesson time and pick-up location.",
  },
];

export default function HowItWorks() {
  return (
    <section className="space-y-8">
      <div className="text-center space-y-2">
        <p className="section-label">Simple process</p>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">How it works</h2>
        <p className="text-gray-500 text-sm">Booking a lesson takes less than a minute</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.number} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white text-sm font-bold mb-4">
              {step.number}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
