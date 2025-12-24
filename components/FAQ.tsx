// components/FAQ.tsx

type FAQItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Do you pick up from my area?",
    answer: "We cover most areas in South Dublin including Tallaght, Dún Laoghaire, Churchtown, Dundrum, Rathfarnham, Stillorgan, Blackrock, Sandyford, Ballinteer, Kilmacud, Foxrock, and Cabinteely. If you're unsure, contact us to check.",
  },
  {
    question: "Manual or automatic?",
    answer: "We offer lessons in both manual and automatic vehicles. Choose the option that suits you best. If you're unsure, we can discuss which might be better for your needs.",
  },
  {
    question: "What is EDT?",
    answer: "EDT (Essential Driver Training) is a mandatory 12-lesson programme for learner drivers in Ireland. We offer structured EDT packages that cover all required modules, helping you build confidence and skills progressively.",
  },
  {
    question: "How long are lessons?",
    answer: "Standard lessons are typically 60-90 minutes. Pre-test sessions can be longer to cover test routes thoroughly. We'll confirm the exact duration when you book.",
  },
  {
    question: "When are you available?",
    answer: "We offer flexible scheduling including weekday and evening slots. Contact us with your preferred times and we'll work to find a slot that suits you.",
  },
  {
    question: "Do you provide a car for the test?",
    answer: "Yes, we offer car hire for your test day. We have two options: meet at the test centre (€100) or local pick-up and drop-off (€180). The car is fully insured and roadworthy, and we'll arrive early to ensure everything is ready.",
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

