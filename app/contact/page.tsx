export default function Contact() {
    return (
      <section className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-extrabold tracking-tight mb-6">Contact Us</h1>

        {/* Cards similar to Prices layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* WhatsApp */}
          <div className="flex flex-col justify-between h-full border rounded-2xl p-6 bg-white shadow-sm">
            <div>
              <h3 className="text-lg font-semibold">WhatsApp</h3>
              <p className="text-sm text-gray-600">Fastest response</p>
              <p className="mt-4 text-4xl font-extrabold text-green-600">Chat</p>
              <p className="text-sm text-gray-500">Mon–Sat</p>
            </div>
            <a
              href="https://wa.me/353XXXXXXXXX?text=Hi%2C%20I%20would%20like%20to%20enquire%20about%20driving%20lessons"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-700 transition"
            >
              WhatsApp us
            </a>
          </div>

          {/* Call */}
          <div className="flex flex-col justify-between h-full border rounded-2xl p-6 bg-white shadow-sm">
            <div>
              <h3 className="text-lg font-semibold">Call</h3>
              <p className="text-sm text-gray-600">Talk to an instructor</p>
              <p className="mt-4 text-4xl font-extrabold text-gray-900">+353 XX XXX XXXX</p>
              <p className="text-sm text-gray-500">9am–6pm</p>
            </div>
            <a
              href="tel:+353XXXXXXXXX"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 font-medium text-white hover:bg-black transition"
            >
              Call us
            </a>
          </div>

          {/* Email */}
          <div className="flex flex-col justify-between h-full border rounded-2xl p-6 bg-white shadow-sm">
            <div>
              <h3 className="text-lg font-semibold">Email</h3>
              <p className="text-sm text-gray-600">We reply same day</p>
              <p className="mt-4 text-4xl font-extrabold text-red-600">info@drivingschooldublin.ie</p>
              <p className="text-sm text-gray-500">Include your area & car type</p>
            </div>
            <a
              href="mailto:info@drivingschooldublin.ie?subject=Lesson%20Enquiry"
              className="mt-6 inline-flex items-center justify-center rounded-lg border px-5 py-3 font-medium hover:bg-gray-50 transition"
            >
              Email us
            </a>
          </div>
        </div>

        <p className="mt-8 text-sm text-gray-600">
          Prefer a call-back? Send a WhatsApp or email with your availability and location.
        </p>
      </section>
    );
  }
  