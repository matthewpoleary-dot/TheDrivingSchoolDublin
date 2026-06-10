// components/FAQ.tsx — hairline rows with +/× toggle, no cards
type FAQItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Manual or automatic?",
    answer:
      "We offer lessons for both manual and automatic. Lessons in our instructor's car are manual only. For automatic lessons, you'll need to use your own car. We can discuss which option is best for your needs.",
  },
  {
    question: "What is EDT?",
    answer:
      "EDT (Essential Driver Training) is a mandatory 12-lesson programme for learner drivers in Ireland. We offer structured EDT packages that cover all required modules, helping you build confidence and skills progressively.",
  },
  {
    question: "How long are lessons?",
    answer:
      "Standard lessons are 60 minutes. Pre-test sessions are 90 minutes to cover test routes thoroughly.",
  },
  {
    question: "When are you available?",
    answer:
      "We offer flexible scheduling including weekday and evening slots. Contact us with your preferred times and we'll work to find a slot that suits you.",
  },
  {
    question: "Do you offer weekend lessons?",
    answer:
      "Yes. We run weekend and evening lessons subject to availability. Weekend slots are in high demand and priced at a premium rate reflecting limited instructor availability. Contact us for current rates and availability.",
  },
  {
    question: "Do you provide a car for the test?",
    answer:
      "Yes. We offer car hire for your test day. We have three options: meet at the test centre (from €150), local pickup and drop-off (from €200), or car hire plus a pre-test lesson (from €245). Prices shown are for Monday to Friday tests. Saturday test dates are available on request. The car is fully insured and roadworthy, and we'll arrive early to ensure everything is ready.",
  },
];

export default function FAQ() {
  return (
    <section>
      {/* Heading */}
      <h2
        style={{
          fontFamily: "var(--font-instrument-serif), Georgia, serif",
          fontWeight: 400,
          fontSize: "clamp(40px, 5vw, 64px)",
          lineHeight: 1.05,
          letterSpacing: "-1px",
          marginBottom: 14,
          color: "var(--ink)",
          textAlign: "center",
        }}
      >
        Asked, <em style={{ fontStyle: "italic" }}>answered.</em>
      </h2>
      <p
        style={{
          fontSize: 16,
          letterSpacing: "-0.1px",
          color: "var(--ink-2)",
          marginBottom: 44,
          textAlign: "center",
        }}
      >
        Everything you need to know about our lessons.
      </p>

      {/* Hairline rows */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {FAQ_ITEMS.map((item, i, arr) => (
          <details
            key={i}
            className="faq-row group"
            style={{
              padding: "24px 0",
              borderTop: "1px solid var(--rule)",
              borderBottom: i === arr.length - 1 ? "1px solid var(--rule)" : "none",
            }}
          >
            <summary
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                cursor: "pointer",
                listStyle: "none",
              }}
            >
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 500,
                  color: "var(--ink)",
                  letterSpacing: "-0.2px",
                }}
              >
                {item.question}
              </span>
              <span
                className="faq-toggle"
                aria-hidden="true"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  color: "var(--ink-2)",
                  transition: "transform 0.22s ease, color 0.22s ease",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
            </summary>
            <p
              style={{
                marginTop: 16,
                fontSize: 15,
                lineHeight: 1.65,
                color: "var(--ink-2)",
                paddingRight: 40,
              }}
            >
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
