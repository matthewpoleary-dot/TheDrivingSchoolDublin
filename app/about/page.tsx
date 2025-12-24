// app/about/page.tsx
import Image from "next/image";

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
    areaServed: {
      "@type": "City",
      name: "Dublin",
    },
    priceRange: "€€",
  };

  return (
    <>
      <section className="mx-auto max-w-6xl space-y-12">
      {/* Hero heading */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">
          About <span className="text-red-600">Us</span>
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Meet Conor – your RSA-approved ADI and former driving tester, with years
          of experience helping learners succeed across Dublin.
        </p>
      </div>

      {/* Instructor bio card */}
      <div className="grid md:grid-cols-2 gap-10 items-center bg-white shadow-md rounded-2xl p-8">
        {/* Text */}
        <div className="space-y-5">
          <h2 className="text-2xl font-bold">Meet Your ADI – Conor</h2>
          <p className="text-gray-700 leading-relaxed">
            Conor is a highly experienced Approved Driving Instructor (ADI) and
            former RSA driving tester. Having worked in test centres across{" "}
            <strong>Tallaght</strong>, <strong>Dún Laoghaire</strong>, and the old{" "}
            <strong>Churchtown</strong> test centre, he brings deep insight into what
            examiners look for on the day of your test.
          </p>
          <p className="text-gray-700 leading-relaxed">
            With years of experience in the industry, Conor combines professional
            standards with a calm, supportive teaching style. His background as an
            ex-tester means every lesson is focused not just on safe driving, but also
            on preparing you to succeed under exam conditions.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Whether you’re completing your <strong>EDT programme</strong>, booking{" "}
            <strong>pre-test lessons</strong>, or looking for refresher sessions,
            Conor tailors each lesson to your goals and confidence level.
          </p>

          {/* Highlights grid */}
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-gray-50 rounded-lg text-gray-800">
              ✓ Patient, structured instruction
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-gray-800">
              ✓ Dual-control, fully insured vehicle
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-gray-800">
              ✓ Specialist in EDT and pre-tests
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-gray-800">
              ✓ Flexible scheduling across Dublin
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center h-96">
          <Image
            src="/instructor-placeholder.jpg"
            alt="ADI Conor"
            width={450}
            height={450}
            className="object-cover h-full w-full"
          />
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
