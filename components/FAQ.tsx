"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "Manual or automatic?",
    answer: "We offer both. Manual lessons use our instructor's dual-control car. Automatic lessons require you to use your own car. We can help you decide which suits you best.",
  },
  {
    question: "What is EDT?",
    answer: "EDT (Essential Driver Training) is a mandatory 12-lesson programme for learner drivers in Ireland. Our structured EDT packages cover all required modules, building your confidence and skills progressively.",
  },
  {
    question: "How long are lessons?",
    answer: "Standard lessons are 60 minutes. Pre-test sessions are 90 minutes to give enough time to cover the full test route thoroughly.",
  },
  {
    question: "When are you available?",
    answer: "We offer flexible scheduling including early mornings, weekdays, and evenings. Contact us with your preferred times and we'll find a slot that works.",
  },
  {
    question: "Do you provide a car for the test?",
    answer: "Yes. Options: meet at the test centre (€150), local pick-up & drop-off (€200), or car hire plus a pre-test lesson (€245). The car is fully insured, roadworthy, and we arrive early to get you settled.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <p className="section-label">FAQ</p>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Frequently asked questions</h2>
        <p className="text-gray-500 text-sm">Everything you need to know about our lessons</p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              {item.question}
              <svg
                className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open === i ? "rotate-45" : ""}`}
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 2a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2H9v4a1 1 0 1 1-2 0V9H3a1 1 0 0 1 0-2h4V3a1 1 0 0 1 1-1Z" />
              </svg>
            </button>
            {open === i && (
              <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
