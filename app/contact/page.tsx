// app/contact/page.tsx
import ContactForm from "@/components/ContactForm";
import ContactOptions from "@/components/ContactOptions";

export default function Contact() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "The Driving School Dublin",
    telephone: "+353860235666",
    email: "thedrivingschooldublin@gmail.com",
    url: "https://thedrivingschooldublin.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dublin",
      addressCountry: "IE",
    },
    openingHours: "Mo-Sa 09:00-18:00",
  };

  return (
    <>
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Contact Us</h1>
          <p className="mt-2 text-gray-600">
            Get in touch and we'll get back to you the same day.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left column: Contact form */}
          <div className="order-1">
            <div className="rounded-2xl border bg-white shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Send us a message</h2>
              <p className="text-sm text-gray-500 mb-6">
                Fill out the form below and we'll be in touch shortly.
              </p>
              <ContactForm />
            </div>
          </div>

          {/* Right column: Contact options */}
          <div className="order-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Or reach out directly</h2>
            <ContactOptions />

            {/* Additional info */}
            <div className="mt-6 rounded-xl bg-gray-50 p-5">
              <h3 className="font-semibold text-gray-900 text-sm">Response times</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• <strong>WhatsApp:</strong> Usually within minutes</li>
                <li>• <strong>Call:</strong> Available 9am–6pm Mon–Sat</li>
                <li>• <strong>Email/Form:</strong> Same day reply</li>
              </ul>
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
