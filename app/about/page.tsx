import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "About | The Driving School Dublin",
  description: "Meet Conor, RSA-approved ADI and former RSA driving tester. Years of experience helping learners pass across Dublin.",
};

const HIGHLIGHTS = [
  "RSA-Approved Driving Instructor (ADI)",
  "Former RSA driving tester",
  "Experience across Tallaght, Dún Laoghaire & Churchtown",
  "Specialist in EDT and pre-test preparation",
  "Flexible scheduling across South Dublin",
  "Calm, structured, one-to-one teaching style",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "The Driving School Dublin",
  url: "https://thedrivingschooldublin.com",
  telephone: "+353860235666",
  email: "thedrivingschooldublin@gmail.com",
  address: { "@type": "PostalAddress", addressLocality: "Dublin", addressCountry: "IE" },
  areaServed: { "@type": "City", name: "Dublin" },
  priceRange: "€€",
};

export default function AboutPage() {
  return (
    <>
      <section className="space-y-16">

        {/* Header */}
        <div className="space-y-3">
          <p className="section-label">About us</p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Meet your instructor
          </h1>
          <p className="text-lg text-gray-500 max-w-xl">
            RSA-approved ADI and former RSA driving tester, with years of experience helping learners succeed across Dublin.
          </p>
        </div>

        {/* Bio card */}
        <div className="grid gap-10 md:grid-cols-2 md:items-center rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-gray-900">Conor — ADI & ex-RSA tester</h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              Conor is a highly experienced Approved Driving Instructor (ADI) and former RSA driving tester.
              Having worked in test centres across <strong className="text-gray-900">Tallaght</strong>,{" "}
              <strong className="text-gray-900">Dún Laoghaire</strong>, and the former{" "}
              <strong className="text-gray-900">Churchtown</strong> test centre, he brings deep insight into
              exactly what examiners look for on the day of your test.
            </p>
            <p className="text-gray-600 leading-relaxed text-sm">
              His background as an ex-tester means every lesson is focused not just on safe driving, but on
              preparing you to succeed under exam conditions — calmly and confidently.
            </p>
            <p className="text-gray-600 leading-relaxed text-sm">
              Whether you&apos;re completing your <strong className="text-gray-900">EDT programme</strong>, booking a{" "}
              <strong className="text-gray-900">pre-test session</strong>, or looking for refresher lessons,
              Conor tailors every lesson to your goals and pace.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/contact" className="btn-primary">Get in touch</Link>
              <Link href="/prices" className="btn-outline">View prices</Link>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden bg-gray-100 aspect-square flex items-center justify-center">
            <Image
              src="/Logo.jpg"
              alt="The Driving School Dublin"
              width={450}
              height={450}
              className="object-contain p-8"
            />
          </div>
        </div>

        {/* Highlights */}
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-gray-900">Why choose us</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {HIGHLIGHTS.map((h) => (
              <div key={h} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm text-sm text-gray-700">
                <svg className="h-4 w-4 shrink-0 text-red-600 mt-0.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0Z" />
                </svg>
                {h}
              </div>
            ))}
          </div>
        </div>

      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
