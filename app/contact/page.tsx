export default function Contact() {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Contact Us</h1>
        <p>Call/WhatsApp: <a className="underline" href="tel:+353XXXXXXXXX">+353 XX XXX XXXX</a></p>
        <p>Email: <a className="underline" href="mailto:info@drivingschooldublin.ie">info@drivingschooldublin.ie</a></p>
        <a
          className="inline-block px-4 py-2 rounded bg-black text-white"
          href="mailto:info@drivingschooldublin.ie?subject=Lesson%20Enquiry"
        >
          Email us
        </a>
      </section>
    );
  }
  