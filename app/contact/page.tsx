// app/contact/page.tsx
import Link from "next/link";

const DISPLAY_PHONE = "086 0235 666";
const INTL_PHONE = "+353 86 0235 666";
const TEL_HREF = "tel:+353860235666";
const WHATSAPP_HREF = "https://wa.me/353860235666?text=" +
  encodeURIComponent("Hi! I'd like to arrange a driving lesson.");
const EMAIL = "thedrivingschooldublin@gmail.com";
const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent("Lesson Enquiry")}`;

export default function Contact() {
  return (
    <section className="mx-auto max-w-6xl space-y-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Contact Us</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {/* WhatsApp */}
        <div className="rounded-2xl border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700">WhatsApp</h3>
          <p className="text-xs text-gray-500">Fastest response</p>

          <div className="mt-4">
            <div className="text-3xl font-extrabold text-green-600 leading-none">Chat</div>
            <p className="text-xs text-gray-500 mt-1">Mon–Sat</p>
          </div>

          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-700 transition"
          >
            WhatsApp us
          </a>
        </div>

        {/* Call */}
        <div className="rounded-2xl border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700">Call</h3>
          <p className="text-xs text-gray-500">Talk to an instructor</p>

          <div className="mt-4">
            <div className="text-3xl font-extrabold text-gray-900 leading-tight">
              +353 86 0235 666
            </div>
            <p className="text-xs text-gray-500 mt-1">9am–6pm</p>
          </div>

          <a
            href={TEL_HREF}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-5 py-3 font-medium text-white hover:bg-black transition"
          >
            Call us
          </a>
        </div>

        {/* Email */}
        <div className="rounded-2xl border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700">Email</h3>
          <p className="text-xs text-gray-500">We reply same day</p>

          <div className="mt-4">
            <div className="text-xl font-bold text-red-600 break-all">{EMAIL}</div>
            <p className="text-xs text-gray-500 mt-1">Include your area & car type</p>
          </div>

          <a
            href={MAILTO}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg border px-5 py-3 font-medium hover:bg-gray-50 transition"
          >
            Email us
          </a>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Prefer a call‑back? Send a WhatsApp or email with your availability and location.
      </p>

      {/* Handy quick links row */}
      <div className="flex flex-wrap gap-3 text-sm">
        <a className="underline" href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <span>•</span>
        <a className="underline" href={TEL_HREF}>Call {DISPLAY_PHONE}</a>
        <span>•</span>
        <a className="underline" href={MAILTO}>Email {EMAIL}</a>
        <span>•</span>
        <Link className="underline" href="/prices">See prices</Link>
      </div>
    </section>
  );
}
