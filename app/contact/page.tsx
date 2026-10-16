// app/contact/page.tsx
import ContactForm from "@/components/ContactForm";
import ContactOptions from "@/components/ContactOptions";

const RESPONSE_TIMES = [
  { label: "WhatsApp", text: "Usually within minutes" },
  { label: "Call", text: "9am to 6pm, Mon to Sat" },
  { label: "Email/Form", text: "Same day reply" },
];

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
    <div className="l-page">
      <header className="l-intro">
        <p className="l-eyebrow">Contact</p>
        <h1 className="l-h1">Get in touch.</h1>
        <p className="l-lede">A quick reply, usually within a few hours during business hours.</p>
      </header>

      <section className="l-group">
        <div className="l-split">
          <div className="l-panel">
            <h2 className="l-h3" style={{ fontSize: 28 }}>Send a message</h2>
            <p className="l-hint" style={{ margin: "8px 0 22px" }}>
              Fill out the form and we&apos;ll be in touch shortly.
            </p>
            <ContactForm />
          </div>

          <div>
            <h2 className="l-h3" style={{ fontSize: 28 }}>Or reach out directly</h2>
            <p className="l-hint" style={{ margin: "8px 0 18px" }}>Skip the form and talk to us now.</p>
            <ContactOptions />

            <div style={{ marginTop: 28 }}>
              <h3 className="l-label" style={{ fontSize: 16, marginBottom: 12 }}>Response times</h3>
              <ul className="l-list">
                {RESPONSE_TIMES.map((r) => (
                  <li key={r.label}>
                    <span><strong>{r.label}:</strong> <span style={{ fontWeight: 500 }}>{r.text}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
