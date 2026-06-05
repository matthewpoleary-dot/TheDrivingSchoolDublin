// components/FAQ.tsx

type FAQItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Manual or automatic?",
    answer: "We offer lessons for both manual and automatic. Lessons in our instructor's car are manual only. For automatic lessons, you'll need to use your own car. We can discuss which option is best for your needs.",
  },
  {
    question: "What is EDT?",
    answer: "EDT (Essential Driver Training) is a mandatory 12-lesson programme for learner drivers in Ireland. We offer structured EDT packages that cover all required modules, helping you build confidence and skills progressively.",
  },
  {
    question: "How long are lessons?",
    answer: "Standard lessons are 60 minutes. Pre-test sessions are 90 minutes to cover test routes thoroughly.",
  },
  {
    question: "When are you available?",
    answer: "We offer flexible scheduling including weekday and evening slots. Contact us with your preferred times and we'll work to find a slot that suits you.",
  },
  {
    question: "Do you offer weekend lessons?",
    answer: "Yes — we run weekend and evening lessons subject to availability. Weekend slots are in high demand and priced at a premium rate reflecting limited instructor availability. Contact us for current rates and availability.",
  },
  {
    question: "Do you provide a car for the test?",
    answer: "Yes, we offer car hire for your test day. We have three options: meet at the test centre (from €150), local pick-up and drop-off (from €200), or car hire plus a pre-test lesson (from €245). Prices shown are for Monday–Friday tests; Saturday test dates are available on request. The car is fully insured and roadworthy, and we'll arrive early to ensure everything is ready.",
  },
];

export default function FAQ() {
  return (
    <section className="space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-red-600 uppercase tracking-wider">FAQ</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Frequently asked questions
        </h2>
        <p className="text-base text-slate-600">Everything you need to know about our lessons.</p>
      </div>

      <div className="space-y-3 max-w-3xl mx-auto">
        {FAQ_ITEMS.map((item, i) => (
          <details
            key={i}
            className="group rounded-2xl bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md open:shadow-md open:ring-1 open:ring-red-100"
          >
            <summary className="flex items-center justify-between gap-3 cursor-pointer list-none">
              <span className="text-base font-semibold text-slate-900 group-open:text-red-600 transition-colors">
                {item.question}
              </span>
              <span className="flex-shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 text-slate-500 group-open:bg-red-50 group-open:text-red-600 group-open:rotate-45 transition-all duration-200">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 5a.75.75 0 01.75.75v3.5h3.5a.75.75 0 010 1.5h-3.5v3.5a.75.75 0 01-1.5 0v-3.5h-3.5a.75.75 0 010-1.5h3.5v-3.5A.75.75 0 0110 5z" clipRule="evenodd" />
                </svg>
              </span>
            </summary>
            <p className="mt-4 text-slate-600 leading-relaxed pr-10">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
