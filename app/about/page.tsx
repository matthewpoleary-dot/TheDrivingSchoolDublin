// app/about/page.tsx
import Check from "@/components/icons/Check";

const HIGHLIGHTS = [
  "Patient, structured instruction",
  "Manual lessons in dual-control instructor car",
  "Specialist in EDT and pre-tests",
  "Flexible scheduling across South Dublin",
];

export default function About() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "The Driving School Dublin",
    url: "https://thedrivingschooldublin.com",
    telephone: "+353860235666",
    email: "thedrivingschooldublin@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dublin",
      addressCountry: "IE",
    },
    areaServed: { "@type": "City", name: "Dublin" },
    priceRange: "€€",
  };

  return (
    <>
      <section className="space-y-16">
        {/* Hero heading */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-red-600 uppercase tracking-wider">About</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Meet <span className="text-red-600">Conor</span>
          </h1>
          <p className="text-lg text-slate-600">
            Your RSA-approved ADI and former driving tester — years of experience helping Dublin learners pass with confidence.
          </p>
        </div>

        {/* Bio card */}
        <div className="grid md:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center bg-white rounded-3xl p-8 lg:p-12 shadow-md ring-1 ring-slate-100">
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-900">An ex-tester in the driver&apos;s seat with you</h2>
            <p className="text-slate-700 leading-relaxed">
              Conor is a highly experienced Approved Driving Instructor (ADI) and former RSA driving tester. Having worked in test centres across{" "}
              <strong className="text-slate-900">Tallaght</strong>, <strong className="text-slate-900">Dún Laoghaire</strong>, and the old{" "}
              <strong className="text-slate-900">Churchtown</strong> centre, he brings deep insight into what examiners look for on the day.
            </p>
            <p className="text-slate-700 leading-relaxed">
              With years in the industry, Conor combines professional standards with a calm, supportive teaching style. His background as an ex-tester means every lesson is focused not just on safe driving, but on preparing you to succeed under exam conditions.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Whether you&apos;re completing your <strong className="text-slate-900">EDT programme</strong>, booking <strong className="text-slate-900">pre-test lessons</strong>, or looking for refresher sessions, every lesson is tailored to your goals and confidence level.
            </p>

            {/* Highlights */}
            <div className="grid sm:grid-cols-2 gap-3 pt-4">
              {HIGHLIGHTS.map((h) => (
                <div key={h} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                  <Check className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image / placeholder */}
          <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-red-50 via-white to-slate-100 aspect-[4/5] flex items-center justify-center shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/instructor-placeholder.jpg"
              alt="ADI Conor — The Driving School Dublin"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback when image isn't uploaded yet
                e.currentTarget.style.display = "none";
                const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                if (sibling) sibling.style.display = "flex";
              }}
            />
            <div className="hidden flex-col items-center justify-center p-10 text-center w-full h-full">
              <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-900">Conor</p>
              <p className="text-xs text-slate-500 mt-1">RSA-Approved ADI</p>
            </div>
          </div>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
