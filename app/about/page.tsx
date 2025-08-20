// app/about/page.tsx
import Image from "next/image";

export default function About() {
  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <h1 className="text-3xl font-extrabold tracking-tight">About Us</h1>

      <div className="grid md:grid-cols-2 gap-10 items-start">
        {/* Instructor bio */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Meet Your ADI – Conor</h2>
          <p className="text-gray-700 leading-relaxed">
            Conor is a highly experienced Approved Driving Instructor (ADI) and former RSA
            driving tester. Having worked in test centres across <strong>Tallaght</strong>,{" "}
            <strong>Dún Laoghaire</strong>, and the old <strong>Churchtown</strong> test
            centre, he brings deep insight into what examiners look for on the day of your
            test.
          </p>
          <p className="text-gray-700 leading-relaxed">
            With years of experience in the industry, Conor combines professional standards
            with a calm, supportive teaching style. His background as an ex-tester means
            every lesson is focused not just on safe driving, but also on preparing you to
            succeed under exam conditions.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Whether you’re completing your <strong>EDT programme</strong>, booking{" "}
            <strong>pre-test lessons</strong>, or looking for refresher sessions, Conor
            tailors each lesson to your goals and confidence level.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Patient, structured instruction</li>
            <li>Dual-control, fully insured vehicle</li>
            <li>Specialist in EDT and pre-tests</li>
            <li>Flexible lesson scheduling across Dublin</li>
          </ul>
        </div>

        {/* Instructor image placeholder */}
        <div className="rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center h-80">
          {/* Replace placeholder with a real photo later */}
          <Image
            src="/instructor-placeholder.jpg"
            alt="ADI Conor"
            width={400}
            height={400}
            className="object-cover h-full w-full"
          />
        </div>
      </div>
    </section>
  );
}
