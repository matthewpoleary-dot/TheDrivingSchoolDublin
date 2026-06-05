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
    address: { "@type": "PostalAddress", addressLocality: "Dublin", addressCountry: "IE" },
    openingHours: "Mo-Sa 09:00-18:00",
  };

  return (
    <>
      <section className="space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-red-600 uppercase tracking-wider">Contact</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Get in touch
          </h1>
          <p className="text-lg text-slate-600">
            Quick reply — usually within a few hours during business hours.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          {/* Form */}
          <div className="order-1">
            <div className="rounded-2xl bg-white p-7 lg:p-10 shadow-md ring-1 ring-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Send us a message</h2>
              <p className="text-sm text-slate-500 mb-6">
                Fill out the form and we&apos;ll be in touch shortly.
              </p>
              <ContactForm />
            </div>
          </div>

          {/* Options */}
          <div className="order-2 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Or reach out directly</h2>
              <p className="text-sm text-slate-500 mb-5">Skip the form — message us live.</p>
              <ContactOptions />
            </div>

            <div className="rounded-2xl bg-slate-50 p-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Response times</h3>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-red-600" />
                  <span><strong className="text-slate-900">WhatsApp:</strong> Usually within minutes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-red-600" />
                  <span><strong className="text-slate-900">Call:</strong> 9am–6pm Mon–Sat</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-red-600" />
                  <span><strong className="text-slate-900">Email/Form:</strong> Same day reply</span>
                </li>
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
