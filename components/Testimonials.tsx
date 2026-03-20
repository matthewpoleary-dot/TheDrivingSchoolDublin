import Link from "next/link";

const REVIEWS = [
  { name: "Aisling M.", date: "Jul 2025", text: "Conor is brilliant — super calm and gave me clear, actionable feedback every lesson. Passed first time in Tallaght." },
  { name: "Dylan O.", date: "Jun 2025", text: "Best instructor I've had. Pre‑test session covered exactly what the examiner looked for on the day." },
  { name: "Aoife K.", date: "Jun 2025", text: "Patient and professional. The EDT plan was structured and I felt my confidence build each week." },
];

function Stars() {
  return (
    <div className="flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-4 w-4 fill-red-500" aria-hidden="true">
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="space-y-8">
      <div className="text-center space-y-2">
        <p className="section-label">Reviews</p>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Trusted by learners across Dublin</h2>
        <p className="text-gray-500 text-sm">Real feedback from students who passed their test</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {REVIEWS.map((r) => (
          <article key={r.name} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-3">
            <Stars />
            <p className="flex-1 text-sm leading-relaxed text-gray-700">{r.text}</p>
            <div className="text-xs text-gray-500">
              <span className="font-medium text-gray-800">{r.name}</span>
              <span className="mx-1.5">·</span>
              <span>{r.date}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="text-center">
        <Link href="/reviews" className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
          Read all reviews →
        </Link>
      </div>
    </section>
  );
}
