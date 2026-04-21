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
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
        <p className="text-gray-700">Everything you need to know about our lessons</p>
      </div>
      <div className="space-y-4">
        {FAQ_ITEMS.map((item, i) => (
          <details key={i} className="rounded-lg border bg-white p-6 shadow-sm">
            <summary className="font-semibold text-gray-900 cursor-pointer list-none">
              <span className="flex items-center justify-between">
                {item.question}
                <span className="text-red-600 ml-2">+</span>
              </span>
            </summary>
            <p className="mt-4 text-gray-700 leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
